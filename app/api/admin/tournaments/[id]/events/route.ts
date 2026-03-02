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
      name,
      location,
      venue,
      event_date,
      end_date,
      description,
      short_description,
      image_url,
      itinerary,
      gallery,
      pricing_tiers,
    } = body

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Event name is required" },
        { status: 400 }
      )
    }

    if (!location || !location.trim()) {
      return NextResponse.json(
        { error: "Location is required" },
        { status: 400 }
      )
    }

    if (!event_date) {
      return NextResponse.json(
        { error: "Event date is required" },
        { status: 400 }
      )
    }

    const baseSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")

    const slug = `${baseSlug}-${Date.now()}`

    // Create the event
    const { data: eventData, error: eventError } = await supabase
      .from("tournament_events")
      .insert({
        tournament_id: tournamentId,
        name,
        slug,
        location,
        venue: venue || null,
        event_date,
        end_date: end_date || null,
        description: description || null,
        short_description: short_description || null,
        image_url: image_url || null,
      })
      .select()
      .single()

    if (eventError) throw eventError

    // Add itinerary days
    if (itinerary && itinerary.length > 0) {
      const itineraryData = itinerary.map((day: any) => ({
        event_id: eventData.id,
        day_number: day.day_number,
        title: day.title,
        description: day.description || null,
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
        caption: img.caption || null,
        display_order: idx,
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
      const pricingData = pricing_tiers.map((tier: any) => ({
        event_id: eventData.id,
        name: tier.name,
        price: tier.price,
        description: tier.description || null,
        features: tier.features?.filter((f: string) => f.trim()) || [],
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
