import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { getUserType } from "@/lib/supabase/get-user-type"
import { autoTranslateTournamentEvent } from "@/lib/auto-translate"
import { headers } from "next/headers"

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
      // Korean translations
      title_ko,
      location_ko,
      description_ko,
      trip_highlights_ko,
      travel_itinerary_ko,
      includes_ko,
      excludes_ko,
      // German translations
      title_de,
      location_de,
      description_de,
      trip_highlights_de,
      travel_itinerary_de,
      includes_de,
      excludes_de,
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
        // Korean translations
        title_ko: title_ko || null,
        location_ko: location_ko || null,
        description_ko: description_ko || null,
        trip_highlights_ko: trip_highlights_ko || null,
        travel_itinerary_ko: travel_itinerary_ko || null,
        includes_ko: includes_ko || null,
        excludes_ko: excludes_ko || null,
        // German translations
        title_de: title_de || null,
        location_de: location_de || null,
        description_de: description_de || null,
        trip_highlights_de: trip_highlights_de || null,
        travel_itinerary_de: travel_itinerary_de || null,
        includes_de: includes_de || null,
        excludes_de: excludes_de || null,
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

    // Trigger auto-translation in the background (non-blocking)
    // Always translate from English if available, otherwise from Korean
    const hasEnglishContent = title && title.trim()
    const hasKoreanContent = title_ko && title_ko.trim()
    
    if (hasEnglishContent || hasKoreanContent) {
      const headersList = await headers()
      const host = headersList.get("host") || "localhost:3000"
      const protocol = process.env.NODE_ENV === "production" ? "https" : "http"
      const baseUrl = `${protocol}://${host}`
      
      // Prioritize English as source - if English content exists, use it
      const useEnglishAsSource = hasEnglishContent
      
      autoTranslateTournamentEvent(
        baseUrl,
        eventData.id,
        useEnglishAsSource
          ? { title, description, location, trip_highlights, travel_itinerary, includes, excludes }
          : { title: title_ko, description: description_ko, location: location_ko, trip_highlights: trip_highlights_ko, travel_itinerary: travel_itinerary_ko, includes: includes_ko, excludes: excludes_ko },
        useEnglishAsSource ? "en" : "ko",
        supabase
      ).catch(err => console.error("[v0] Background translation error:", err))
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
