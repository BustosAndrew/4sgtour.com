import { createClient } from "@/lib/supabase/server"
import { headers } from "next/headers"
import { getUserType } from "@/lib/supabase/get-user-type"

const BATCH_SIZE = 3 // Process 3 events in parallel

interface EventToTranslate {
  id: string
  title: string
  location: string | null
  description: string[] | null
  trip_highlights: string[] | null
  travel_itinerary: string[] | null
  includes: string[] | null
  excludes: string[] | null
  title_ko: string | null
  title_de: string | null
  location_ko: string | null
  location_de: string | null
  description_ko: string[] | null
  description_de: string[] | null
  trip_highlights_ko: string[] | null
  trip_highlights_de: string[] | null
  travel_itinerary_ko: string[] | null
  travel_itinerary_de: string[] | null
  includes_ko: string[] | null
  includes_de: string[] | null
  excludes_ko: string[] | null
  excludes_de: string[] | null
}

function needsTranslation(event: EventToTranslate, languages: string[]): boolean {
  const needsKo = languages.includes("ko")
  const needsDe = languages.includes("de")
  
  // Check if any translatable field is missing requested language translations
  if (event.title && ((needsKo && !event.title_ko) || (needsDe && !event.title_de))) return true
  if (event.location && ((needsKo && !event.location_ko) || (needsDe && !event.location_de))) return true
  if (event.description?.length && ((needsKo && !event.description_ko?.length) || (needsDe && !event.description_de?.length))) return true
  if (event.trip_highlights?.length && ((needsKo && !event.trip_highlights_ko?.length) || (needsDe && !event.trip_highlights_de?.length))) return true
  if (event.travel_itinerary?.length && ((needsKo && !event.travel_itinerary_ko?.length) || (needsDe && !event.travel_itinerary_de?.length))) return true
  if (event.includes?.length && ((needsKo && !event.includes_ko?.length) || (needsDe && !event.includes_de?.length))) return true
  if (event.excludes?.length && ((needsKo && !event.excludes_ko?.length) || (needsDe && !event.excludes_de?.length))) return true
  return false
}

async function translateArrayField(
  baseUrl: string,
  items: string[],
  targetLang: string,
  fieldType: string
): Promise<string[]> {
  const results = await Promise.all(
    items.filter(item => item?.trim()).map(async (item) => {
      try {
        const res = await fetch(`${baseUrl}/api/translate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: item, targetLanguage: targetLang, sourceLanguage: "en", fieldType }),
        })
        if (res.ok) {
          const data = await res.json()
          return data.translation || item
        }
        return item
      } catch {
        return item
      }
    })
  )
  return results
}

async function translateEvent(
  baseUrl: string,
  event: EventToTranslate,
  supabase: any,
  languages: string[]
): Promise<boolean> {
  const updates: Record<string, any> = {}
  const translateKo = languages.includes("ko")
  const translateDe = languages.includes("de")

  // Only translate fields that are missing for requested languages
  const fieldsToTranslateKo: { field: string; text: string; fieldType: string }[] = []
  const fieldsToTranslateDe: { field: string; text: string; fieldType: string }[] = []

  if (event.title) {
    if (translateKo && !event.title_ko) fieldsToTranslateKo.push({ field: "title_ko", text: event.title, fieldType: "title" })
    if (translateDe && !event.title_de) fieldsToTranslateDe.push({ field: "title_de", text: event.title, fieldType: "title" })
  }
  if (event.location) {
    if (translateKo && !event.location_ko) fieldsToTranslateKo.push({ field: "location_ko", text: event.location, fieldType: "location" })
    if (translateDe && !event.location_de) fieldsToTranslateDe.push({ field: "location_de", text: event.location, fieldType: "location" })
  }

  // Batch translate simple string fields in parallel (only for requested languages)
  const [koResult, deResult] = await Promise.all([
    translateKo && fieldsToTranslateKo.length > 0 
      ? fetch(`${baseUrl}/api/translate/batch`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fields: fieldsToTranslateKo,
            targetLanguage: "ko",
            sourceLanguage: "en",
          }),
        }).then(r => r.ok ? r.json() : null).catch(() => null)
      : null,
    translateDe && fieldsToTranslateDe.length > 0
      ? fetch(`${baseUrl}/api/translate/batch`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fields: fieldsToTranslateDe,
            targetLanguage: "de",
            sourceLanguage: "en",
          }),
        }).then(r => r.ok ? r.json() : null).catch(() => null)
      : null,
  ])

  if (koResult?.translations) Object.assign(updates, koResult.translations)
  if (deResult?.translations) Object.assign(updates, deResult.translations)

  // Translate array fields in parallel
  const arrayFieldPromises: Promise<void>[] = []

  const arrayFields = [
    { key: 'description', data: event.description, ko: event.description_ko, de: event.description_de, fieldType: 'description' },
    { key: 'trip_highlights', data: event.trip_highlights, ko: event.trip_highlights_ko, de: event.trip_highlights_de, fieldType: 'highlights' },
    { key: 'travel_itinerary', data: event.travel_itinerary, ko: event.travel_itinerary_ko, de: event.travel_itinerary_de, fieldType: 'description' },
    { key: 'includes', data: event.includes, ko: event.includes_ko, de: event.includes_de, fieldType: 'highlights' },
    { key: 'excludes', data: event.excludes, ko: event.excludes_ko, de: event.excludes_de, fieldType: 'highlights' },
  ]

  for (const { key, data, ko, de, fieldType } of arrayFields) {
    if (data?.length) {
      if (translateKo && !ko?.length) {
        arrayFieldPromises.push(
          translateArrayField(baseUrl, data, "ko", fieldType)
            .then(translated => { updates[`${key}_ko`] = translated })
        )
      }
      if (translateDe && !de?.length) {
        arrayFieldPromises.push(
          translateArrayField(baseUrl, data, "de", fieldType)
            .then(translated => { updates[`${key}_de`] = translated })
        )
      }
    }
  }

  await Promise.all(arrayFieldPromises)

  // Update if we have translations
  if (Object.keys(updates).length > 0) {
    const { error } = await supabase.from("tournament_events").update(updates).eq("id", event.id)
    if (error) {
      console.error(`Error updating event ${event.id}:`, error)
      return false
    }
  }

  return true
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const userType = await getUserType()

    if (userType !== "admin") {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { 
        status: 401,
        headers: { "Content-Type": "application/json" }
      })
    }

    // Parse languages from request body
    let languages: string[] = ["ko", "de"] // Default to both
    try {
      const body = await request.json()
      if (body.languages && Array.isArray(body.languages) && body.languages.length > 0) {
        languages = body.languages.filter((l: string) => ["ko", "de"].includes(l))
      }
    } catch {
      // Use default languages if no body
    }

    const headersList = await headers()
    const host = headersList.get("host") || "localhost:3000"
    const protocol = process.env.NODE_ENV === "production" ? "https" : "http"
    const baseUrl = `${protocol}://${host}`

    // Get all events with their translation status
    const { data: allEvents } = await supabase
      .from("tournament_events")
      .select(`
        id, title, location, description, trip_highlights, travel_itinerary, includes, excludes,
        title_ko, title_de, location_ko, location_de,
        description_ko, description_de,
        trip_highlights_ko, trip_highlights_de,
        travel_itinerary_ko, travel_itinerary_de,
        includes_ko, includes_de,
        excludes_ko, excludes_de
      `)
      .not("title", "is", null)

    // Filter to only events that actually need translation for selected languages
    const events = (allEvents || []).filter(e => needsTranslation(e, languages))
    const totalEvents = events.length
    const skipped = (allEvents?.length || 0) - totalEvents

    if (totalEvents === 0) {
      return new Response(JSON.stringify({ 
        type: "complete",
        success: true,
        message: `All ${skipped} tournament events are already fully translated`,
        results: { total: 0, translated: 0, skipped, errors: 0 }
      }), {
        headers: { "Content-Type": "application/json" }
      })
    }

    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        const sendProgress = (data: object) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
        }

        const results = { total: totalEvents, translated: 0, errors: 0 }
        const langNames = languages.map(l => l === "ko" ? "Korean" : "German").join(" & ")

        sendProgress({
          type: "progress",
          completed: 0,
          total: totalEvents,
          message: `Translating ${totalEvents} events to ${langNames} (${skipped} already complete)...`
        })

        // Process in batches for speed
        for (let i = 0; i < events.length; i += BATCH_SIZE) {
          const batch = events.slice(i, i + BATCH_SIZE)
          const batchResults = await Promise.all(
            batch.map(event => translateEvent(baseUrl, event, supabase, languages))
          )
          
          for (const success of batchResults) {
            if (success) results.translated++
            else results.errors++
          }

          const completed = Math.min(i + BATCH_SIZE, events.length)
          sendProgress({
            type: "progress",
            completed,
            total: totalEvents,
            message: `Translating events... (${completed}/${totalEvents})`
          })
        }

        sendProgress({
          type: "complete",
          success: true,
          message: `Translated ${results.translated} events to ${langNames} (${skipped} were already complete)`,
          results
        })

        controller.close()
      }
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    })
  } catch (error) {
    console.error("Error in translate-tournaments:", error)
    return new Response(JSON.stringify({ error: "Translation failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    })
  }
}
