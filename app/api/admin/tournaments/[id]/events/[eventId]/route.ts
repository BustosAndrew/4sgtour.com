import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { getUserType } from "@/lib/supabase/get-user-type"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; eventId: string }> }
) {
  const { id: tournamentId, eventId } = await params
  const supabase = await createClient()

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

  try {
    const body = await request.json()
    const {
      title,
      location,
      date,
      duration,
      description,
      trip_highlights,
      travel_itinerary,
      includes,
      excludes,
      price,
      image,
      itinerary,
      gallery,
      pricing_tiers,
    } = body

    // Generate slug from title
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")

    // Update the event
    const { data: eventData, error: eventError } = await supabase
      .from("tournament_events")
      .update({
        title,
        slug,
        location,
        date,
        duration: duration || null,
        description: description || null,
        trip_highlights: trip_highlights || null,
        travel_itinerary: travel_itinerary || null,
        includes: includes || null,
        excludes: excludes || null,
        price: price || null,
        image: image || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", eventId)
      .eq("tournament_id", tournamentId)
      .select()
      .single()

    if (eventError) throw eventError

    // Delete existing itinerary and re-insert
    await supabase
      .from("tournament_event_itinerary_days")
      .delete()
      .eq("event_id", eventId)

    if (itinerary && itinerary.length > 0) {
      const itineraryData = itinerary.map((day: any, idx: number) => ({
        event_id: eventId,
        display_order: idx + 1,
        title: day.title,
        content: day.content || null,
      }))

      const { error: itineraryError } = await supabase
        .from("tournament_event_itinerary_days")
        .insert(itineraryData)

      if (itineraryError) {
        console.error("Error updating itinerary:", itineraryError)
      }
    }

    // Delete existing gallery and re-insert
    await supabase
      .from("tournament_event_gallery_images")
      .delete()
      .eq("event_id", eventId)

    if (gallery && gallery.length > 0) {
      const galleryData = gallery.map((img: any, idx: number) => ({
        event_id: eventId,
        image_url: img.image_url,
        display_order: idx,
        gallery_type: img.gallery_type || "gallery1",
      }))

      const { error: galleryError } = await supabase
        .from("tournament_event_gallery_images")
        .insert(galleryData)

      if (galleryError) {
        console.error("Error updating gallery:", galleryError)
      }
    }

    // Delete existing pricing tiers and re-insert
    await supabase
      .from("tournament_event_pricing_tiers")
      .delete()
      .eq("event_id", eventId)

    if (pricing_tiers && pricing_tiers.length > 0) {
      const pricingData = pricing_tiers.map((tier: any, idx: number) => ({
        event_id: eventId,
        name: tier.name,
        price: tier.price || null,
        display_order: idx,
        booking_url: tier.booking_url || null,
      }))

      const { error: pricingError } = await supabase
        .from("tournament_event_pricing_tiers")
        .insert(pricingData)

      if (pricingError) {
        console.error("Error updating pricing tiers:", pricingError)
      }
    }

    return NextResponse.json(eventData)
  } catch (error) {
    console.error("Error updating event:", error)
    return NextResponse.json(
      { error: "Failed to update event" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; eventId: string }> }
) {
  const { id: tournamentId, eventId } = await params
  const supabase = await createClient()

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

  try {
    const { error } = await supabase
      .from("tournament_events")
      .delete()
      .eq("id", eventId)
      .eq("tournament_id", tournamentId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting event:", error)
    return NextResponse.json(
      { error: "Failed to delete event" },
      { status: 500 }
    )
  }
}
