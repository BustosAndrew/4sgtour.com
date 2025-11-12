import { NextResponse } from "next/server"
import { getWeTravelClient } from "@/lib/wetravel/client"
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
    const weTravelClient = await getWeTravelClient()
    const response = await weTravelClient.getTrips()

    if (!response.data?.trips) {
      return NextResponse.json({ error: "No trips found in WeTravel" }, { status: 404 })
    }

    const weTravelTrips = response.data.trips
    let syncedCount = 0
    let updatedCount = 0

    // Sync each trip to Supabase
    for (const trip of weTravelTrips) {
      // Check if trip exists in Supabase
      const { data: existingTrip } = await supabase
        .from("trips")
        .select("id, continent")
        .eq("wetravel_uuid", trip.uuid)
        .single()

      const tripData = {
        wetravel_uuid: trip.uuid,
        title: trip.name || "Untitled Trip",
        slug: trip.slug || trip.uuid,
        description: trip.description || null,
        location: trip.location || "Unknown",
        price_regular: trip.price || 0,
        duration_nights: trip.duration_days || 1,
        max_guests: trip.max_spots || 20,
        booking_url: trip.booking_url || null,
        includes_breakfast: false,
        includes_transport: false,
        available_courses: [],
      }

      if (existingTrip) {
        // Update existing trip, but preserve the continent assignment
        await supabase
          .from("trips")
          .update({
            ...tripData,
            continent: existingTrip.continent, // Preserve continent
          })
          .eq("wetravel_uuid", trip.uuid)
        updatedCount++
      } else {
        // Insert new trip (needs destination_id, use first destination or create default)
        const { data: defaultDestination } = await supabase.from("destinations").select("id").limit(1).single()

        if (defaultDestination) {
          await supabase.from("trips").insert({
            ...tripData,
            destination_id: defaultDestination.id,
          })
          syncedCount++
        }
      }
    }

    return NextResponse.json({
      success: true,
      synced: syncedCount,
      updated: updatedCount,
      total: weTravelTrips.length,
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
