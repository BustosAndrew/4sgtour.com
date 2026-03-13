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

      // Collect ALL fields to translate in a single batch
      const allFieldsToTranslate: { field: string; text: string; fieldType: string; meta?: { type: string; id: string } }[] = []

      // Simple text fields
      const sourceTitle = event[`title${sourceSuffix}`]
      if (sourceTitle) {
        allFieldsToTranslate.push({ field: `title${targetSuffix}`, text: sourceTitle, fieldType: "title" })
      }

      const sourceLocation = event[`location${sourceSuffix}`]
      if (sourceLocation) {
        allFieldsToTranslate.push({ field: `location${targetSuffix}`, text: sourceLocation, fieldType: "location" })
      }

      // Array fields
      const arrayFields = [
        { key: "description", fieldType: "description" },
        { key: "trip_highlights", fieldType: "highlight" },
        { key: "travel_itinerary", fieldType: "itinerary" },
        { key: "includes", fieldType: "item" },
        { key: "excludes", fieldType: "item" },
      ]

      for (const { key, fieldType } of arrayFields) {
        const sourceData = event[`${key}${sourceSuffix}`]
        if (sourceData?.length) {
          sourceData.forEach((text: string, i: number) => {
            allFieldsToTranslate.push({ field: `${key}_${i}`, text, fieldType })
          })
        }
      }

      // Itinerary days
      if (itineraryDays?.length) {
        for (const day of itineraryDays) {
          const daySourceTitle = day[`title${sourceSuffix}`]
          if (daySourceTitle) {
            allFieldsToTranslate.push({ 
              field: `day_${day.id}_title${targetSuffix}`, 
              text: daySourceTitle, 
              fieldType: "title",
              meta: { type: "itinerary_day", id: day.id }
            })
          }
          
          const daySourceContent = day[`content${sourceSuffix}`]
          if (daySourceContent) {
            allFieldsToTranslate.push({ 
              field: `day_${day.id}_content${targetSuffix}`, 
              text: daySourceContent, 
              fieldType: "description",
              meta: { type: "itinerary_day", id: day.id }
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
              field: `tier_${tier.id}_name${targetSuffix}`, 
              text: tierSourceName, 
              fieldType: "title",
              meta: { type: "pricing_tier", id: tier.id }
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
            // Process translations
            for (const fieldInfo of allFieldsToTranslate) {
              const translation = result.translations[fieldInfo.field]
              if (!translation) continue

              if (fieldInfo.meta?.type === "itinerary_day") {
                const dayId = fieldInfo.meta.id
                if (!itineraryDayUpdates.has(dayId)) {
                  itineraryDayUpdates.set(dayId, {})
                }
                // Extract actual field name from the composite key
                const actualField = fieldInfo.field.replace(`day_${dayId}_`, "")
                itineraryDayUpdates.get(dayId)![actualField] = translation as string
              } else if (fieldInfo.meta?.type === "pricing_tier") {
                const tierId = fieldInfo.meta.id
                if (!pricingTierUpdates.has(tierId)) {
                  pricingTierUpdates.set(tierId, {})
                }
                const actualField = fieldInfo.field.replace(`tier_${tierId}_`, "")
                pricingTierUpdates.get(tierId)![actualField] = translation as string
              } else if (fieldInfo.field.includes("_") && !fieldInfo.field.startsWith("title") && !fieldInfo.field.startsWith("location")) {
                // Array field - extract array name and index
                const match = fieldInfo.field.match(/^(.+)_(\d+)$/)
                if (match) {
                  const [, arrayName, indexStr] = match
                  const targetArrayKey = `${arrayName}${targetSuffix}`
                  if (!updates[targetArrayKey]) {
                    updates[targetArrayKey] = []
                  }
                  const index = parseInt(indexStr)
                  updates[targetArrayKey][index] = translation
                }
              } else {
                // Simple field
                updates[fieldInfo.field] = translation
              }
            }

            // Clean up array fields (remove empty slots)
            for (const { key } of arrayFields) {
              const targetArrayKey = `${key}${targetSuffix}`
              if (updates[targetArrayKey]) {
                updates[targetArrayKey] = updates[targetArrayKey].filter((t: string) => t)
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
