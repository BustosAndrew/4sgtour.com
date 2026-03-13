import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { autoTranslateTrip, autoTranslateTournamentEvent } from "@/lib/auto-translate"
import { headers } from "next/headers"

export async function POST(request: Request) {
  const supabase = await createClient()

  // Check if user is admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: adminUser } = await supabase
    .from("admin_users")
    .select("id")
    .eq("user_id", user.id)
    .single()

  if (!adminUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const headersList = await headers()
  const host = headersList.get("host") || "localhost:3000"
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http"
  const baseUrl = `${protocol}://${host}`

  const results = {
    trips: { total: 0, translated: 0, errors: 0 },
    events: { total: 0, translated: 0, errors: 0 },
  }

  // Get all trips missing Korean OR German translations
  const { data: trips } = await supabase
    .from("trips")
    .select("id, title, description, location, refund_policy, overview_content, highlights, title_ko, title_de")
    .not("title", "is", null)
    .or("title_ko.is.null,title_de.is.null")

  if (trips && trips.length > 0) {
    results.trips.total = trips.length

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
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500))
      } catch (error) {
        console.error(`Failed to translate trip ${trip.id}:`, error)
        results.trips.errors++
      }
    }
  }

  // Get all tournament events missing Korean OR German translations
  const { data: events } = await supabase
    .from("tournament_events")
    .select("id, title, location, description, trip_highlights, travel_itinerary, includes, excludes, title_ko, title_de")
    .not("title", "is", null)
    .or("title_ko.is.null,title_de.is.null")

  if (events && events.length > 0) {
    results.events.total = events.length

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
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500))
      } catch (error) {
        console.error(`Failed to translate event ${event.id}:`, error)
        results.events.errors++
      }
    }
  }

  return NextResponse.json({
    success: true,
    message: `Translated ${results.trips.translated} trips and ${results.events.translated} events`,
    results,
  })
}
