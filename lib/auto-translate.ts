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
    overview_content?: string
    highlights?: string[]
  },
  sourceLanguage: "en" | "ko",
  supabase: any
): Promise<void> {
  console.log("[v0] autoTranslateTrip called:", { tripId, sourceLanguage, hasDescription: !!sourceData.description })
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
    if (sourceData.overview_content) {
      fieldsToTranslate.push({ field: `overview_content${suffix}`, text: sourceData.overview_content, fieldType: "description" })
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
 * Auto-translate packages for a trip
 * Called after trip create/update when packages have translatable content
 */
export async function autoTranslatePackages(
  baseUrl: string,
  packages: Array<{
    id: string
    name?: string
    description?: string
  }>,
  sourceLanguage: "en" | "ko",
  supabase: any
): Promise<void> {
  const targetLanguages = sourceLanguage === "en" ? ["ko", "de"] : ["en", "de"]

  for (const pkg of packages) {
    if (!pkg.id) continue

    for (const targetLang of targetLanguages) {
      const updates: Record<string, any> = {}
      const suffix = targetLang === "en" ? "" : `_${targetLang}`

      const fieldsToTranslate: { field: string; text: string; fieldType: string }[] = []

      if (pkg.name) {
        fieldsToTranslate.push({ field: `name${suffix}`, text: pkg.name, fieldType: "title" })
      }
      if (pkg.description) {
        fieldsToTranslate.push({ field: `description${suffix}`, text: pkg.description, fieldType: "description" })
      }

    console.log("[v0] Fields to translate for", targetLang, ":", fieldsToTranslate.map(f => f.field))
    
    if (fieldsToTranslate.length > 0) {
      const translations = await translateBatch(baseUrl, {
        fields: fieldsToTranslate,
        targetLanguage: targetLang,
        sourceLanguage,
      })
      console.log("[v0] Translations received:", Object.keys(translations))
      Object.assign(updates, translations)
    }

      if (Object.keys(updates).length > 0) {
        const { error } = await supabase
          .from("packages")
          .update(updates)
          .eq("id", pkg.id)

        if (error) {
          console.error(`[auto-translate] Error updating package ${pkg.id} ${targetLang}:`, error)
        }
      }
    }
  }
}

/**
 * Auto-translate tournament event itinerary days
 * Called after event create/update when itinerary days are created
 */
export async function autoTranslateItineraryDays(
  baseUrl: string,
  itineraryDays: Array<{
    id: string
    title?: string
    content?: string
  }>,
  sourceLanguage: "en" | "ko",
  supabase: any
): Promise<void> {
  const targetLanguages = sourceLanguage === "en" ? ["ko", "de"] : ["en", "de"]

  for (const day of itineraryDays) {
    if (!day.id) continue

    for (const targetLang of targetLanguages) {
      const updates: Record<string, any> = {}
      const suffix = targetLang === "en" ? "" : `_${targetLang}`

      const fieldsToTranslate: { field: string; text: string; fieldType: string }[] = []

      if (day.title) {
        fieldsToTranslate.push({ field: `title${suffix}`, text: day.title, fieldType: "title" })
      }
      if (day.content) {
        fieldsToTranslate.push({ field: `content${suffix}`, text: day.content, fieldType: "description" })
      }

      if (fieldsToTranslate.length > 0) {
        const translations = await translateBatch(baseUrl, {
          fields: fieldsToTranslate,
          targetLanguage: targetLang,
          sourceLanguage,
        })
        Object.assign(updates, translations)
      }

      if (Object.keys(updates).length > 0) {
        const { error } = await supabase
          .from("tournament_event_itinerary_days")
          .update(updates)
          .eq("id", day.id)

        if (error) {
          console.error(`[auto-translate] Error updating itinerary day ${day.id} ${targetLang}:`, error)
        }
      }
    }
  }
}

/**
 * Auto-translate tournament event pricing tiers
 * Called after event create/update when pricing tiers are created
 */
export async function autoTranslatePricingTiers(
  baseUrl: string,
  pricingTiers: Array<{
    id: string
    name?: string
  }>,
  sourceLanguage: "en" | "ko",
  supabase: any
): Promise<void> {
  const targetLanguages = sourceLanguage === "en" ? ["ko", "de"] : ["en", "de"]

  for (const tier of pricingTiers) {
    if (!tier.id) continue

    for (const targetLang of targetLanguages) {
      const updates: Record<string, any> = {}
      const suffix = targetLang === "en" ? "" : `_${targetLang}`

      if (tier.name) {
        const translations = await translateBatch(baseUrl, {
          fields: [{ field: `name${suffix}`, text: tier.name, fieldType: "title" }],
          targetLanguage: targetLang,
          sourceLanguage,
        })
        Object.assign(updates, translations)
      }

      if (Object.keys(updates).length > 0) {
        const { error } = await supabase
          .from("tournament_event_pricing_tiers")
          .update(updates)
          .eq("id", tier.id)

        if (error) {
          console.error(`[auto-translate] Error updating pricing tier ${tier.id} ${targetLang}:`, error)
        }
      }
    }
  }
}

/**
 * Auto-translate tournament event fields from source language to other languages
 * Called after event create/update
 * Note: description, trip_highlights, travel_itinerary, includes, excludes are stored as arrays in the DB
 */
export async function autoTranslateTournamentEvent(
  baseUrl: string,
  eventId: string,
  sourceData: {
    title?: string
    description?: string | string[]
    location?: string
    trip_highlights?: string | string[]
    travel_itinerary?: string | string[]
    includes?: string | string[]
    excludes?: string | string[]
  },
  sourceLanguage: "en" | "ko",
  supabase: any
): Promise<void> {
  const targetLanguages = sourceLanguage === "en" ? ["ko", "de"] : ["en", "de"]

  for (const targetLang of targetLanguages) {
    const updates: Record<string, any> = {}
    const suffix = targetLang === "en" ? "" : `_${targetLang}`

    // Handle simple string fields
    const fieldsToTranslate: { field: string; text: string; fieldType: string }[] = []

    if (sourceData.title) {
      fieldsToTranslate.push({ field: `title${suffix}`, text: sourceData.title, fieldType: "title" })
    }
    if (sourceData.location) {
      fieldsToTranslate.push({ field: `location${suffix}`, text: sourceData.location, fieldType: "location" })
    }

    if (fieldsToTranslate.length > 0) {
      const translations = await translateBatch(baseUrl, {
        fields: fieldsToTranslate,
        targetLanguage: targetLang,
        sourceLanguage,
      })
      Object.assign(updates, translations)
    }

    // Handle array fields - translate each item in the array
    const arrayFields = [
      { key: 'description', data: sourceData.description, fieldType: 'description' },
      { key: 'trip_highlights', data: sourceData.trip_highlights, fieldType: 'highlights' },
      { key: 'travel_itinerary', data: sourceData.travel_itinerary, fieldType: 'description' },
      { key: 'includes', data: sourceData.includes, fieldType: 'highlights' },
      { key: 'excludes', data: sourceData.excludes, fieldType: 'highlights' },
    ]

    for (const { key, data, fieldType } of arrayFields) {
      if (data) {
        const items = Array.isArray(data) ? data : [data]
        if (items.length > 0 && items.some(item => item && item.trim())) {
          const translatedItems: string[] = []
          for (const item of items) {
            if (item && item.trim()) {
              const translated = await translateSingle(
                baseUrl,
                item,
                targetLang,
                sourceLanguage,
                fieldType
              )
              translatedItems.push(translated || item)
            } else {
              translatedItems.push(item || '')
            }
          }
          updates[`${key}${suffix}`] = translatedItems
        }
      }
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
