import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { getUserType } from "@/lib/supabase/get-user-type"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: tournamentId } = await params
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

    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: "Event title is required" },
        { status: 400 }
      )
    }

    if (!location || !location.trim()) {
      return NextResponse.json(
        { error: "Location is required" },
        { status: 400 }
      )
    }

    if (!date) {
      return NextResponse.json(
        { error: "Event date is required" },
        { status: 400 }
      )
    }

    const baseSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")

    const slug = `${baseSlug}-${Date.now()}`

    // Create the event
    const { data: eventData, error: eventError } = await supabase
      .from("tournament_events")
      .insert({
        tournament_id: tournamentId,
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
      })
      .select()
      .single()

    if (eventError) throw eventError

    // Add itinerary days
    if (itinerary && itinerary.length > 0) {
      const itineraryData = itinerary.map((day: any, idx: number) => ({
        event_id: eventData.id,
        display_order: idx + 1,
        title: day.title,
        content: day.content || null,
      }))

      const { error: itineraryError } = await supabase
        .from("tournament_event_itinerary_days")
        .insert(itineraryData)

      if (itineraryError) {
        console.error("Error creating itinerary:", itineraryError)
      }
    }

    // Add gallery images
    if (gallery && gallery.length > 0) {
      const galleryData = gallery.map((img: any, idx: number) => ({
        event_id: eventData.id,
        image_url: img.image_url,
        display_order: idx,
        gallery_type: img.gallery_type || "gallery1",
      }))

      const { error: galleryError } = await supabase
        .from("tournament_event_gallery_images")
        .insert(galleryData)

      if (galleryError) {
        console.error("Error creating gallery:", galleryError)
      }
    }

    // Add pricing tiers
    if (pricing_tiers && pricing_tiers.length > 0) {
      const pricingData = pricing_tiers.map((tier: any, idx: number) => ({
        event_id: eventData.id,
        name: tier.name,
        price: tier.price || null,
        display_order: idx,
        booking_url: tier.booking_url || null,
      }))

      const { error: pricingError } = await supabase
        .from("tournament_event_pricing_tiers")
        .insert(pricingData)

      if (pricingError) {
        console.error("Error creating pricing tiers:", pricingError)
      }
    }

    return NextResponse.json(eventData, { status: 201 })
  } catch (error) {
    console.error("Error creating event:", error)
    return NextResponse.json(
      { error: "Failed to create event" },
      { status: 500 }
    )
  }
}
