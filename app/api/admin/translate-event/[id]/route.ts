import { createClient } from "@/lib/supabase/server"
import { getUserType } from "@/lib/supabase/get-user-type"
import { headers } from "next/headers"
import { runWithConcurrency } from "@/lib/run-with-concurrency"
import {
  countUnits,
  createShouldTranslate,
  createStaleCheck,
  parseDirtyCheckOptions,
  suffixFor,
  type ShouldTranslate,
} from "@/lib/translation-dirty"

// Translation jobs fan out into many AI Gateway calls (per language,
// per itinerary day, per pricing tier). The default function timeout
// is too short, so bump it. Vercel will cap to whatever the plan supports.
export const maxDuration = 300

// Max simultaneous AI Gateway requests in flight at once. Keep this
// low so we never burst into a 429 rate-limit response when an event
// has many itinerary days or two target languages.
const AI_CONCURRENCY = 3

const LANGUAGE_NAMES: Record<string, string> = {
  en: "English",
  ko: "Korean",
  de: "German",
}

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

  if (
    !sourceLanguage ||
    !targetLanguages ||
    !Array.isArray(targetLanguages) ||
    targetLanguages.length === 0
  ) {
    return new Response(
      JSON.stringify({ error: "Source language and target languages are required" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    )
  }

  const validLanguages = ["en", "ko", "de"]
  if (
    !validLanguages.includes(sourceLanguage) ||
    !targetLanguages.every((l: string) => validLanguages.includes(l))
  ) {
    return new Response(JSON.stringify({ error: "Invalid language specified" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    })
  }

  const validTargets = (targetLanguages as string[]).filter((l) => l !== sourceLanguage)
  if (validTargets.length === 0) {
    return new Response(
      JSON.stringify({ error: "At least one valid target language is required" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    )
  }

  const headersList = await headers()
  const host = headersList.get("host") || "localhost:3000"
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http"
  const baseUrl = `${protocol}://${host}`

  const [{ data: event, error: eventErr }, { data: itineraryDays }, { data: pricingTiers }] =
    await Promise.all([
      supabase.from("tournament_events").select("*").eq("id", id).single(),
      supabase
        .from("tournament_event_itinerary_days")
        .select("*")
        .eq("event_id", id)
        .order("display_order"),
      supabase
        .from("tournament_event_pricing_tiers")
        .select("*")
        .eq("event_id", id)
        .order("display_order"),
    ])

  if (eventErr || !event) {
    return new Response(JSON.stringify({ error: "Event not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    })
  }

  const sourceSuffix = sourceLanguage === "en" ? "" : `_${sourceLanguage}`

  const SIMPLE_FIELDS: { key: string; fieldType: string }[] = [
    { key: "title", fieldType: "title" },
    { key: "location", fieldType: "location" },
    { key: "duration", fieldType: "description" },
  ]
  const ARRAY_FIELDS: { key: string; fieldType: string; long?: boolean }[] = [
    { key: "description", fieldType: "description", long: true },
    { key: "trip_highlights", fieldType: "highlight" },
    { key: "travel_itinerary", fieldType: "itinerary", long: true },
    { key: "includes", fieldType: "item" },
    { key: "excludes", fieldType: "item" },
  ]

  const isNonEmpty = (v: unknown): v is string =>
    typeof v === "string" && v.trim().length > 0

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
  // change to the event's own `title` cannot mark every itinerary day
  // title stale as well.
  const dayFieldKey = (field: string) => `itinerary_days.${field}`
  const tierFieldKey = (field: string) => `pricing_tiers.${field}`

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

    for (const { key } of SIMPLE_FIELDS) {
      count(key, event[`${key}${sourceSuffix}`], event[`${key}${targetSuffix}`])
    }
    for (const { key } of ARRAY_FIELDS) {
      count(key, event[`${key}${sourceSuffix}`], event[`${key}${targetSuffix}`])
    }
    for (const day of itineraryDays || []) {
      count(
        dayFieldKey("title"),
        day[`title${sourceSuffix}`],
        day[`title${targetSuffix}`],
      )
      count(
        dayFieldKey("content"),
        day[`content${sourceSuffix}`],
        day[`content${targetSuffix}`],
      )
    }
    for (const tier of pricingTiers || []) {
      count(
        tierFieldKey("name"),
        tier[`name${sourceSuffix}`],
        tier[`name${targetSuffix}`],
      )
    }
  }

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const send = (e: any) =>
        controller.enqueue(encoder.encode(JSON.stringify(e) + "\n"))

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
        const sourceName = LANGUAGE_NAMES[sourceLanguage] ?? sourceLanguage
        const upToDate = skippedUpToDate > 0
        send({
          type: "complete",
          success: upToDate,
          partial: false,
          message: upToDate
            ? `Everything is already translated — nothing changed since the last run. Tick "Retranslate everything" to redo all ${skippedUpToDate} field(s).`
            : `No ${sourceName} content found on this event to translate. Please add content in ${sourceName} first.`,
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
            const r = await doFetch([original])
            return { key, value: r.translations?.[key] ?? null }
          } catch (e) {
            console.error(`[translate-event] Retry failed for ${key}:`, e)
            return { key, value: null }
          }
        })
        const retried = await runWithConcurrency(retryTasks, AI_CONCURRENCY)
        const failed: string[] = []
        for (const { key, value } of retried) {
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
        const itineraryDayUpdates: Map<string, Record<string, string>> = new Map()
        const pricingTierUpdates: Map<string, Record<string, string>> = new Map()

        for (const targetLang of validTargets) {
          const targetSuffix = targetLang === "en" ? "" : `_${targetLang}`
          const langName = LANGUAGE_NAMES[targetLang] ?? targetLang
          const should = shouldTranslateFor.get(targetLang)!

          const shortBatch: FieldPayload[] = []
          const longBatches: { payloads: FieldPayload[]; label: string }[] = []

          type Apply =
            | { kind: "simple"; targetField: string }
            | { kind: "array"; targetArrayKey: string; index: number }
            | { kind: "itinerary_day"; dayId: string; targetField: string }
            | { kind: "pricing_tier"; tierId: string; targetField: string }
          const applyByKey = new Map<string, Apply>()

          // Which fields this run is actually responsible for. The
          // "fall back to the source text" passes below must only touch
          // these — without this guard, a field skipped as already-
          // translated would get overwritten with its source text,
          // silently replacing good German with English.
          const inScopeSimple = new Set<string>()
          const inScopeArrays = new Set<string>()
          const inScopeDayFields = new Set<string>()
          const inScopeTierFields = new Set<string>()

          for (const { key, fieldType } of SIMPLE_FIELDS) {
            const sourceVal = event[`${key}${sourceSuffix}`]
            if (!should(key, sourceVal, event[`${key}${targetSuffix}`])) continue
            const fieldKey = `${key}${targetSuffix}`
            inScopeSimple.add(key)
            shortBatch.push({ field: fieldKey, text: sourceVal, fieldType })
            applyByKey.set(fieldKey, { kind: "simple", targetField: fieldKey })
          }

          for (const { key, fieldType, long } of ARRAY_FIELDS) {
            const sourceData = event[`${key}${sourceSuffix}`]
            if (!Array.isArray(sourceData) || sourceData.length === 0) continue
            // Arrays are rewritten whole, so they are skipped whole too.
            if (!should(key, sourceData, event[`${key}${targetSuffix}`])) continue
            inScopeArrays.add(key)

            const items = sourceData
              .map((text: string, i: number) => ({ text, i }))
              .filter((x) => isNonEmpty(x.text))
            if (items.length === 0) continue

            const targetArrayKey = `${key}${targetSuffix}`

            if (long) {
              for (const { text, i } of items) {
                const k = `arr_${key}_${i}`
                applyByKey.set(k, { kind: "array", targetArrayKey, index: i })
                longBatches.push({
                  payloads: [{ field: k, text, fieldType }],
                  label: `${humanize(key)} #${i + 1} (${langName})`,
                })
              }
            } else {
              for (const { text, i } of items) {
                const k = `arr_${key}_${i}`
                applyByKey.set(k, { kind: "array", targetArrayKey, index: i })
                shortBatch.push({ field: k, text, fieldType })
              }
            }
          }

          if (itineraryDays?.length) {
            for (const day of itineraryDays) {
              const daySourceTitle = day[`title${sourceSuffix}`]
              if (
                should(
                  dayFieldKey("title"),
                  daySourceTitle,
                  day[`title${targetSuffix}`],
                )
              ) {
                const k = `day_title_${day.id}`
                inScopeDayFields.add(`${day.id}:title`)
                shortBatch.push({ field: k, text: daySourceTitle, fieldType: "title" })
                applyByKey.set(k, {
                  kind: "itinerary_day",
                  dayId: day.id,
                  targetField: `title${targetSuffix}`,
                })
              }
              const daySourceContent = day[`content${sourceSuffix}`]
              if (
                should(
                  dayFieldKey("content"),
                  daySourceContent,
                  day[`content${targetSuffix}`],
                )
              ) {
                const k = `day_content_${day.id}`
                inScopeDayFields.add(`${day.id}:content`)
                applyByKey.set(k, {
                  kind: "itinerary_day",
                  dayId: day.id,
                  targetField: `content${targetSuffix}`,
                })
                longBatches.push({
                  payloads: [{ field: k, text: daySourceContent, fieldType: "description" }],
                  label: `Itinerary day (${langName})`,
                })
              }
            }
          }

          if (pricingTiers?.length) {
            for (const tier of pricingTiers) {
              const tierSourceName = tier[`name${sourceSuffix}`]
              if (
                should(
                  tierFieldKey("name"),
                  tierSourceName,
                  tier[`name${targetSuffix}`],
                )
              ) {
                const k = `tier_name_${tier.id}`
                inScopeTierFields.add(tier.id)
                shortBatch.push({ field: k, text: tierSourceName, fieldType: "title" })
                applyByKey.set(k, {
                  kind: "pricing_tier",
                  tierId: tier.id,
                  targetField: `name${targetSuffix}`,
                })
              }
            }
          }

          if (shortBatch.length === 0 && longBatches.length === 0) continue

          const tasks: Array<() => Promise<{
            translations: Record<string, string>
            failed: string[]
          }>> = [
            ...(shortBatch.length > 0
              ? [
                  wrap(`Event details (${langName})`, shortBatch.length, () =>
                    callBatch(shortBatch, targetLang),
                  ),
                ]
              : []),
            ...longBatches.map((b) =>
              wrap(b.label, b.payloads.length, () => callBatch(b.payloads, targetLang)),
            ),
          ]
          const results = await runWithConcurrency(tasks, AI_CONCURRENCY)

          const merged: Record<string, string> = {}
          for (const r of results) {
            Object.assign(merged, r.translations)
            failedFields.push(...r.failed)
          }
          totalApplied += Object.keys(merged).length

          for (const [k, value] of Object.entries(merged)) {
            const apply = applyByKey.get(k)
            if (!apply) continue
            if (apply.kind === "simple") {
              updates[apply.targetField] = value
            } else if (apply.kind === "array") {
              if (!Array.isArray(updates[apply.targetArrayKey]))
                updates[apply.targetArrayKey] = []
              updates[apply.targetArrayKey][apply.index] = value
            } else if (apply.kind === "itinerary_day") {
              if (!itineraryDayUpdates.has(apply.dayId))
                itineraryDayUpdates.set(apply.dayId, {})
              itineraryDayUpdates.get(apply.dayId)![apply.targetField] = value
            } else if (apply.kind === "pricing_tier") {
              if (!pricingTierUpdates.has(apply.tierId))
                pricingTierUpdates.set(apply.tierId, {})
              pricingTierUpdates.get(apply.tierId)![apply.targetField] = value
            }
          }

          // For array fields, fill any missing indices with the source
          // text so multi-paragraph / multi-line content keeps its full
          // structure even when one entry's translation was dropped by
          // the model. This guarantees the saved translation has the
          // same length as the source and that no paragraphs disappear.
          for (const { key } of ARRAY_FIELDS) {
            if (!inScopeArrays.has(key)) continue
            const targetArrayKey = `${key}${targetSuffix}`
            const sourceArr = event[`${key}${sourceSuffix}`]
            if (!Array.isArray(sourceArr) || sourceArr.length === 0) continue
            const targetArr = (updates[targetArrayKey] as (string | undefined)[] | undefined) || []
            const filled: string[] = []
            for (let i = 0; i < sourceArr.length; i++) {
              const src = sourceArr[i]
              if (!isNonEmpty(src)) continue
              const translated = targetArr[i]
              if (typeof translated === "string" && translated.length > 0) {
                filled.push(translated)
              } else {
                // Fall back to source so structure is preserved.
                filled.push(src)
              }
            }
            if (filled.length > 0) {
              updates[targetArrayKey] = filled
            } else {
              delete updates[targetArrayKey]
            }
          }

          // For simple fields, fall back to source text if the model
          // dropped the translation entirely (otherwise the column would
          // just not get updated, leaving stale or missing content).
          for (const { key } of SIMPLE_FIELDS) {
            if (!inScopeSimple.has(key)) continue
            const targetField = `${key}${targetSuffix}`
            const sourceVal = event[`${key}${sourceSuffix}`]
            if (!isNonEmpty(sourceVal)) continue
            const translated = updates[targetField]
            if (typeof translated !== "string" || translated.length === 0) {
              updates[targetField] = sourceVal
            }
          }

          // Same fallback for itinerary day + pricing tier title/content.
          if (itineraryDays?.length) {
            for (const day of itineraryDays) {
              const dayUpdates = itineraryDayUpdates.get(day.id) || {}
              for (const field of ["title", "content"] as const) {
                if (!inScopeDayFields.has(`${day.id}:${field}`)) continue
                const targetField = `${field}${targetSuffix}`
                const sourceVal = day[`${field}${sourceSuffix}`]
                if (!isNonEmpty(sourceVal)) continue
                if (
                  typeof dayUpdates[targetField] !== "string" ||
                  dayUpdates[targetField].length === 0
                ) {
                  dayUpdates[targetField] = sourceVal
                }
              }
              if (Object.keys(dayUpdates).length > 0) {
                itineraryDayUpdates.set(day.id, dayUpdates)
              }
            }
          }
          if (pricingTiers?.length) {
            for (const tier of pricingTiers) {
              if (!inScopeTierFields.has(tier.id)) continue
              const tierUpdates = pricingTierUpdates.get(tier.id) || {}
              const targetField = `name${targetSuffix}`
              const sourceVal = tier[`name${sourceSuffix}`]
              if (!isNonEmpty(sourceVal)) continue
              if (
                typeof tierUpdates[targetField] !== "string" ||
                tierUpdates[targetField].length === 0
              ) {
                tierUpdates[targetField] = sourceVal
              }
              if (Object.keys(tierUpdates).length > 0) {
                pricingTierUpdates.set(tier.id, tierUpdates)
              }
            }
          }
        }

        for (const [dayId, dayUpdates] of itineraryDayUpdates) {
          if (Object.keys(dayUpdates).length === 0) continue
          const { error: dayErr } = await supabase
            .from("tournament_event_itinerary_days")
            .update(dayUpdates)
            .eq("id", dayId)
          if (dayErr) console.error(`[translate-event] Failed updating day ${dayId}:`, dayErr)
        }

        for (const [tierId, tierUpdates] of pricingTierUpdates) {
          if (Object.keys(tierUpdates).length === 0) continue
          const { error: tierErr } = await supabase
            .from("tournament_event_pricing_tiers")
            .update(tierUpdates)
            .eq("id", tierId)
          if (tierErr) console.error(`[translate-event] Failed updating tier ${tierId}:`, tierErr)
        }

        if (Object.keys(updates).length > 0) {
          const { error: updateError } = await supabase
            .from("tournament_events")
            .update(updates)
            .eq("id", id)
          if (updateError) {
            console.error("[translate-event] tournament_events update error:", updateError)
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

        const targetNames = validTargets.map((l) => LANGUAGE_NAMES[l] ?? l).join(", ")
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
        console.error("Error translating event:", error)
        send({
          type: "error",
          error: error?.message || "Translation failed",
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

// "trip_highlights" → "Trip highlights"
function humanize(key: string): string {
  const base = key.replace(/_/g, " ").trim()
  return base.charAt(0).toUpperCase() + base.slice(1)
}
