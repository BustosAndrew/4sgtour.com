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

    // Get source field suffix
    const sourceSuffix = sourceLanguage === "en" ? "" : `_${sourceLanguage}`
    
    // Prepare updates for each target language
    const updates: Record<string, any> = {}

    for (const targetLang of targetLanguages) {
      if (targetLang === sourceLanguage) continue
      
      const targetSuffix = targetLang === "en" ? "" : `_${targetLang}`

      // Translate simple text fields
      const fieldsToTranslate: { field: string; text: string; fieldType: string }[] = []

      const sourceTitle = event[`title${sourceSuffix}`]
      if (sourceTitle) {
        fieldsToTranslate.push({ field: `title${targetSuffix}`, text: sourceTitle, fieldType: "title" })
      }

      const sourceLocation = event[`location${sourceSuffix}`]
      if (sourceLocation) {
        fieldsToTranslate.push({ field: `location${targetSuffix}`, text: sourceLocation, fieldType: "location" })
      }

      if (fieldsToTranslate.length > 0) {
        const response = await fetch(`${baseUrl}/api/translate/batch`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fields: fieldsToTranslate,
            targetLanguage: targetLang,
            sourceLanguage: sourceLanguage,
          }),
        })

        if (response.ok) {
          const result = await response.json()
          // result.translations is { fieldName: translatedText }
          if (result.translations) {
            for (const [field, translation] of Object.entries(result.translations)) {
              updates[field] = translation
            }
          }
        } else {
          // Propagate error from batch API
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

      // Translate array fields
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
          const response = await fetch(`${baseUrl}/api/translate/batch`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fields: sourceData.map((text: string, i: number) => ({
                field: `${key}_${i}`,
                text,
                fieldType,
              })),
              targetLanguage: targetLang,
              sourceLanguage: sourceLanguage,
            }),
          })

          if (response.ok) {
            const result = await response.json()
            // result.translations is { fieldName: translatedText }
            if (result.translations) {
              const translatedArray = sourceData.map((_: string, i: number) => {
                const fieldKey = `${key}_${i}`
                return result.translations[fieldKey] || ""
              }).filter((t: string) => t)
              if (translatedArray.length > 0) {
                updates[`${key}${targetSuffix}`] = translatedArray
              }
            }
          }
        }
      }
    }

    // Translate itinerary days
    const { data: itineraryDays } = await supabase
      .from("tournament_event_itinerary_days")
      .select("*")
      .eq("event_id", id)
      .order("display_order")

    if (itineraryDays?.length) {
      for (const day of itineraryDays) {
        for (const targetLang of targetLanguages) {
          if (targetLang === sourceLanguage) continue
          
          const targetSuffix = targetLang === "en" ? "" : `_${targetLang}`
          const sourceSuffix = sourceLanguage === "en" ? "" : `_${sourceLanguage}`
          
          const dayFieldsToTranslate: { field: string; text: string; fieldType: string }[] = []
          
          const sourceTitle = day[`title${sourceSuffix}`]
          if (sourceTitle) {
            dayFieldsToTranslate.push({ field: `title${targetSuffix}`, text: sourceTitle, fieldType: "title" })
          }
          
          const sourceContent = day[`content${sourceSuffix}`]
          if (sourceContent) {
            dayFieldsToTranslate.push({ field: `content${targetSuffix}`, text: sourceContent, fieldType: "description" })
          }
          
          if (dayFieldsToTranslate.length > 0) {
            const response = await fetch(`${baseUrl}/api/translate/batch`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                fields: dayFieldsToTranslate,
                targetLanguage: targetLang,
                sourceLanguage: sourceLanguage,
              }),
            })
            
            if (response.ok) {
              const result = await response.json()
              if (result.translations) {
                const dayUpdates: Record<string, string> = {}
                for (const [field, translation] of Object.entries(result.translations)) {
                  dayUpdates[field] = translation as string
                }
                if (Object.keys(dayUpdates).length > 0) {
                  await supabase
                    .from("tournament_event_itinerary_days")
                    .update(dayUpdates)
                    .eq("id", day.id)
                }
              }
            }
          }
        }
      }
    }

    // Translate pricing tiers
    const { data: pricingTiers } = await supabase
      .from("tournament_event_pricing_tiers")
      .select("*")
      .eq("event_id", id)
      .order("display_order")

    if (pricingTiers?.length) {
      for (const tier of pricingTiers) {
        for (const targetLang of targetLanguages) {
          if (targetLang === sourceLanguage) continue
          
          const targetSuffix = targetLang === "en" ? "" : `_${targetLang}`
          const sourceSuffix = sourceLanguage === "en" ? "" : `_${sourceLanguage}`
          
          const sourceName = tier[`name${sourceSuffix}`]
          if (sourceName) {
            const response = await fetch(`${baseUrl}/api/translate/batch`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                fields: [{ field: `name${targetSuffix}`, text: sourceName, fieldType: "title" }],
                targetLanguage: targetLang,
                sourceLanguage: sourceLanguage,
              }),
            })
            
            if (response.ok) {
              const result = await response.json()
              if (result.translations) {
                const tierUpdates: Record<string, string> = {}
                for (const [field, translation] of Object.entries(result.translations)) {
                  tierUpdates[field] = translation as string
                }
                if (Object.keys(tierUpdates).length > 0) {
                  await supabase
                    .from("tournament_event_pricing_tiers")
                    .update(tierUpdates)
                    .eq("id", tier.id)
                }
              }
            }
          }
        }
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
