import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { getUserType } from "@/lib/supabase/get-user-type"
import { autoTranslateTournamentEvent, autoTranslateItineraryDays, autoTranslatePricingTiers } from "@/lib/auto-translate"
import { headers } from "next/headers"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; eventId: string }> }
) {
  const { id: tournamentId, eventId } = await params
  const supabase = await createClient()
  const userType = await getUserType()

  if (userType !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data, error } = await supabase
    .from("tournament_events")
    .select("*")
    .eq("id", eventId)
    .eq("tournament_id", tournamentId)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

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
      title_ko,
      title_de,
      location,
      location_ko,
      location_de,
      date,
      duration,
      description,
      description_ko,
      description_de,
      trip_highlights,
      trip_highlights_ko,
      trip_highlights_de,
      travel_itinerary,
      travel_itinerary_ko,
      travel_itinerary_de,
      includes,
      includes_ko,
      includes_de,
      excludes,
      excludes_ko,
      excludes_de,
      price,
      image,
      itinerary,
      gallery,
      pricing_tiers,
    } = body

    // Generate slug from title
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")

    // Build update object - only include localized fields if explicitly sent
    // This allows auto-translate to fill in missing translations without being overwritten
    const updateData: Record<string, any> = {
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
    }

    // Update all localized fields if explicitly provided
    if ('title_ko' in body) updateData.title_ko = title_ko ?? null
    if ('title_de' in body) updateData.title_de = title_de ?? null
    if ('location_ko' in body) updateData.location_ko = location_ko ?? null
    if ('location_de' in body) updateData.location_de = location_de ?? null
    if ('description_ko' in body) updateData.description_ko = description_ko ?? null
    if ('description_de' in body) updateData.description_de = description_de ?? null
    if ('trip_highlights_ko' in body) updateData.trip_highlights_ko = trip_highlights_ko ?? null
    if ('trip_highlights_de' in body) updateData.trip_highlights_de = trip_highlights_de ?? null
    if ('travel_itinerary_ko' in body) updateData.travel_itinerary_ko = travel_itinerary_ko ?? null
    if ('travel_itinerary_de' in body) updateData.travel_itinerary_de = travel_itinerary_de ?? null
    if ('includes_ko' in body) updateData.includes_ko = includes_ko ?? null
    if ('includes_de' in body) updateData.includes_de = includes_de ?? null
    if ('excludes_ko' in body) updateData.excludes_ko = excludes_ko ?? null
    if ('excludes_de' in body) updateData.excludes_de = excludes_de ?? null

    // Update the event
    const { data: eventData, error: eventError } = await supabase
      .from("tournament_events")
      .update(updateData)
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
        title_ko: day.title_ko || null,
        title_de: day.title_de || null,
        content: day.content || null,
        content_ko: day.content_ko || null,
        content_de: day.content_de || null,
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
        name_ko: tier.name_ko || null,
        name_de: tier.name_de || null,
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
        eventId,
        useEnglishAsSource
          ? { title, description, location, trip_highlights, travel_itinerary, includes, excludes }
          : { title: title_ko, description: description_ko, location: location_ko, trip_highlights: trip_highlights_ko, travel_itinerary: travel_itinerary_ko, includes: includes_ko, excludes: excludes_ko },
        useEnglishAsSource ? "en" : "ko",
        supabase
      ).catch(err => console.error("[v0] Background translation error:", err))

      // Also translate itinerary days and pricing tiers
      const { data: insertedItinerary } = await supabase
        .from("tournament_event_itinerary_days")
        .select("id, title, content")
        .eq("event_id", eventId)

      if (insertedItinerary && insertedItinerary.length > 0) {
        autoTranslateItineraryDays(
          baseUrl,
          insertedItinerary,
          useEnglishAsSource ? "en" : "ko",
          supabase
        ).catch(err => console.error("[v0] Background itinerary translation error:", err))
      }

      const { data: insertedPricingTiers } = await supabase
        .from("tournament_event_pricing_tiers")
        .select("id, name")
        .eq("event_id", eventId)

      if (insertedPricingTiers && insertedPricingTiers.length > 0) {
        autoTranslatePricingTiers(
          baseUrl,
          insertedPricingTiers,
          useEnglishAsSource ? "en" : "ko",
          supabase
        ).catch(err => console.error("[v0] Background pricing tier translation error:", err))
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
