import { createClient } from "@/lib/supabase/server"
import { headers } from "next/headers"
import { getUserType } from "@/lib/supabase/get-user-type"

const BATCH_SIZE = 3 // Process 3 trips in parallel

interface TripToTranslate {
  id: string
  title: string
  description: string | null
  location: string | null
  refund_policy: string | null
  overview_content: string | null
  highlights: string[] | null
  title_ko: string | null
  title_de: string | null
  description_ko: string | null
  description_de: string | null
  refund_policy_ko: string | null
  refund_policy_de: string | null
  overview_content_ko: string | null
  overview_content_de: string | null
  highlights_ko: string[] | null
  highlights_de: string[] | null
}

function needsTranslation(trip: TripToTranslate): boolean {
  // Check if any translatable field is missing Korean or German translation
  if (trip.title && (!trip.title_ko || !trip.title_de)) return true
  if (trip.description && (!trip.description_ko || !trip.description_de)) return true
  if (trip.refund_policy && (!trip.refund_policy_ko || !trip.refund_policy_de)) return true
  if (trip.overview_content && (!trip.overview_content_ko || !trip.overview_content_de)) return true
  if (trip.highlights?.length && (!trip.highlights_ko?.length || !trip.highlights_de?.length)) return true
  return false
}

async function translateTrip(
  baseUrl: string,
  trip: TripToTranslate,
  supabase: any
): Promise<boolean> {
  const updates: Record<string, any> = {}

  // Only translate fields that are missing
  const fieldsToTranslateKo: { field: string; text: string; fieldType: string }[] = []
  const fieldsToTranslateDe: { field: string; text: string; fieldType: string }[] = []

  if (trip.title) {
    if (!trip.title_ko) fieldsToTranslateKo.push({ field: "title_ko", text: trip.title, fieldType: "title" })
    if (!trip.title_de) fieldsToTranslateDe.push({ field: "title_de", text: trip.title, fieldType: "title" })
  }
  if (trip.description) {
    if (!trip.description_ko) fieldsToTranslateKo.push({ field: "description_ko", text: trip.description, fieldType: "description" })
    if (!trip.description_de) fieldsToTranslateDe.push({ field: "description_de", text: trip.description, fieldType: "description" })
  }
  if (trip.refund_policy) {
    if (!trip.refund_policy_ko) fieldsToTranslateKo.push({ field: "refund_policy_ko", text: trip.refund_policy, fieldType: "description" })
    if (!trip.refund_policy_de) fieldsToTranslateDe.push({ field: "refund_policy_de", text: trip.refund_policy, fieldType: "description" })
  }
  if (trip.overview_content) {
    if (!trip.overview_content_ko) fieldsToTranslateKo.push({ field: "overview_content_ko", text: trip.overview_content, fieldType: "description" })
    if (!trip.overview_content_de) fieldsToTranslateDe.push({ field: "overview_content_de", text: trip.overview_content, fieldType: "description" })
  }

  // Batch translate Korean and German fields in parallel
  const [koResult, deResult] = await Promise.all([
    fieldsToTranslateKo.length > 0 
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
    fieldsToTranslateDe.length > 0
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

  // Translate highlights arrays if needed (in parallel)
  if (trip.highlights?.length) {
    const needsKo = !trip.highlights_ko?.length
    const needsDe = !trip.highlights_de?.length

    if (needsKo || needsDe) {
      const highlightPromises = trip.highlights.filter(h => h.trim()).map(async (h) => {
        const results: { ko?: string; de?: string } = {}
        const promises: Promise<void>[] = []

        if (needsKo) {
          promises.push(
            fetch(`${baseUrl}/api/translate`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ text: h, targetLanguage: "ko", sourceLanguage: "en", fieldType: "highlights" }),
            }).then(r => r.ok ? r.json() : null).then(data => { results.ko = data?.translation || h }).catch(() => { results.ko = h })
          )
        }
        if (needsDe) {
          promises.push(
            fetch(`${baseUrl}/api/translate`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ text: h, targetLanguage: "de", sourceLanguage: "en", fieldType: "highlights" }),
            }).then(r => r.ok ? r.json() : null).then(data => { results.de = data?.translation || h }).catch(() => { results.de = h })
          )
        }

        await Promise.all(promises)
        return results
      })

      const highlightResults = await Promise.all(highlightPromises)
      if (needsKo) updates.highlights_ko = highlightResults.map(r => r.ko || '')
      if (needsDe) updates.highlights_de = highlightResults.map(r => r.de || '')
    }
  }

  // Update if we have translations
  if (Object.keys(updates).length > 0) {
    const { error } = await supabase.from("trips").update(updates).eq("id", trip.id)
    if (error) {
      console.error(`Error updating trip ${trip.id}:`, error)
      return false
    }
  }

  return true
}

export async function POST() {
  try {
    const supabase = await createClient()
    const userType = await getUserType()

    if (userType !== "admin") {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { 
        status: 401,
        headers: { "Content-Type": "application/json" }
      })
    }

    const headersList = await headers()
    const host = headersList.get("host") || "localhost:3000"
    const protocol = process.env.NODE_ENV === "production" ? "https" : "http"
    const baseUrl = `${protocol}://${host}`

    // Get all trips with their translation status
    const { data: allTrips } = await supabase
      .from("trips")
      .select("id, title, description, location, refund_policy, overview_content, highlights, title_ko, title_de, description_ko, description_de, refund_policy_ko, refund_policy_de, overview_content_ko, overview_content_de, highlights_ko, highlights_de")
      .not("title", "is", null)

    // Filter to only trips that actually need translation
    const trips = (allTrips || []).filter(needsTranslation)
    const totalTrips = trips.length
    const skipped = (allTrips?.length || 0) - totalTrips

    if (totalTrips === 0) {
      return new Response(JSON.stringify({ 
        type: "complete",
        success: true,
        message: `All ${skipped} trips are already fully translated`,
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

        const results = { total: totalTrips, translated: 0, errors: 0 }

        sendProgress({
          type: "progress",
          completed: 0,
          total: totalTrips,
          message: `Translating ${totalTrips} trips (${skipped} already complete)...`
        })

        // Process in batches for speed
        for (let i = 0; i < trips.length; i += BATCH_SIZE) {
          const batch = trips.slice(i, i + BATCH_SIZE)
          const batchResults = await Promise.all(
            batch.map(trip => translateTrip(baseUrl, trip, supabase))
          )
          
          for (const success of batchResults) {
            if (success) results.translated++
            else results.errors++
          }

          const completed = Math.min(i + BATCH_SIZE, trips.length)
          sendProgress({
            type: "progress",
            completed,
            total: totalTrips,
            message: `Translating trips... (${completed}/${totalTrips})`
          })
        }

        sendProgress({
          type: "complete",
          success: true,
          message: `Translated ${results.translated} trips (${skipped} were already complete)`,
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
    console.error("Error in translate-trips:", error)
    return new Response(JSON.stringify({ error: "Translation failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    })
  }
}
