/**
 * Auto-translate helper for trips and events
 * Translates from the source language (en or ko) to all other languages (ko, de or en, de)
 */

interface TranslateFieldsParams {
  fields: { field: string; text: string; fieldType: string }[]
  targetLanguage: string
  sourceLanguage: string
}

interface TranslationResult {
  [key: string]: string
}

async function translateBatch(
  baseUrl: string,
  params: TranslateFieldsParams
): Promise<TranslationResult> {
  try {
    const response = await fetch(`${baseUrl}/api/translate/batch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    })

    if (response.ok) {
      const data = await response.json()
      return data.translations || {}
    }
  } catch (error) {
    console.error("[auto-translate] Batch translation error:", error)
  }
  return {}
}

async function translateSingle(
  baseUrl: string,
  text: string,
  targetLanguage: string,
  sourceLanguage: string,
  fieldType: string
): Promise<string | null> {
  try {
    const response = await fetch(`${baseUrl}/api/translate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        targetLanguage,
        sourceLanguage,
        fieldType,
      }),
    })

    if (response.ok) {
      const data = await response.json()
      return data.translation || null
    }
  } catch (error) {
    console.error("[auto-translate] Single translation error:", error)
  }
  return null
}

/**
 * Auto-translate trip fields from source language to other languages
 * Called after trip create/update
 */
export async function autoTranslateTrip(
  baseUrl: string,
  tripId: string,
  sourceData: {
    title?: string
    description?: string
    location?: string
    refund_policy?: string
    highlights?: string[]
  },
  sourceLanguage: "en" | "ko",
  supabase: any
): Promise<void> {
  const targetLanguages = sourceLanguage === "en" ? ["ko", "de"] : ["en", "de"]

  for (const targetLang of targetLanguages) {
    const updates: Record<string, any> = {}
    const suffix = targetLang === "en" ? "" : `_${targetLang}`

    // Translate text fields
    const fieldsToTranslate: { field: string; text: string; fieldType: string }[] = []

    if (sourceData.title) {
      fieldsToTranslate.push({ field: `title${suffix}`, text: sourceData.title, fieldType: "title" })
    }
    if (sourceData.description) {
      fieldsToTranslate.push({ field: `description${suffix}`, text: sourceData.description, fieldType: "description" })
    }
    if (sourceData.location) {
      fieldsToTranslate.push({ field: `location${suffix}`, text: sourceData.location, fieldType: "location" })
    }
    if (sourceData.refund_policy) {
      fieldsToTranslate.push({ field: `refund_policy${suffix}`, text: sourceData.refund_policy, fieldType: "description" })
    }

    if (fieldsToTranslate.length > 0) {
      const translations = await translateBatch(baseUrl, {
        fields: fieldsToTranslate,
        targetLanguage: targetLang,
        sourceLanguage,
      })
      Object.assign(updates, translations)
    }

    // Translate highlights array
    if (sourceData.highlights && sourceData.highlights.length > 0) {
      const translatedHighlights: string[] = []
      for (const highlight of sourceData.highlights) {
        if (highlight.trim()) {
          const translated = await translateSingle(
            baseUrl,
            highlight,
            targetLang,
            sourceLanguage,
            "highlights"
          )
          translatedHighlights.push(translated || highlight)
        }
      }
      updates[`highlights${suffix}`] = translatedHighlights
    }

    // Update the trip with translations
    if (Object.keys(updates).length > 0) {
      const { error } = await supabase
        .from("trips")
        .update(updates)
        .eq("id", tripId)

      if (error) {
        console.error(`[auto-translate] Error updating trip ${targetLang}:`, error)
      }
    }
  }
}

/**
 * Auto-translate tournament event fields from source language to other languages
 * Called after event create/update
 */
export async function autoTranslateTournamentEvent(
  baseUrl: string,
  eventId: string,
  sourceData: {
    title?: string
    description?: string
    location?: string
    trip_highlights?: string
    travel_itinerary?: string
    includes?: string
    excludes?: string
  },
  sourceLanguage: "en" | "ko",
  supabase: any
): Promise<void> {
  const targetLanguages = sourceLanguage === "en" ? ["ko", "de"] : ["en", "de"]

  for (const targetLang of targetLanguages) {
    const updates: Record<string, any> = {}
    const suffix = targetLang === "en" ? "" : `_${targetLang}`

    const fieldsToTranslate: { field: string; text: string; fieldType: string }[] = []

    if (sourceData.title) {
      fieldsToTranslate.push({ field: `title${suffix}`, text: sourceData.title, fieldType: "title" })
    }
    if (sourceData.location) {
      fieldsToTranslate.push({ field: `location${suffix}`, text: sourceData.location, fieldType: "location" })
    }
    if (sourceData.description) {
      fieldsToTranslate.push({ field: `description${suffix}`, text: sourceData.description, fieldType: "description" })
    }
    if (sourceData.trip_highlights) {
      fieldsToTranslate.push({ field: `trip_highlights${suffix}`, text: sourceData.trip_highlights, fieldType: "highlights" })
    }
    if (sourceData.travel_itinerary) {
      fieldsToTranslate.push({ field: `travel_itinerary${suffix}`, text: sourceData.travel_itinerary, fieldType: "description" })
    }
    if (sourceData.includes) {
      fieldsToTranslate.push({ field: `includes${suffix}`, text: sourceData.includes, fieldType: "highlights" })
    }
    if (sourceData.excludes) {
      fieldsToTranslate.push({ field: `excludes${suffix}`, text: sourceData.excludes, fieldType: "highlights" })
    }

    if (fieldsToTranslate.length > 0) {
      const translations = await translateBatch(baseUrl, {
        fields: fieldsToTranslate,
        targetLanguage: targetLang,
        sourceLanguage,
      })
      Object.assign(updates, translations)
    }

    // Update the event with translations
    if (Object.keys(updates).length > 0) {
      const { error } = await supabase
        .from("tournament_events")
        .update(updates)
        .eq("id", eventId)

      if (error) {
        console.error(`[auto-translate] Error updating event ${targetLang}:`, error)
      }
    }
  }
}
