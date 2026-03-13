import { createClient } from "@/lib/supabase/server"
import { autoTranslateTrip, autoTranslateTournamentEvent } from "@/lib/auto-translate"
import { headers } from "next/headers"
import { getUserType } from "@/lib/supabase/get-user-type"

export async function POST(request: Request) {
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

  // Get all trips missing ANY Korean OR German translations (not just title)
  // This catches trips with partial translations
  const { data: trips } = await supabase
    .from("trips")
    .select("id, title, description, location, refund_policy, overview_content, highlights, title_ko, title_de, description_ko, description_de, refund_policy_ko, refund_policy_de, overview_content_ko, overview_content_de")
    .not("title", "is", null)
    .or("title_ko.is.null,title_de.is.null,description_ko.is.null,description_de.is.null,refund_policy_ko.is.null,refund_policy_de.is.null,overview_content_ko.is.null,overview_content_de.is.null")

  // Get all tournament events missing ANY Korean OR German translations
  const { data: events } = await supabase
    .from("tournament_events")
    .select("id, title, location, description, trip_highlights, travel_itinerary, includes, excludes, title_ko, title_de, description_ko, description_de")
    .not("title", "is", null)
    .or("title_ko.is.null,title_de.is.null,description_ko.is.null,description_de.is.null")

  const totalTrips = trips?.length || 0
  const totalEvents = events?.length || 0
  const totalItems = totalTrips + totalEvents

  // Use streaming response for progress updates
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const sendProgress = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
      }

      const results = {
        trips: { total: totalTrips, translated: 0, errors: 0 },
        events: { total: totalEvents, translated: 0, errors: 0 },
      }

      let completed = 0

      // Send initial progress
      sendProgress({
        type: "progress",
        completed: 0,
        total: totalItems,
        phase: "trips",
        message: `Starting translation of ${totalTrips} trips and ${totalEvents} events...`
      })

      // Translate trips
      if (trips && trips.length > 0) {
        for (const trip of trips) {
          try {
            await autoTranslateTrip(
              baseUrl,
              trip.id,
              {
                title: trip.title,
                description: trip.description,
                location: trip.location,
                refund_policy: trip.refund_policy,
                overview_content: trip.overview_content,
                highlights: trip.highlights,
              },
              "en",
              supabase
            )
            results.trips.translated++
          } catch (error) {
            console.error(`Failed to translate trip ${trip.id}:`, error)
            results.trips.errors++
          }
          completed++
          sendProgress({
            type: "progress",
            completed,
            total: totalItems,
            phase: "trips",
            message: `Translating trips... (${results.trips.translated}/${totalTrips})`
          })
          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 300))
        }
      }

      // Translate events
      if (events && events.length > 0) {
        for (const event of events) {
          try {
            await autoTranslateTournamentEvent(
              baseUrl,
              event.id,
              {
                title: event.title,
                location: event.location,
                description: event.description,
                trip_highlights: event.trip_highlights,
                travel_itinerary: event.travel_itinerary,
                includes: event.includes,
                excludes: event.excludes,
              },
              "en",
              supabase
            )
            results.events.translated++
          } catch (error) {
            console.error(`Failed to translate event ${event.id}:`, error)
            results.events.errors++
          }
          completed++
          sendProgress({
            type: "progress",
            completed,
            total: totalItems,
            phase: "events",
            message: `Translating events... (${results.events.translated}/${totalEvents})`
          })
          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 300))
        }
      }

      // Send completion
      sendProgress({
        type: "complete",
        success: true,
        message: `Translated ${results.trips.translated} trips and ${results.events.translated} events to Korean & German`,
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
}
