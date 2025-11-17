import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { getUserType } from "@/lib/supabase/get-user-type"

export async function POST(request: Request) {
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
      description,
      location,
      continent,
      price_regular,
      price_wholesale,
      duration_nights,
      max_guests,
      includes_breakfast,
      includes_transport,
      courses_photo_url,
      single_room_photo_url,
      double_room_photo_url,
      packages, // Added packages
      addOns, // Added add-ons
    } = body

    // Generate slug from title
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")

    const { data: tripData, error: tripError } = await supabase
      .from("trips")
      .insert({
        title,
        description,
        location,
        continent,
        slug,
        price_regular: price_regular || 0,
        price_wholesale: price_wholesale || 0,
        duration_nights: duration_nights || 7,
        max_guests: max_guests || 20,
        includes_breakfast: includes_breakfast || false,
        includes_transport: includes_transport || false,
        courses_photo_url,
        single_room_photo_url,
        double_room_photo_url,
        is_payment_link_trip: false,
      })
      .select()
      .single()

    if (tripError) throw tripError

    if (packages && packages.length > 0) {
      const packagesData = packages.map((pkg: any) => ({
        trip_id: tripData.id,
        name: pkg.name,
        description: pkg.description || null,
        price: pkg.price,
        availability: pkg.availability,
        quantity: pkg.quantity,
        participants_per_booking: pkg.participants_per_booking,
      }))

      const { error: packagesError } = await supabase.from("packages").insert(packagesData)

      if (packagesError) {
        console.error("[v0] Error creating packages:", packagesError)
        // Don't fail the whole operation, just log the error
      }
    }

    if (addOns && addOns.length > 0) {
      const addOnsData = addOns.map((addon: any) => ({
        trip_id: tripData.id,
        name: addon.name,
        description: addon.description || null,
        price: addon.price,
        price_type: addon.price_type,
        availability: addon.availability,
        quantity: addon.quantity,
      }))

      const { error: addOnsError } = await supabase.from("add_ons").insert(addOnsData)

      if (addOnsError) {
        console.error("[v0] Error creating add-ons:", addOnsError)
        // Don't fail the whole operation, just log the error
      }
    }

    return NextResponse.json(tripData, { status: 201 })
  } catch (error) {
    console.error("[v0] Error creating trip:", error)
    return NextResponse.json({ error: "Failed to create trip" }, { status: 500 })
  }
}
