import { createClient } from "@/lib/supabase/server"
import { getUserType } from "@/lib/supabase/get-user-type"
import { headers } from "next/headers"

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
        headers: { "Content-Type": "application/json" }
      })
    }

    const body = await request.json()
    const { sourceLanguage, targetLanguages } = body

    if (!sourceLanguage || !targetLanguages || !Array.isArray(targetLanguages) || targetLanguages.length === 0) {
      return new Response(JSON.stringify({ error: "Source language and target languages are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      })
    }

    const validLanguages = ["en", "ko", "de"]
    if (!validLanguages.includes(sourceLanguage) || !targetLanguages.every((l: string) => validLanguages.includes(l))) {
      return new Response(JSON.stringify({ error: "Invalid language specified" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
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
        headers: { "Content-Type": "application/json" }
      })
    }

    // Fetch itinerary days and pricing tiers upfront
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

    // Get source field suffix
    const sourceSuffix = sourceLanguage === "en" ? "" : `_${sourceLanguage}`
    
    // Prepare updates for each target language
    const updates: Record<string, any> = {}
    const itineraryDayUpdates: Map<string, Record<string, string>> = new Map()
    const pricingTierUpdates: Map<string, Record<string, string>> = new Map()

    for (const targetLang of targetLanguages) {
      if (targetLang === sourceLanguage) continue
      
      const targetSuffix = targetLang === "en" ? "" : `_${targetLang}`

      // Simple event-level text fields
      const simpleFields = [
        { key: "title", fieldType: "title" },
        { key: "location", fieldType: "location" },
        { key: "duration", fieldType: "description" },
      ]

      // Array event-level fields
      const arrayFields = [
        { key: "description", fieldType: "description" },
        { key: "trip_highlights", fieldType: "highlight" },
        { key: "travel_itinerary", fieldType: "itinerary" },
        { key: "includes", fieldType: "item" },
        { key: "excludes", fieldType: "item" },
      ]

      // Collect ALL fields to translate in a single batch
      // Use a clear type tag to route responses back correctly
      type FieldMeta =
        | { kind: "simple"; targetField: string }
        | { kind: "array"; arrayKey: string; index: number; targetArrayKey: string }
        | { kind: "itinerary_day"; dayId: string; targetField: string }
        | { kind: "pricing_tier"; tierId: string; targetField: string }

      const allFieldsToTranslate: { field: string; text: string; fieldType: string; meta: FieldMeta }[] = []

      // Simple fields
      for (const { key, fieldType } of simpleFields) {
        const sourceVal = event[`${key}${sourceSuffix}`]
        if (sourceVal) {
          allFieldsToTranslate.push({
            field: `${key}${targetSuffix}`,
            text: sourceVal,
            fieldType,
            meta: { kind: "simple", targetField: `${key}${targetSuffix}` },
          })
        }
      }

      // Array fields — each item becomes a separate translation entry
      for (const { key, fieldType } of arrayFields) {
        const sourceData = event[`${key}${sourceSuffix}`]
        if (sourceData?.length) {
          sourceData.forEach((text: string, i: number) => {
            allFieldsToTranslate.push({
              field: `arr_${key}_${i}`,
              text,
              fieldType,
              meta: { kind: "array", arrayKey: key, index: i, targetArrayKey: `${key}${targetSuffix}` },
            })
          })
        }
      }

      // Itinerary days
      if (itineraryDays?.length) {
        for (const day of itineraryDays) {
          const daySourceTitle = day[`title${sourceSuffix}`]
          if (daySourceTitle) {
            allFieldsToTranslate.push({
              field: `day_title_${day.id}`,
              text: daySourceTitle,
              fieldType: "title",
              meta: { kind: "itinerary_day", dayId: day.id, targetField: `title${targetSuffix}` },
            })
          }
          const daySourceContent = day[`content${sourceSuffix}`]
          if (daySourceContent) {
            allFieldsToTranslate.push({
              field: `day_content_${day.id}`,
              text: daySourceContent,
              fieldType: "description",
              meta: { kind: "itinerary_day", dayId: day.id, targetField: `content${targetSuffix}` },
            })
          }
        }
      }

      // Pricing tiers
      if (pricingTiers?.length) {
        for (const tier of pricingTiers) {
          const tierSourceName = tier[`name${sourceSuffix}`]
          if (tierSourceName) {
            allFieldsToTranslate.push({
              field: `tier_name_${tier.id}`,
              text: tierSourceName,
              fieldType: "title",
              meta: { kind: "pricing_tier", tierId: tier.id, targetField: `name${targetSuffix}` },
            })
          }
        }
      }

      // Make a single batch translation call for all fields
      if (allFieldsToTranslate.length > 0) {
        const response = await fetch(`${baseUrl}/api/translate/batch`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fields: allFieldsToTranslate.map(({ field, text, fieldType }) => ({ field, text, fieldType })),
            targetLanguage: targetLang,
            sourceLanguage: sourceLanguage,
          }),
        })

        if (response.ok) {
          const result = await response.json()
          if (result.translations) {
            for (const fieldInfo of allFieldsToTranslate) {
              const translation = result.translations[fieldInfo.field]
              if (!translation) continue

              const { meta } = fieldInfo

              if (meta.kind === "simple") {
                updates[meta.targetField] = translation

              } else if (meta.kind === "array") {
                if (!updates[meta.targetArrayKey]) updates[meta.targetArrayKey] = []
                updates[meta.targetArrayKey][meta.index] = translation

              } else if (meta.kind === "itinerary_day") {
                if (!itineraryDayUpdates.has(meta.dayId)) itineraryDayUpdates.set(meta.dayId, {})
                itineraryDayUpdates.get(meta.dayId)![meta.targetField] = translation as string

              } else if (meta.kind === "pricing_tier") {
                if (!pricingTierUpdates.has(meta.tierId)) pricingTierUpdates.set(meta.tierId, {})
                pricingTierUpdates.get(meta.tierId)![meta.targetField] = translation as string
              }
            }

            // Remove sparse slots from array fields
            for (const { key } of arrayFields) {
              const targetArrayKey = `${key}${targetSuffix}`
              if (updates[targetArrayKey]) {
                updates[targetArrayKey] = (updates[targetArrayKey] as (string | undefined)[]).filter((t) => t)
              }
            }
          }
        } else {
          try {
            const errorData = await response.json()
            return new Response(JSON.stringify({ 
              error: errorData.error || "Translation failed", 
              code: errorData.code 
            }), {
              status: response.status,
              headers: { "Content-Type": "application/json" }
            })
          } catch {
            return new Response(JSON.stringify({ error: "Translation service error" }), {
              status: response.status,
              headers: { "Content-Type": "application/json" }
            })
          }
        }
      }
    }

    // Update itinerary days
    for (const [dayId, dayUpdates] of itineraryDayUpdates) {
      if (Object.keys(dayUpdates).length > 0) {
        await supabase
          .from("tournament_event_itinerary_days")
          .update(dayUpdates)
          .eq("id", dayId)
      }
    }

    // Update pricing tiers
    for (const [tierId, tierUpdates] of pricingTierUpdates) {
      if (Object.keys(tierUpdates).length > 0) {
        await supabase
          .from("tournament_event_pricing_tiers")
          .update(tierUpdates)
          .eq("id", tierId)
      }
    }

    // Update the event if there are translations
    if (Object.keys(updates).length > 0) {
      const { error: updateError } = await supabase
        .from("tournament_events")
        .update(updates)
        .eq("id", id)

      if (updateError) {
        return new Response(JSON.stringify({ error: "Failed to save translations" }), {
          status: 500,
          headers: { "Content-Type": "application/json" }
        })
      }
    }

    const targetNames = targetLanguages.map((l: string) => 
      l === "en" ? "English" : l === "ko" ? "Korean" : "German"
    ).join(", ")

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Translated to ${targetNames}`,
      fieldsUpdated: Object.keys(updates).length
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    })

  } catch (error) {
    console.error("Error translating event:", error)
    return new Response(JSON.stringify({ error: "Translation failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    })
  }
}
