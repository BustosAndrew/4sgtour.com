import { createClient } from "@/lib/supabase/server"
import { autoTranslateTrip } from "@/lib/auto-translate"
import { headers } from "next/headers"
import { getUserType } from "@/lib/supabase/get-user-type"

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

    // Get all trips missing ANY Korean OR German translations
    const { data: trips } = await supabase
      .from("trips")
      .select("id, title, description, location, refund_policy, overview_content, highlights, title_ko, title_de, description_ko, description_de, refund_policy_ko, refund_policy_de, overview_content_ko, overview_content_de")
      .not("title", "is", null)
      .or("title_ko.is.null,title_de.is.null,description_ko.is.null,description_de.is.null,refund_policy_ko.is.null,refund_policy_de.is.null,overview_content_ko.is.null,overview_content_de.is.null")

    const totalTrips = trips?.length || 0

    if (totalTrips === 0) {
      return new Response(JSON.stringify({ 
        type: "complete",
        success: true,
        message: "All trips are already translated",
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

        const results = { total: totalTrips, translated: 0, errors: 0 }

        sendProgress({
          type: "progress",
          completed: 0,
          total: totalTrips,
          message: `Starting translation of ${totalTrips} trips...`
        })

        if (trips) {
          for (let i = 0; i < trips.length; i++) {
            const trip = trips[i]
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
              results.translated++
            } catch (error) {
              console.error(`Failed to translate trip ${trip.id}:`, error)
              results.errors++
            }
            sendProgress({
              type: "progress",
              completed: i + 1,
              total: totalTrips,
              message: `Translating trips... (${i + 1}/${totalTrips})`
            })
            await new Promise(resolve => setTimeout(resolve, 300))
          }
        }

        sendProgress({
          type: "complete",
          success: true,
          message: `Translated ${results.translated} trips to Korean & German`,
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
