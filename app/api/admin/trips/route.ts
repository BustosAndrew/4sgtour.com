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
      max_guests,
      courses_photo_url,
      single_room_photo_url,
      double_room_photo_url,
      highlights,
      packages,
      golfCourses,
      mealOptions,
      transportationOptions,
    } = body

    const baseSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")

    // Add timestamp to ensure uniqueness
    const slug = `${baseSlug}-${Date.now()}`

    const { data: tripData, error: tripError } = await supabase
      .from("trips")
      .insert({
        title,
        description,
        location,
        continent,
        slug,
        price_regular: price_regular || 0,
        max_guests: max_guests || 20,
        courses_photo_url,
        single_room_photo_url,
        double_room_photo_url,
        highlights: highlights || [],
        is_payment_link_trip: false,
      })
      .select()
      .single()

    if (tripError) {
      console.error("[v0] Error creating trip:", tripError.message)
      throw tripError
    }

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

      const { error: packagesError } = await supabase.from("trip_packages").insert(packagesData)

      if (packagesError) {
        console.error("[v0] Error creating packages:", packagesError)
      }
    }

    if (golfCourses && golfCourses.length > 0) {
      const golfCoursesData = golfCourses.map((course: any) => ({
        trip_id: tripData.id,
        course_name: course.course_name,
        price_per_round: Number(course.price_per_round),
        max_rounds: Number(course.max_rounds),
      }))

      const { error: golfCoursesError } = await supabase.from("golf_courses").insert(golfCoursesData)

      if (golfCoursesError) {
        console.error("[v0] Error creating golf courses:", golfCoursesError)
      }
    }

    if (mealOptions && mealOptions.length > 0) {
      const mealOptionsData = mealOptions.map((meal: any) => ({
        trip_id: tripData.id,
        name: meal.name,
        description: meal.description || null,
        price: Number(meal.price),
      }))

      const { error: mealsError } = await supabase.from("meal_options").insert(mealOptionsData)

      if (mealsError) {
        console.error("[v0] Error creating meal options:", mealsError)
      }
    }

    if (transportationOptions && transportationOptions.length > 0) {
      const transportOptionsData = transportationOptions.map((transport: any) => ({
        trip_id: tripData.id,
        name: transport.name,
        description: transport.description || null,
        price: Number(transport.price),
      }))

      const { error: transportError } = await supabase.from("transportation_options").insert(transportOptionsData)

      if (transportError) {
        console.error("[v0] Error creating transportation options:", transportError)
      }
    }

    return NextResponse.json(tripData, { status: 201 })
  } catch (error) {
    console.error("[v0] Error creating trip:", error)
    return NextResponse.json({ error: "Failed to create trip" }, { status: 500 })
  }
}
