import { createClient } from "@/lib/supabase/server"

import { getUserType } from "@/lib/supabase/get-user-type"
import { runWithConcurrency } from "@/lib/run-with-concurrency"
import { translateFields } from "@/lib/translate-text"
import {
  countUnits,
  createShouldTranslate,
  createStaleCheck,
  parseDirtyCheckOptions,
  suffixFor,
  type ShouldTranslate,
} from "@/lib/translation-dirty"

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

  // `force` is the admin "Retranslate everything" repair switch;
  // `changedFields` is the per-language diff the edit form got back from
  // its save, so only fields whose source text actually moved get redone.
  const { force, changedFields } = parseDirtyCheckOptions(body)

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

  // One predicate per target language, shared by the pre-count below and
  // the execution pass further down. Both MUST ask the same question about
  // the same field — counting one set and translating another is what
  // leaves the progress bar stranded short of 100%.
  const shouldTranslateFor = new Map<string, ShouldTranslate>()
  for (const targetLang of validTargets) {
    shouldTranslateFor.set(
      targetLang,
      createShouldTranslate({
        force,
        stale: createStaleCheck(changedFields, sourceLanguage, targetLang),
      }),
    )
  }

  // Child rows get their base field name qualified with the table, so a
  // change to the trip's own `description` cannot mark every package
  // description stale as well.
  const CHILD_TABLES: { rows: any[] | null; nameField: string; table: string }[] = [
    { rows: addOnsRes.data, nameField: "name", table: "add_ons" },
    { rows: golfCoursesRes.data, nameField: "course_name", table: "trip_golf_courses" },
    { rows: mealOptionsRes.data, nameField: "name", table: "trip_meal_options" },
    { rows: transportRes.data, nameField: "name", table: "trip_transportation_options" },
    { rows: serviceRes.data, nameField: "name", table: "trip_service_options" },
  ]

  // Pre-count the work the run will actually do. Fields that already carry
  // a good translation are counted separately so the "nothing to do" case
  // can tell "no source content" apart from "already up to date".
  let totalRequested = 0
  let skippedUpToDate = 0
  for (const targetLang of validTargets) {
    const targetSuffix = suffixFor(targetLang)
    const should = shouldTranslateFor.get(targetLang)!

    const count = (base: string, sourceValue: unknown, targetValue: unknown) => {
      const units = countUnits(sourceValue)
      if (units === 0) return
      if (should(base, sourceValue, targetValue)) totalRequested += units
      else skippedUpToDate += units
    }

    for (const fieldBase of Object.keys(TRIP_FIELDS)) {
      count(
        fieldBase,
        trip[`${fieldBase}${sourceSuffix}`],
        trip[`${fieldBase}${targetSuffix}`],
      )
    }
    for (const arrayField of TRIP_ARRAY_FIELDS) {
      count(
        arrayField,
        trip[`${arrayField}${sourceSuffix}`],
        trip[`${arrayField}${targetSuffix}`],
      )
    }
    for (const pkg of packages || []) {
      count(
        "packages.name",
        pkg[`name${sourceSuffix}`],
        pkg[`name${targetSuffix}`],
      )
      count(
        "packages.description",
        pkg[`description${sourceSuffix}`],
        pkg[`description${targetSuffix}`],
      )
    }
    for (const { rows, nameField, table } of CHILD_TABLES) {
      for (const row of rows || []) {
        count(
          `${table}.${nameField}`,
          row[`${nameField}${sourceSuffix}`],
          row[`${nameField}${targetSuffix}`],
        )
        count(
          `${table}.description`,
          row[`description${sourceSuffix}`],
          row[`description${targetSuffix}`],
        )
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

      // Nothing to do — either there is no source content, or (with dirty
      // checking on) every field is already translated. Those are very
      // different situations for the admin, so say which one it is.
      if (totalRequested === 0) {
        const langNames: Record<string, string> = {
          en: "English",
          ko: "Korean",
          de: "German",
        }
        const sourceName = langNames[sourceLanguage] ?? sourceLanguage
        const upToDate = skippedUpToDate > 0
        send({
          type: "complete",
          success: upToDate,
          partial: false,
          message: upToDate
            ? `Everything is already translated — nothing changed since the last run. Tick "Retranslate everything" to redo all ${skippedUpToDate} field(s).`
            : `No ${sourceName} content found on this trip to translate. Please add content in ${sourceName} first.`,
          fieldsRequested: 0,
          fieldsUpdated: 0,
          skipped: skippedUpToDate,
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

        // Called in-process. This used to POST to `${baseUrl}/api/translate/batch`,
        // which spent a whole extra function invocation (plus its cold start
        // and middleware pass) per batch to run code already in this bundle.
        // `translateFields` throws a TranslationError carrying the same
        // `status`/`code` the HTTP path used to surface.
        const doFetch = async (chunk: FieldPayload[]) =>
          translateFields({
            fields: chunk,
            targetLanguage: targetLang,
            sourceLanguage,
          })

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
          const should = shouldTranslateFor.get(targetLang)!

          const shortFields: FieldPayload[] = []
          const longFields: FieldPayload[] = []
          for (const [fieldBase, meta] of Object.entries(TRIP_FIELDS)) {
            const sourceField = `${fieldBase}${sourceSuffix}`
            const targetField = `${fieldBase}${targetSuffix}`
            const sourceValue = trip[sourceField]
            if (!should(fieldBase, sourceValue, trip[targetField])) continue
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
            // Arrays are rewritten whole, so they are skipped whole too.
            if (
              !should(
                arrayField,
                sourceValue,
                trip[`${arrayField}${targetSuffix}`],
              )
            )
              continue

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
            const should = shouldTranslateFor.get(targetLang)!
            for (const pkg of packages) {
              const fields: FieldPayload[] = []
              const sourceName = pkg[`name${sourceSuffix}`]
              const sourceDescription = pkg[`description${sourceSuffix}`]

              if (
                should("packages.name", sourceName, pkg[`name${targetSuffix}`])
              ) {
                fields.push({
                  field: `name${targetSuffix}`,
                  text: sourceName,
                  fieldType: "title",
                })
              }
              if (
                should(
                  "packages.description",
                  sourceDescription,
                  pkg[`description${targetSuffix}`],
                )
              ) {
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
            const should = shouldTranslateFor.get(targetLang)!
            for (const row of rows) {
              const fields: FieldPayload[] = []
              const sourceName = row[`${nameField}${sourceSuffix}`]

              if (
                should(
                  `${table}.${nameField}`,
                  sourceName,
                  row[`${nameField}${targetSuffix}`],
                )
              ) {
                fields.push({
                  field: `${nameField}${targetSuffix}`,
                  text: sourceName,
                  fieldType: "title",
                })
              }
              if (descriptionField) {
                const sourceDesc = row[`${descriptionField}${sourceSuffix}`]
                if (
                  should(
                    `${table}.description`,
                    sourceDesc,
                    row[`${descriptionField}${targetSuffix}`],
                  )
                ) {
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
        const skippedNote =
          skippedUpToDate > 0
            ? ` ${skippedUpToDate} field(s) were already up to date and were skipped.`
            : ""
        const message = partial
          ? `Translated ${totalApplied}/${totalRequested} fields to ${targetNames}. ${failedFields.length} field(s) could not be translated — try again.${skippedNote}`
          : `Translated ${totalApplied} fields to ${targetNames}.${skippedNote}`

        send({
          type: "complete",
          success: !partial || totalApplied > 0,
          partial,
          message,
          fieldsRequested: totalRequested,
          fieldsUpdated: totalApplied,
          skipped: skippedUpToDate,
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
