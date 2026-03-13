import { createClient } from "@/lib/supabase/server"
import { autoTranslateTournamentEvent } from "@/lib/auto-translate"
import { headers } from "next/headers"
import { getUserType } from "@/lib/supabase/get-user-type"

export async function POST() {
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

  // Get all tournament events missing ANY Korean OR German translations
  const { data: events } = await supabase
    .from("tournament_events")
    .select("id, title, location, description, trip_highlights, travel_itinerary, includes, excludes, title_ko, title_de, description_ko, description_de")
    .not("title", "is", null)
    .or("title_ko.is.null,title_de.is.null,description_ko.is.null,description_de.is.null")

  const totalEvents = events?.length || 0

  if (totalEvents === 0) {
    return new Response(JSON.stringify({ 
      type: "complete",
      success: true,
      message: "All tournament events are already translated",
      results: { total: 0, translated: 0, errors: 0 }
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

      sendProgress({
        type: "progress",
        completed: 0,
        total: totalEvents,
        message: `Starting translation of ${totalEvents} tournament events...`
      })

      if (events) {
        for (let i = 0; i < events.length; i++) {
          const event = events[i]
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
            results.translated++
          } catch (error) {
            console.error(`Failed to translate event ${event.id}:`, error)
            results.errors++
          }
          sendProgress({
            type: "progress",
            completed: i + 1,
            total: totalEvents,
            message: `Translating events... (${i + 1}/${totalEvents})`
          })
          await new Promise(resolve => setTimeout(resolve, 300))
        }
      }

      sendProgress({
        type: "complete",
        success: true,
        message: `Translated ${results.translated} tournament events to Korean & German`,
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
