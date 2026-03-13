import { createClient } from "@/lib/supabase/server"
import { headers } from "next/headers"
import { getUserType } from "@/lib/supabase/get-user-type"

const LANGUAGE_MAP: Record<string, { name: string; code: string }> = {
  en: { name: "English", code: "en" },
  ko: { name: "Korean", code: "ko" },
  de: { name: "German", code: "de" },
}

// Field mappings for each language suffix
const TRIP_FIELDS = {
  title: { type: "title" },
  description: { type: "description" },
  refund_policy: { type: "description" },
  overview_content: { type: "description" },
}

const TRIP_ARRAY_FIELDS = ["highlights"]

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

    if (!sourceLanguage || !targetLanguages?.length) {
      return new Response(JSON.stringify({ error: "Source language and target languages are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      })
    }

    // Validate languages
    if (!["en", "ko", "de"].includes(sourceLanguage)) {
      return new Response(JSON.stringify({ error: "Invalid source language" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      })
    }

    const validTargets = targetLanguages.filter((l: string) => ["en", "ko", "de"].includes(l) && l !== sourceLanguage)
    if (validTargets.length === 0) {
      return new Response(JSON.stringify({ error: "At least one valid target language is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      })
    }

    // Fetch the trip
    const { data: trip, error } = await supabase
      .from("trips")
      .select("*")
      .eq("id", id)
      .single()

    console.log("[v0] translate-trip: fetched trip", id, "error:", error)
    console.log("[v0] translate-trip: sourceLanguage:", sourceLanguage, "targetLanguages:", validTargets)

    if (error || !trip) {
      return new Response(JSON.stringify({ error: "Trip not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      })
    }
    
    console.log("[v0] translate-trip: trip title:", trip.title, "title_ko:", trip.title_ko, "title_de:", trip.title_de)

    const headersList = await headers()
    const host = headersList.get("host") || "localhost:3000"
    const protocol = process.env.NODE_ENV === "production" ? "https" : "http"
    const baseUrl = `${protocol}://${host}`

    const updates: Record<string, any> = {}

    // Get source field suffix (empty for English, _ko for Korean, _de for German)
    const sourceSuffix = sourceLanguage === "en" ? "" : `_${sourceLanguage}`

    // Translate simple fields for each target language
    for (const targetLang of validTargets) {
      const targetSuffix = targetLang === "en" ? "" : `_${targetLang}`
      const fieldsToTranslate: { field: string; text: string; fieldType: string }[] = []

      for (const [fieldBase, { type }] of Object.entries(TRIP_FIELDS)) {
        const sourceField = `${fieldBase}${sourceSuffix}`
        const targetField = `${fieldBase}${targetSuffix}`
        const sourceValue = trip[sourceField]

        if (sourceValue) {
          fieldsToTranslate.push({ field: targetField, text: sourceValue, fieldType: type })
        }
      }

      console.log("[v0] translate-trip: fieldsToTranslate for", targetLang, ":", fieldsToTranslate.length, "fields")
      
      if (fieldsToTranslate.length > 0) {
        try {
          console.log("[v0] translate-trip: calling batch translate API with fields:", fieldsToTranslate.map(f => ({ field: f.field, text: f.text?.substring(0, 50) })))
          const response = await fetch(`${baseUrl}/api/translate/batch`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fields: fieldsToTranslate,
              targetLanguage: targetLang,
              sourceLanguage: sourceLanguage,
            }),
          })

          console.log("[v0] translate-trip: batch response status:", response.status)
          
          if (response.ok) {
            const result = await response.json()
            console.log("[v0] translate-trip: batch result:", JSON.stringify(result).substring(0, 500))
            // result.translations is { fieldName: translatedText }
            if (result.translations) {
              for (const [field, translation] of Object.entries(result.translations)) {
                updates[field] = translation
              }
            }
          } else {
            const errorText = await response.text()
            console.error("[v0] translate-trip: batch error response:", errorText)
          }
        } catch (e) {
          console.error(`Error translating to ${targetLang}:`, e)
        }
      }

      // Translate array fields
      for (const arrayField of TRIP_ARRAY_FIELDS) {
        const sourceField = `${arrayField}${sourceSuffix}`
        const targetField = `${arrayField}${targetSuffix}`
        const sourceValue = trip[sourceField]

        if (sourceValue?.length) {
          try {
            const response = await fetch(`${baseUrl}/api/translate/batch`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                fields: sourceValue.map((text: string, i: number) => ({
                  field: `${arrayField}_${i}`,
                  text,
                  fieldType: "highlight",
                })),
                targetLanguage: targetLang,
                sourceLanguage: sourceLanguage,
              }),
            })

            if (response.ok) {
              const result = await response.json()
              // result.translations is { fieldName: translatedText }
              if (result.translations) {
                const translatedArray = sourceValue.map((_: string, i: number) => {
                  const key = `${arrayField}_${i}`
                  return result.translations[key] || ""
                }).filter((t: string) => t)
                if (translatedArray.length > 0) {
                  updates[targetField] = translatedArray
                }
              }
            }
          } catch (e) {
            console.error(`Error translating array field to ${targetLang}:`, e)
          }
        }
      }
    }

    // Update the trip with translations
    console.log("[v0] translate-trip: total updates:", Object.keys(updates).length, Object.keys(updates))
    
    if (Object.keys(updates).length > 0) {
      console.log("[v0] translate-trip: saving updates to database...")
      const { error: updateError } = await supabase
        .from("trips")
        .update(updates)
        .eq("id", id)

      if (updateError) {
        console.error("[v0] translate-trip: update error:", updateError)
        return new Response(JSON.stringify({ error: "Failed to save translations" }), {
          status: 500,
          headers: { "Content-Type": "application/json" }
        })
      }
      console.log("[v0] translate-trip: updates saved successfully")
    } else {
      console.log("[v0] translate-trip: no updates to save")
    }

    const targetNames = validTargets.map((l: string) => LANGUAGE_MAP[l].name).join(" & ")
    return new Response(JSON.stringify({ 
      success: true,
      message: `Translated to ${targetNames}`,
      fieldsUpdated: Object.keys(updates).length
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    })

  } catch (error) {
    console.error("Error in translate-trip:", error)
    return new Response(JSON.stringify({ error: "Translation failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    })
  }
}
