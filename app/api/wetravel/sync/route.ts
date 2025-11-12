import { NextResponse } from "next/server"
import { listTrips } from "@/lib/wetravel/trips"
import { createClient } from "@/lib/supabase/server"
import { getUserType } from "@/lib/supabase/get-user-type"

/**
 * Sync trips from WeTravel API to Supabase
 * This endpoint pulls trips from WeTravel and stores them in the database
 * Admin can then assign continents to organize them
 */
export async function POST() {
  try {
    const supabase = await createClient()

    // Check auth
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userType = await getUserType()

    if (userType !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    if (!process.env.WETRAVEL_REFRESH_TOKEN) {
      return NextResponse.json(
        {
          error: "WeTravel API not configured",
          message: "Please add WETRAVEL_REFRESH_TOKEN to environment variables",
        },
        { status: 503 },
      )
    }

    // Get trips from WeTravel
    const weTravelTrips = await listTrips()

    if (!weTravelTrips || weTravelTrips.length === 0) {
      return NextResponse.json({ error: "No trips found in WeTravel" }, { status: 404 })
    }

    let syncedCount = 0
    let updatedCount = 0
    const errors: string[] = []

    // Sync each trip to Supabase
    for (const trip of weTravelTrips) {
      try {
        // Check if trip exists in Supabase
        const { data: existingTrip } = await supabase
          .from("trips")
          .select("id, continent")
          .eq("wetravel_uuid", trip.uuid)
          .single()

        const tripData = {
          wetravel_uuid: trip.uuid,
          title: trip.title || "Untitled Trip",
          slug: trip.trip_id?.toLowerCase() || trip.uuid,
          description: trip.welcome_message || null,
          location: trip.destination || "Unknown",
          booking_url: trip.url || null,
          // Default values for fields not in WeTravel API
          price_regular: 0,
          duration_nights: 1,
          max_guests: trip.group_max || 20,
          includes_breakfast: false,
          includes_transport: false,
          available_courses: [],
        }

        if (existingTrip) {
          // Update existing trip, but preserve the continent assignment
          const { error } = await supabase
            .from("trips")
            .update({
              ...tripData,
              continent: existingTrip.continent, // Preserve continent
            })
            .eq("wetravel_uuid", trip.uuid)

          if (error) throw error
          updatedCount++
        } else {
          // Insert new trip (needs destination_id, use first destination or create default)
          const { data: defaultDestination } = await supabase.from("destinations").select("id").limit(1).single()

          if (defaultDestination) {
            const { error } = await supabase.from("trips").insert({
              ...tripData,
              destination_id: defaultDestination.id,
            })

            if (error) throw error
            syncedCount++
          } else {
            errors.push(`No destinations found in database for trip ${trip.title}`)
          }
        }
      } catch (error) {
        console.error(`[v0] Error syncing trip ${trip.uuid}:`, error)
        errors.push(`Failed to sync ${trip.title}: ${error instanceof Error ? error.message : "Unknown error"}`)
      }
    }

    return NextResponse.json({
      success: true,
      synced: syncedCount,
      updated: updatedCount,
      total: weTravelTrips.length,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error("[v0] Error syncing WeTravel trips:", error)
    return NextResponse.json(
      {
        error: "Failed to sync trips",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
