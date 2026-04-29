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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const userType = await getUserType()

    if (userType !== "admin") {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      })
    }

    const body = await request.json()
    const { sourceLanguage, targetLanguages } = body

    if (!sourceLanguage || !targetLanguages?.length) {
      return new Response(JSON.stringify({ error: "Source language and target languages are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    if (!["en", "ko", "de"].includes(sourceLanguage)) {
      return new Response(JSON.stringify({ error: "Invalid source language" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    const validTargets = targetLanguages.filter(
      (l: string) => ["en", "ko", "de"].includes(l) && l !== sourceLanguage,
    )
    if (validTargets.length === 0) {
      return new Response(JSON.stringify({ error: "At least one valid target language is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Fetch the trip
    const { data: trip, error } = await supabase.from("trips").select("*").eq("id", id).single()

    if (error || !trip) {
      return new Response(JSON.stringify({ error: "Trip not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      })
    }

    const headersList = await headers()
    const host = headersList.get("host") || "localhost:3000"
    const protocol = process.env.NODE_ENV === "production" ? "https" : "http"
    const baseUrl = `${protocol}://${host}`

    // Helper: call the batch translation API for a chunk of fields.
    // Retries any keys the model dropped (typically due to JSON
    // truncation) one more time on its own. Returns the merged
    // {field: translation} record plus any keys that still failed.
    const callBatch = async (
      fields: FieldPayload[],
      targetLang: string,
    ): Promise<{ translations: Record<string, string>; failed: string[] }> => {
      if (fields.length === 0) return { translations: {}, failed: [] }

      const doFetch = async (chunk: FieldPayload[]) => {
        const response = await fetch(`${baseUrl}/api/translate/batch`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fields: chunk, targetLanguage: targetLang, sourceLanguage }),
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

      if (missing.length > 0) {
        console.warn(
          `[translate-trip] Retrying ${missing.length} missing key(s) for ${targetLang}: ${missing.join(", ")}`,
        )
        // Retry the missing fields one at a time so a long body can't
        // crowd out shorter siblings on the second pass either, with
        // bounded concurrency so we don't burst into the rate limit.
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

      return { translations, failed: [] }
    }

    const updates: Record<string, any> = {}
    let totalRequested = 0
    let totalApplied = 0
    const failedFields: string[] = []

    const sourceSuffix = sourceLanguage === "en" ? "" : `_${sourceLanguage}`

    // Translate simple text fields, per target language. Long-bodied
    // fields go in their own per-call chunk so structured-output
    // truncation can't lose them.
    for (const targetLang of validTargets) {
      const targetSuffix = targetLang === "en" ? "" : `_${targetLang}`

      const shortFields: FieldPayload[] = []
      const longFields: FieldPayload[] = []

      for (const [fieldBase, meta] of Object.entries(TRIP_FIELDS)) {
        const sourceField = `${fieldBase}${sourceSuffix}`
        const targetField = `${fieldBase}${targetSuffix}`
        const sourceValue = trip[sourceField]
        if (typeof sourceValue !== "string" || !sourceValue.trim()) continue

        const payload: FieldPayload = {
          field: targetField,
          text: sourceValue,
          fieldType: meta.type,
        }
        if (meta.long) longFields.push(payload)
        else shortFields.push(payload)
      }

      totalRequested += shortFields.length + longFields.length

      // Short fields go in one combined call; long fields each get their
      // own call. Cap how many run at once so we don't trip rate limits.
      const tripFieldTasks: Array<() => Promise<{ translations: Record<string, string>; failed: string[] }>> = [
        () => callBatch(shortFields, targetLang),
        ...longFields.map((f) => () => callBatch([f], targetLang)),
      ]
      const tripFieldResults = await runWithConcurrency(tripFieldTasks, AI_CONCURRENCY)

      for (const r of tripFieldResults) {
        Object.assign(updates, r.translations)
        totalApplied += Object.keys(r.translations).length
        failedFields.push(...r.failed)
      }

      // Translate array fields (highlights). Each item becomes its own
      // key, so this is naturally one-per-item even inside the batch.
      for (const arrayField of TRIP_ARRAY_FIELDS) {
        const sourceField = `${arrayField}${sourceSuffix}`
        const targetField = `${arrayField}${targetSuffix}`
        const sourceValue = trip[sourceField]
        if (!Array.isArray(sourceValue) || sourceValue.length === 0) continue

        const arrPayload: FieldPayload[] = sourceValue
          .map((text: string, i: number) => ({
            field: `${arrayField}_${i}`,
            text,
            fieldType: "highlight",
          }))
          .filter((p) => typeof p.text === "string" && p.text.trim().length > 0)

        if (arrPayload.length === 0) continue

        totalRequested += arrPayload.length
        const arrResult = await callBatch(arrPayload, targetLang)
        totalApplied += Object.keys(arrResult.translations).length
        failedFields.push(...arrResult.failed)

        const translatedArray = sourceValue
          .map((_: string, i: number) => arrResult.translations[`${arrayField}_${i}`] || "")
          .filter((t: string) => t)
        if (translatedArray.length > 0) {
          updates[targetField] = translatedArray
        }
      }
    }

    // Translate packages (each package's name + description per target language)
    const { data: packages } = await supabase.from("packages").select("*").eq("trip_id", id)

    if (packages?.length) {
      for (const targetLang of validTargets) {
        const targetSuffix = targetLang === "en" ? "" : `_${targetLang}`

        for (const pkg of packages) {
          const fields: FieldPayload[] = []
          const sourceName = pkg[`name${sourceSuffix}`]
          const sourceDescription = pkg[`description${sourceSuffix}`]
          if (typeof sourceName === "string" && sourceName.trim()) {
            fields.push({ field: `name${targetSuffix}`, text: sourceName, fieldType: "title" })
          }
          if (typeof sourceDescription === "string" && sourceDescription.trim()) {
            fields.push({
              field: `description${targetSuffix}`,
              text: sourceDescription,
              fieldType: "description",
            })
          }
          if (fields.length === 0) continue

          totalRequested += fields.length
          const result = await callBatch(fields, targetLang)
          totalApplied += Object.keys(result.translations).length
          failedFields.push(...result.failed)

          if (Object.keys(result.translations).length > 0) {
            const { error: pkgErr } = await supabase
              .from("packages")
              .update(result.translations)
              .eq("id", pkg.id)
            if (pkgErr) console.error(`[translate-trip] Failed updating package ${pkg.id}:`, pkgErr)
          }
        }
      }
    }

    // Helper: translate a simple table's rows (name + description fields)
    const translateSimpleTable = async (
      table: string,
      rows: any[],
      nameField: string,
      descriptionField: string | null,
    ) => {
      if (!rows?.length) return

      for (const targetLang of validTargets) {
        const targetSuffix = targetLang === "en" ? "" : `_${targetLang}`

        for (const row of rows) {
          const fields: FieldPayload[] = []

          const sourceName = row[`${nameField}${sourceSuffix}`]
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

          totalRequested += fields.length
          try {
            const result = await callBatch(fields, targetLang)
            totalApplied += Object.keys(result.translations).length
            failedFields.push(...result.failed)
            if (Object.keys(result.translations).length > 0) {
              const { error: tblErr } = await supabase
                .from(table)
                .update(result.translations)
                .eq("id", row.id)
              if (tblErr) console.error(`[translate-trip] Failed updating ${table} ${row.id}:`, tblErr)
            }
          } catch (e) {
            console.error(`[translate-trip] Error translating ${table} row ${row.id}:`, e)
            failedFields.push(...fields.map((f) => f.field))
          }
        }
      }
    }

    // Fetch all add-on tables in parallel (cheap DB reads), then run
    // their translations sequentially so we don't pile dozens of AI
    // Gateway calls on top of the per-language fanout above.
    const [addOnsResult, golfCoursesResult, mealOptionsResult, transportResult, serviceResult] =
      await Promise.all([
        supabase.from("add_ons").select("*").eq("trip_id", id),
        supabase.from("trip_golf_courses").select("*").eq("trip_id", id),
        supabase.from("trip_meal_options").select("*").eq("trip_id", id),
        supabase.from("trip_transportation_options").select("*").eq("trip_id", id),
        supabase.from("trip_service_options").select("*").eq("trip_id", id),
      ])

    await translateSimpleTable("add_ons", addOnsResult.data || [], "name", "description")
    await translateSimpleTable("trip_golf_courses", golfCoursesResult.data || [], "course_name", "description")
    await translateSimpleTable("trip_meal_options", mealOptionsResult.data || [], "name", "description")
    await translateSimpleTable("trip_transportation_options", transportResult.data || [], "name", "description")
    await translateSimpleTable("trip_service_options", serviceResult.data || [], "name", "description")

    // Update the trips row with the language-suffixed columns we collected
    if (Object.keys(updates).length > 0) {
      const { error: updateError } = await supabase.from("trips").update(updates).eq("id", id)

      if (updateError) {
        console.error("[translate-trip] trips update error:", updateError)
        return new Response(JSON.stringify({ error: "Failed to save translations" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        })
      }
    }

    const targetNames = validTargets.map((l: string) => LANGUAGE_MAP[l].name).join(" & ")
    const partial = failedFields.length > 0
    const message = partial
      ? `Translated ${totalApplied}/${totalRequested} fields to ${targetNames}. ${failedFields.length} field(s) could not be translated — try again.`
      : `Translated ${totalApplied} fields to ${targetNames}`

    return new Response(
      JSON.stringify({
        success: !partial || totalApplied > 0,
        partial,
        message,
        fieldsRequested: totalRequested,
        fieldsUpdated: totalApplied,
        failedFields,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    )
  } catch (error: any) {
    console.error("Error in translate-trip:", error)
    // Surface AI Gateway-specific errors so the dialog can show the right message
    if (error?.status && error?.code) {
      return new Response(
        JSON.stringify({
          error: error.message || "Translation failed",
          code: error.code,
        }),
        {
          status: error.status,
          headers: { "Content-Type": "application/json" },
        },
      )
    }
    return new Response(
      JSON.stringify({
        error: `Translation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        code: "TRANSLATION_ERROR",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}
