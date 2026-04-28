import { createClient } from "@/lib/supabase/server"
import { getUserType } from "@/lib/supabase/get-user-type"
import { headers } from "next/headers"

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

    const headersList = await headers()
    const host = headersList.get("host") || "localhost:3000"
    const protocol = process.env.NODE_ENV === "production" ? "https" : "http"
    const baseUrl = `${protocol}://${host}`

    // Fetch the event
    const { data: event, error } = await supabase
      .from("tournament_events")
      .select("*")
      .eq("id", id)
      .single()

    if (error || !event) {
      return new Response(JSON.stringify({ error: "Event not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      })
    }

    const { data: itineraryDays } = await supabase
      .from("tournament_event_itinerary_days")
      .select("*")
      .eq("event_id", id)
      .order("display_order")

    const { data: pricingTiers } = await supabase
      .from("tournament_event_pricing_tiers")
      .select("*")
      .eq("event_id", id)
      .order("display_order")

    // Helper: call the batch translation API for a chunk of fields,
    // automatically retrying any keys the model dropped (typically due
    // to JSON output truncation when several long fields are batched).
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

      if (missing.length === 0) return { translations, failed: [] }

      console.warn(
        `[translate-event] Retrying ${missing.length} missing key(s) for ${targetLang}: ${missing.join(", ")}`,
      )
      const retried = await Promise.all(
        missing.map(async (key) => {
          const original = fields.find((f) => f.field === key)
          if (!original) return { key, value: null as string | null }
          try {
            const r = await doFetch([original])
            return { key, value: r.translations?.[key] ?? null }
          } catch (e) {
            console.error(`[translate-event] Retry failed for ${key}:`, e)
            return { key, value: null }
          }
        }),
      )
      const failed: string[] = []
      for (const { key, value } of retried) {
        if (value) translations[key] = value
        else failed.push(key)
      }
      return { translations, failed }
    }

    const sourceSuffix = sourceLanguage === "en" ? "" : `_${sourceLanguage}`
    const updates: Record<string, any> = {}
    const itineraryDayUpdates: Map<string, Record<string, string>> = new Map()
    const pricingTierUpdates: Map<string, Record<string, string>> = new Map()

    let totalRequested = 0
    let totalApplied = 0
    const failedFields: string[] = []

    // Long-bodied fields go in their own per-call chunk so structured-output
    // truncation can't lose them.
    const SIMPLE_FIELDS: { key: string; fieldType: string; long?: boolean }[] = [
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

    for (const targetLang of targetLanguages) {
      if (targetLang === sourceLanguage) continue
      const targetSuffix = targetLang === "en" ? "" : `_${targetLang}`

      // Build batches:
      //  - one combined batch for all "short" fields (titles, locations, short list items, day titles, tier names)
      //  - one batch per "long" array (e.g. description, travel_itinerary) — one item per call
      const shortBatch: FieldPayload[] = []
      const longBatches: { lang: string; targetField?: string; payloads: FieldPayload[]; meta: any }[] = []

      // Track how to apply each result
      type Apply =
        | { kind: "simple"; targetField: string }
        | { kind: "array"; targetArrayKey: string; index: number }
        | { kind: "itinerary_day"; dayId: string; targetField: string }
        | { kind: "pricing_tier"; tierId: string; targetField: string }
      const applyByKey = new Map<string, Apply>()

      // Simple fields → short batch
      for (const { key, fieldType } of SIMPLE_FIELDS) {
        const sourceVal = event[`${key}${sourceSuffix}`]
        if (typeof sourceVal !== "string" || !sourceVal.trim()) continue
        const fieldKey = `${key}${targetSuffix}`
        shortBatch.push({ field: fieldKey, text: sourceVal, fieldType })
        applyByKey.set(fieldKey, { kind: "simple", targetField: fieldKey })
      }

      // Array fields
      for (const { key, fieldType, long } of ARRAY_FIELDS) {
        const sourceData = event[`${key}${sourceSuffix}`]
        if (!Array.isArray(sourceData) || sourceData.length === 0) continue

        const items = sourceData
          .map((text: string, i: number) => ({ text, i }))
          .filter((x) => typeof x.text === "string" && x.text.trim().length > 0)
        if (items.length === 0) continue

        const targetArrayKey = `${key}${targetSuffix}`

        if (long) {
          // Each item gets its own batch call
          for (const { text, i } of items) {
            const k = `arr_${key}_${i}`
            applyByKey.set(k, { kind: "array", targetArrayKey, index: i })
            longBatches.push({
              lang: targetLang,
              targetField: targetArrayKey,
              payloads: [{ field: k, text, fieldType }],
              meta: null,
            })
          }
        } else {
          // Short array items go in the combined short batch
          for (const { text, i } of items) {
            const k = `arr_${key}_${i}`
            applyByKey.set(k, { kind: "array", targetArrayKey, index: i })
            shortBatch.push({ field: k, text, fieldType })
          }
        }
      }

      // Itinerary days — title goes short, content (often long markdown) goes long
      if (itineraryDays?.length) {
        for (const day of itineraryDays) {
          const daySourceTitle = day[`title${sourceSuffix}`]
          if (typeof daySourceTitle === "string" && daySourceTitle.trim()) {
            const k = `day_title_${day.id}`
            shortBatch.push({ field: k, text: daySourceTitle, fieldType: "title" })
            applyByKey.set(k, {
              kind: "itinerary_day",
              dayId: day.id,
              targetField: `title${targetSuffix}`,
            })
          }
          const daySourceContent = day[`content${sourceSuffix}`]
          if (typeof daySourceContent === "string" && daySourceContent.trim()) {
            const k = `day_content_${day.id}`
            applyByKey.set(k, {
              kind: "itinerary_day",
              dayId: day.id,
              targetField: `content${targetSuffix}`,
            })
            longBatches.push({
              lang: targetLang,
              payloads: [{ field: k, text: daySourceContent, fieldType: "description" }],
              meta: null,
            })
          }
        }
      }

      // Pricing tier names — short
      if (pricingTiers?.length) {
        for (const tier of pricingTiers) {
          const tierSourceName = tier[`name${sourceSuffix}`]
          if (typeof tierSourceName === "string" && tierSourceName.trim()) {
            const k = `tier_name_${tier.id}`
            shortBatch.push({ field: k, text: tierSourceName, fieldType: "title" })
            applyByKey.set(k, {
              kind: "pricing_tier",
              tierId: tier.id,
              targetField: `name${targetSuffix}`,
            })
          }
        }
      }

      const totalForLang = shortBatch.length + longBatches.reduce((n, b) => n + b.payloads.length, 0)
      totalRequested += totalForLang
      if (totalForLang === 0) continue

      // Run short batch + all long single-item batches in parallel
      const results = await Promise.all([
        callBatch(shortBatch, targetLang),
        ...longBatches.map((b) => callBatch(b.payloads, targetLang)),
      ])

      const merged: Record<string, string> = {}
      for (const r of results) {
        Object.assign(merged, r.translations)
        failedFields.push(...r.failed)
      }
      totalApplied += Object.keys(merged).length

      // Apply each translation back to the right destination
      for (const [k, value] of Object.entries(merged)) {
        const apply = applyByKey.get(k)
        if (!apply) continue

        if (apply.kind === "simple") {
          updates[apply.targetField] = value
        } else if (apply.kind === "array") {
          if (!Array.isArray(updates[apply.targetArrayKey])) updates[apply.targetArrayKey] = []
          updates[apply.targetArrayKey][apply.index] = value
        } else if (apply.kind === "itinerary_day") {
          if (!itineraryDayUpdates.has(apply.dayId)) itineraryDayUpdates.set(apply.dayId, {})
          itineraryDayUpdates.get(apply.dayId)![apply.targetField] = value
        } else if (apply.kind === "pricing_tier") {
          if (!pricingTierUpdates.has(apply.tierId)) pricingTierUpdates.set(apply.tierId, {})
          pricingTierUpdates.get(apply.tierId)![apply.targetField] = value
        }
      }

      // Compact sparse array fields
      for (const { key } of ARRAY_FIELDS) {
        const targetArrayKey = `${key}${targetSuffix}`
        if (Array.isArray(updates[targetArrayKey])) {
          updates[targetArrayKey] = (updates[targetArrayKey] as (string | undefined)[]).filter(
            (t) => typeof t === "string" && t.length > 0,
          )
        }
      }
    }

    // Persist itinerary days
    for (const [dayId, dayUpdates] of itineraryDayUpdates) {
      if (Object.keys(dayUpdates).length === 0) continue
      const { error: dayErr } = await supabase
        .from("tournament_event_itinerary_days")
        .update(dayUpdates)
        .eq("id", dayId)
      if (dayErr) console.error(`[translate-event] Failed updating day ${dayId}:`, dayErr)
    }

    // Persist pricing tiers
    for (const [tierId, tierUpdates] of pricingTierUpdates) {
      if (Object.keys(tierUpdates).length === 0) continue
      const { error: tierErr } = await supabase
        .from("tournament_event_pricing_tiers")
        .update(tierUpdates)
        .eq("id", tierId)
      if (tierErr) console.error(`[translate-event] Failed updating tier ${tierId}:`, tierErr)
    }

    // Persist event
    if (Object.keys(updates).length > 0) {
      const { error: updateError } = await supabase
        .from("tournament_events")
        .update(updates)
        .eq("id", id)

      if (updateError) {
        console.error("[translate-event] tournament_events update error:", updateError)
        return new Response(JSON.stringify({ error: "Failed to save translations" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        })
      }
    }

    const targetNames = targetLanguages
      .filter((l: string) => l !== sourceLanguage)
      .map((l: string) => (l === "en" ? "English" : l === "ko" ? "Korean" : "German"))
      .join(", ")

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
      { status: 200, headers: { "Content-Type": "application/json" } },
    )
  } catch (error: any) {
    console.error("Error translating event:", error)
    if (error?.status && error?.code) {
      return new Response(
        JSON.stringify({ error: error.message || "Translation failed", code: error.code }),
        { status: error.status, headers: { "Content-Type": "application/json" } },
      )
    }
    return new Response(JSON.stringify({ error: "Translation failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
