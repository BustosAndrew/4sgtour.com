import { createClient } from "@/lib/supabase/server"
import { headers } from "next/headers"
import { getUserType } from "@/lib/supabase/get-user-type"
import { runWithConcurrency } from "@/lib/run-with-concurrency"

// Translation jobs fan out into many AI Gateway calls (per language,
// per add-on table, per row). The default function timeout is too
// short, so bump it. Vercel will cap to whatever the plan supports.
export const maxDuration = 300

// Max simultaneous AI Gateway requests in flight at once. Keep this
// low so we never burst into a 429 rate-limit response when a trip
// has many add-ons or two target languages.
const AI_CONCURRENCY = 3

const LANGUAGE_MAP: Record<string, { name: string; code: string }> = {
  en: { name: "English", code: "en" },
  ko: { name: "Korean", code: "ko" },
  de: { name: "German", code: "de" },
}

// Field mappings for each language suffix.
// "long" fields are translated one-per-batch-call so a single oversized
// markdown body cannot truncate the structured-output JSON and starve the
// other fields of their translations.
const TRIP_FIELDS: Record<string, { type: string; long?: boolean }> = {
  title: { type: "title" },
  location: { type: "location" },
  description: { type: "description", long: true },
  refund_policy: { type: "description", long: true },
  overview_content: { type: "description", long: true },
}

const TRIP_ARRAY_FIELDS = ["highlights"]

type FieldPayload = { field: string; text: string; fieldType: string }

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = await createClient()
  const userType = await getUserType()

  if (userType !== "admin") {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    })
  }

  let body: any
  try {
    body = await request.json()
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    })
  }

  const { sourceLanguage, targetLanguages } = body || {}

  if (!sourceLanguage || !targetLanguages?.length) {
    return new Response(
      JSON.stringify({ error: "Source language and target languages are required" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    )
  }
  if (!["en", "ko", "de"].includes(sourceLanguage)) {
    return new Response(JSON.stringify({ error: "Invalid source language" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    })
  }
  const validTargets = (targetLanguages as string[]).filter(
    (l) => ["en", "ko", "de"].includes(l) && l !== sourceLanguage,
  )
  if (validTargets.length === 0) {
    return new Response(
      JSON.stringify({ error: "At least one valid target language is required" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    )
  }

  // Fetch the trip up-front so we can pre-count work for the progress bar
  const { data: trip, error: tripErr } = await supabase
    .from("trips")
    .select("*")
    .eq("id", id)
    .single()
  if (tripErr || !trip) {
    return new Response(JSON.stringify({ error: "Trip not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    })
  }

  const headersList = await headers()
  const host = headersList.get("host") || "localhost:3000"
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http"
  const baseUrl = `${protocol}://${host}`

  const sourceSuffix = sourceLanguage === "en" ? "" : `_${sourceLanguage}`

  // Prefetch related rows so we can pre-count the total work units
  const [
    { data: packages },
    addOnsRes,
    golfCoursesRes,
    mealOptionsRes,
    transportRes,
    serviceRes,
  ] = await Promise.all([
    supabase.from("packages").select("*").eq("trip_id", id),
    supabase.from("add_ons").select("*").eq("trip_id", id),
    supabase.from("trip_golf_courses").select("*").eq("trip_id", id),
    supabase.from("trip_meal_options").select("*").eq("trip_id", id),
    supabase.from("trip_transportation_options").select("*").eq("trip_id", id),
    supabase.from("trip_service_options").select("*").eq("trip_id", id),
  ])

  // Pre-count every translatable field across all targets so the progress
  // bar starts with a real total. We intentionally do NOT skip fields that
  // already have translations — every source field with content is always
  // retranslated so admins can re-run the dialog to repair stale or
  // partial translations without having to clear the target fields first.
  let totalRequested = 0
  for (const _targetLang of validTargets) {
    for (const fieldBase of Object.keys(TRIP_FIELDS)) {
      const sourceValue = trip[`${fieldBase}${sourceSuffix}`]
      if (typeof sourceValue === "string" && sourceValue.trim()) {
        totalRequested++
      }
    }
    for (const arrayField of TRIP_ARRAY_FIELDS) {
      const sourceArr = trip[`${arrayField}${sourceSuffix}`]
      if (Array.isArray(sourceArr)) {
        totalRequested += sourceArr.filter(
          (t) => typeof t === "string" && t.trim().length > 0,
        ).length
      }
    }
    for (const pkg of packages || []) {
      const sourceName = pkg[`name${sourceSuffix}`]
      if (typeof sourceName === "string" && sourceName.trim()) totalRequested++
      const sourceDesc = pkg[`description${sourceSuffix}`]
      if (typeof sourceDesc === "string" && sourceDesc.trim()) totalRequested++
    }
    const tables: { rows: any[] | null; nameField: string }[] = [
      { rows: addOnsRes.data, nameField: "name" },
      { rows: golfCoursesRes.data, nameField: "course_name" },
      { rows: mealOptionsRes.data, nameField: "name" },
      { rows: transportRes.data, nameField: "name" },
      { rows: serviceRes.data, nameField: "name" },
    ]
    for (const { rows, nameField } of tables) {
      for (const row of rows || []) {
        const sourceName = row[`${nameField}${sourceSuffix}`]
        if (typeof sourceName === "string" && sourceName.trim()) totalRequested++
        const sourceDesc = row[`description${sourceSuffix}`]
        if (typeof sourceDesc === "string" && sourceDesc.trim()) totalRequested++
      }
    }
  }

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: any) => {
        controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"))
      }

      let done = 0
      let totalApplied = 0
      const failedFields: string[] = []

      const tick = (units: number, label: string) => {
        done = Math.min(totalRequested, done + units)
        send({ type: "progress", done, total: totalRequested, label })
      }

      send({ type: "start", total: totalRequested })

      // Nothing translatable on the source side at all.
      if (totalRequested === 0) {
        const langNames: Record<string, string> = {
          en: "English",
          ko: "Korean",
          de: "German",
        }
        const sourceName = langNames[sourceLanguage] ?? sourceLanguage
        send({
          type: "complete",
          success: false,
          partial: false,
          message: `No ${sourceName} content found on this trip to translate. Please add content in ${sourceName} first.`,
          fieldsRequested: 0,
          fieldsUpdated: 0,
          failedFields: [],
        })
        controller.close()
        return
      }

      const callBatch = async (
        fields: FieldPayload[],
        targetLang: string,
      ): Promise<{ translations: Record<string, string>; failed: string[] }> => {
        if (fields.length === 0) return { translations: {}, failed: [] }

        const doFetch = async (chunk: FieldPayload[]) => {
          const response = await fetch(`${baseUrl}/api/translate/batch`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fields: chunk,
              targetLanguage: targetLang,
              sourceLanguage,
            }),
          })
          if (!response.ok) {
            let errPayload: any = null
            try {
              errPayload = await response.json()
            } catch {}
            throw Object.assign(new Error(errPayload?.error || "Translation failed"), {
              status: response.status,
              code: errPayload?.code,
            })
          }
          return (await response.json()) as {
            translations?: Record<string, string>
            missingKeys?: string[]
          }
        }

        const first = await doFetch(fields)
        const translations: Record<string, string> = { ...(first.translations || {}) }
        const missing = (first.missingKeys || []).filter((k) => !(k in translations))

        if (missing.length === 0) return { translations, failed: [] }

        const retryTasks = missing.map((key) => async () => {
          const original = fields.find((f) => f.field === key)
          if (!original) return { key, value: null as string | null }
          try {
            const retry = await doFetch([original])
            return { key, value: retry.translations?.[key] ?? null }
          } catch (e) {
            console.error(`[translate-trip] Retry failed for ${key}:`, e)
            return { key, value: null }
          }
        })
        const retryResults = await runWithConcurrency(retryTasks, AI_CONCURRENCY)
        const failed: string[] = []
        for (const { key, value } of retryResults) {
          if (value) translations[key] = value
          else failed.push(key)
        }
        return { translations, failed }
      }

      const wrap = <T,>(
        label: string,
        units: number,
        fn: () => Promise<T>,
      ): (() => Promise<T>) => async () => {
        try {
          const r = await fn()
          tick(units, label)
          return r
        } catch (e) {
          tick(units, label)
          throw e
        }
      }

      try {
        const updates: Record<string, any> = {}

        for (const targetLang of validTargets) {
          const targetSuffix = targetLang === "en" ? "" : `_${targetLang}`
          const langName = LANGUAGE_MAP[targetLang].name

          const shortFields: FieldPayload[] = []
          const longFields: FieldPayload[] = []
          for (const [fieldBase, meta] of Object.entries(TRIP_FIELDS)) {
            const sourceField = `${fieldBase}${sourceSuffix}`
            const targetField = `${fieldBase}${targetSuffix}`
            const sourceValue = trip[sourceField]
            if (typeof sourceValue !== "string" || !sourceValue.trim()) continue
            // No dirty checking — always retranslate so re-running the
            // dialog can repair stale or partially-applied translations.
            const payload: FieldPayload = {
              field: targetField,
              text: sourceValue,
              fieldType: meta.type,
            }
            if (meta.long) longFields.push(payload)
            else shortFields.push(payload)
          }

          const tripFieldTasks: Array<() => Promise<{
            translations: Record<string, string>
            failed: string[]
          }>> = [
            wrap(`Trip details (${langName})`, shortFields.length, () =>
              callBatch(shortFields, targetLang),
            ),
            ...longFields.map((f) =>
              wrap(`${humanize(f.field, targetSuffix)} (${langName})`, 1, () =>
                callBatch([f], targetLang),
              ),
            ),
          ]
          const tripFieldResults = await runWithConcurrency(tripFieldTasks, AI_CONCURRENCY)
          for (const r of tripFieldResults) {
            Object.assign(updates, r.translations)
            totalApplied += Object.keys(r.translations).length
            failedFields.push(...r.failed)
          }

          for (const arrayField of TRIP_ARRAY_FIELDS) {
            const sourceValue = trip[`${arrayField}${sourceSuffix}`]
            if (!Array.isArray(sourceValue) || sourceValue.length === 0) continue

            const arrPayload: FieldPayload[] = sourceValue
              .map((text: string, i: number) => ({
                field: `${arrayField}_${i}`,
                text,
                fieldType: "highlight",
              }))
              .filter((p) => typeof p.text === "string" && p.text.trim().length > 0)
            if (arrPayload.length === 0) continue

            const arrResult = await wrap(`Highlights (${langName})`, arrPayload.length, () =>
              callBatch(arrPayload, targetLang),
            )()
            totalApplied += Object.keys(arrResult.translations).length
            failedFields.push(...arrResult.failed)

            const targetField = `${arrayField}${targetSuffix}`
            const translatedArray = sourceValue
              .map((_: string, i: number) => arrResult.translations[`${arrayField}_${i}`] || "")
              .filter((t: string) => t)
            if (translatedArray.length > 0) updates[targetField] = translatedArray
          }
        }

        if (packages?.length) {
          for (const targetLang of validTargets) {
            const targetSuffix = targetLang === "en" ? "" : `_${targetLang}`
            const langName = LANGUAGE_MAP[targetLang].name
            for (const pkg of packages) {
              const fields: FieldPayload[] = []
              const sourceName = pkg[`name${sourceSuffix}`]
              const sourceDescription = pkg[`description${sourceSuffix}`]

              // No dirty checking — always retranslate available source fields.
              if (typeof sourceName === "string" && sourceName.trim()) {
                fields.push({
                  field: `name${targetSuffix}`,
                  text: sourceName,
                  fieldType: "title",
                })
              }
              if (typeof sourceDescription === "string" && sourceDescription.trim()) {
                fields.push({
                  field: `description${targetSuffix}`,
                  text: sourceDescription,
                  fieldType: "description",
                })
              }
              if (fields.length === 0) continue

              const result = await wrap(`Package (${langName})`, fields.length, () =>
                callBatch(fields, targetLang),
              )()
              totalApplied += Object.keys(result.translations).length
              failedFields.push(...result.failed)

              if (Object.keys(result.translations).length > 0) {
                const { error: pkgErr } = await supabase
                  .from("packages")
                  .update(result.translations)
                  .eq("id", pkg.id)
                if (pkgErr)
                  console.error(`[translate-trip] Failed updating package ${pkg.id}:`, pkgErr)
              }
            }
          }
        }

        const translateSimpleTable = async (
          table: string,
          tableLabel: string,
          rows: any[],
          nameField: string,
          descriptionField: string | null,
        ) => {
          if (!rows?.length) return
          for (const targetLang of validTargets) {
            const targetSuffix = targetLang === "en" ? "" : `_${targetLang}`
            const langName = LANGUAGE_MAP[targetLang].name
            for (const row of rows) {
              const fields: FieldPayload[] = []
              const sourceName = row[`${nameField}${sourceSuffix}`]

              // No dirty checking — always retranslate available source fields.
              if (typeof sourceName === "string" && sourceName.trim()) {
                fields.push({
                  field: `${nameField}${targetSuffix}`,
                  text: sourceName,
                  fieldType: "title",
                })
              }
              if (descriptionField) {
                const sourceDesc = row[`${descriptionField}${sourceSuffix}`]
                if (typeof sourceDesc === "string" && sourceDesc.trim()) {
                  fields.push({
                    field: `${descriptionField}${targetSuffix}`,
                    text: sourceDesc,
                    fieldType: "description",
                  })
                }
              }
              if (!fields.length) continue

              try {
                const result = await wrap(
                  `${tableLabel} (${langName})`,
                  fields.length,
                  () => callBatch(fields, targetLang),
                )()
                totalApplied += Object.keys(result.translations).length
                failedFields.push(...result.failed)
                if (Object.keys(result.translations).length > 0) {
                  const { error: tblErr } = await supabase
                    .from(table)
                    .update(result.translations)
                    .eq("id", row.id)
                  if (tblErr)
                    console.error(
                      `[translate-trip] Failed updating ${table} ${row.id}:`,
                      tblErr,
                    )
                }
              } catch (e) {
                console.error(`[translate-trip] Error translating ${table} row ${row.id}:`, e)
                failedFields.push(...fields.map((f) => f.field))
              }
            }
          }
        }

        await translateSimpleTable(
          "add_ons",
          "Add-ons",
          addOnsRes.data || [],
          "name",
          "description",
        )
        await translateSimpleTable(
          "trip_golf_courses",
          "Golf course",
          golfCoursesRes.data || [],
          "course_name",
          "description",
        )
        await translateSimpleTable(
          "trip_meal_options",
          "Meal option",
          mealOptionsRes.data || [],
          "name",
          "description",
        )
        await translateSimpleTable(
          "trip_transportation_options",
          "Transportation",
          transportRes.data || [],
          "name",
          "description",
        )
        await translateSimpleTable(
          "trip_service_options",
          "Service option",
          serviceRes.data || [],
          "name",
          "description",
        )

        if (Object.keys(updates).length > 0) {
          const { error: updateError } = await supabase
            .from("trips")
            .update(updates)
            .eq("id", id)
          if (updateError) {
            console.error("[translate-trip] trips update error:", updateError)
            send({
              type: "error",
              error: "Failed to save translations",
              code: "DB_ERROR",
              status: 500,
            })
            controller.close()
            return
          }
        }

        const targetNames = validTargets.map((l) => LANGUAGE_MAP[l].name).join(" & ")
        const partial = failedFields.length > 0
        const message = partial
          ? `Translated ${totalApplied}/${totalRequested} fields to ${targetNames}. ${failedFields.length} field(s) could not be translated — try again.`
          : `Translated ${totalApplied} fields to ${targetNames}`

        send({
          type: "complete",
          success: !partial || totalApplied > 0,
          partial,
          message,
          fieldsRequested: totalRequested,
          fieldsUpdated: totalApplied,
          failedFields,
        })
      } catch (error: any) {
        console.error("Error in translate-trip:", error)
        send({
          type: "error",
          error:
            error?.message ||
            `Translation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
          code: error?.code || "TRANSLATION_ERROR",
          status: error?.status || 500,
        })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "application/x-ndjson",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  })
}

// "overview_content_ko" → "Overview content"
function humanize(field: string, suffix: string): string {
  let base = field
  if (suffix && base.endsWith(suffix)) base = base.slice(0, -suffix.length)
  base = base.replace(/_/g, " ").trim()
  return base.charAt(0).toUpperCase() + base.slice(1)
}
