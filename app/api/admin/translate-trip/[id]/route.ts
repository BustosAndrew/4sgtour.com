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
  location: { type: "location" },
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

    if (error || !trip) {
      return new Response(JSON.stringify({ error: "Trip not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      })
    }

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

      if (fieldsToTranslate.length > 0) {
        try {
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

    // Translate packages
    const { data: packages } = await supabase
      .from("packages")
      .select("*")
      .eq("trip_id", id)

    if (packages?.length) {
      for (const targetLang of validTargets) {
        const targetSuffix = targetLang === "en" ? "" : `_${targetLang}`

        // Batch all package fields for this language in one call
        const packageFields: { field: string; text: string; fieldType: string; pkgId: string }[] = []

        for (const pkg of packages) {
          const sourceName = pkg[`name${sourceSuffix}`]
          const sourceDescription = pkg[`description${sourceSuffix}`]

          if (sourceName) {
            packageFields.push({ field: `name${targetSuffix}`, text: sourceName, fieldType: "title", pkgId: pkg.id })
          }
          if (sourceDescription) {
            packageFields.push({ field: `description${targetSuffix}`, text: sourceDescription, fieldType: "description", pkgId: pkg.id })
          }
        }

        if (packageFields.length > 0) {
          // Group fields by package, translate per package to keep context clear
          const pkgMap: Map<string, typeof packageFields> = new Map()
          for (const f of packageFields) {
            if (!pkgMap.has(f.pkgId)) pkgMap.set(f.pkgId, [])
            pkgMap.get(f.pkgId)!.push(f)
          }

          for (const [pkgId, fields] of pkgMap) {
            try {
              const response = await fetch(`${baseUrl}/api/translate/batch`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  fields: fields.map(({ field, text, fieldType }) => ({ field, text, fieldType })),
                  targetLanguage: targetLang,
                  sourceLanguage: sourceLanguage,
                }),
              })

              if (response.ok) {
                const result = await response.json()
                if (result.translations) {
                  await supabase
                    .from("packages")
                    .update(result.translations)
                    .eq("id", pkgId)
                }
              }
            } catch (e) {
              console.error(`Error translating package ${pkgId}:`, e)
            }
          }
        }
      }
    }

    // Update the trip with translations
    if (Object.keys(updates).length > 0) {
      const { error: updateError } = await supabase
        .from("trips")
        .update(updates)
        .eq("id", id)

      if (updateError) {
        return new Response(JSON.stringify({ error: "Failed to save translations" }), {
          status: 500,
          headers: { "Content-Type": "application/json" }
        })
      }
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
    return new Response(JSON.stringify({ error: `Translation failed: ${error instanceof Error ? error.message : 'Unknown error'}`, code: 'TRANSLATION_ERROR' }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    })
  }
}
