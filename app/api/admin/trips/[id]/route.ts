import { createClient } from "@/lib/supabase/server"
import { getUserType } from "@/lib/supabase/get-user-type"
import { type NextRequest, NextResponse } from "next/server"

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const { id } = params
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

  const body = await request.json()

  const { error } = await supabase
    .from("trips")
    .update({
      title: body.title,
      description: body.description,
      continent: body.continent,
      location: body.location,
      price_regular: body.price_regular,
      max_guests: body.max_guests,
      max_days: body.max_days,
      min_days: body.min_days || 1,
      min_days_advance: body.min_days_advance,
      highlights: body.highlights,
      overview_content: body.overview_content,
      courses_photo_url: body.courses_photo_url,
      single_room_photo_url: body.single_room_photo_url,
      double_room_photo_url: body.double_room_photo_url,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (body.packages) {
    // Delete existing packages
    await supabase.from("packages").delete().eq("trip_id", id)

    // Insert new packages (filter out ones with empty names)
    const validPackages = body.packages.filter((pkg: any) => pkg.name?.trim())
    if (validPackages.length > 0) {
      const packagesToInsert = validPackages.map((pkg: any) => ({
        trip_id: id,
        name: pkg.name,
        description: pkg.description || null,
        price: pkg.price || 0,
        availability: pkg.availability || "unlimited",
        quantity: pkg.availability === "limited" ? pkg.quantity : null,
        participants_per_booking: pkg.participants_per_booking || 1,
      }))

      const { error: pkgError } = await supabase
        .from("packages")
        .insert(packagesToInsert)
      if (pkgError) {
        console.error("Error updating packages:", pkgError)
      }
    }
  }

  if (body.add_ons) {
    // Delete existing add-ons
    await supabase.from("add_ons").delete().eq("trip_id", id)

    // Insert new add-ons (filter out ones with empty names)
    const validAddOns = body.add_ons.filter((addOn: any) => addOn.name?.trim())
    if (validAddOns.length > 0) {
      const addOnsToInsert = validAddOns.map((addOn: any) => ({
        trip_id: id,
        name: addOn.name,
        description: addOn.description || null,
        price: addOn.price || 0,
        price_type: addOn.price_type || "per_participant",
        availability: addOn.availability || "unlimited",
        quantity: addOn.availability === "limited" ? addOn.quantity : null,
      }))

      const { error: addOnError } = await supabase
        .from("add_ons")
        .insert(addOnsToInsert)
      if (addOnError) {
        console.error("Error updating add-ons:", addOnError)
      }
    }
  }

  if (body.golf_courses) {
    await supabase.from("trip_golf_courses").delete().eq("trip_id", id)

    const validCourses = body.golf_courses.filter((course: any) =>
      course.course_name?.trim(),
    )
    if (validCourses.length > 0) {
      const coursesToInsert = validCourses.map((course: any) => ({
        trip_id: id,
        course_name: course.course_name,
        description: course.description || null,
        max_rounds: course.max_rounds || 5,
      }))

      const { error: courseError } = await supabase
        .from("trip_golf_courses")
        .insert(coursesToInsert)
      if (courseError) {
        console.error("Error updating golf courses:", courseError)
      }
    }
  }

  if (body.meal_options) {
    await supabase.from("trip_meal_options").delete().eq("trip_id", id)

    const validMeals = body.meal_options.filter((meal: any) =>
      meal.name?.trim(),
    )
    if (validMeals.length > 0) {
      const mealsToInsert = validMeals.map((meal: any, idx: number) => ({
        trip_id: id,
        name: meal.name,
        description: meal.description || null,
        is_included: meal.is_included || false,
        is_recommended: idx === 0,
      }))

      const { error: mealError } = await supabase
        .from("trip_meal_options")
        .insert(mealsToInsert)
      if (mealError) {
        console.error("Error updating meal options:", mealError)
      }
    }
  }

  if (body.transportation_options) {
    await supabase
      .from("trip_transportation_options")
      .delete()
      .eq("trip_id", id)

    const validTransport = body.transportation_options.filter(
      (transport: any) => transport.name?.trim(),
    )
    if (validTransport.length > 0) {
      const transportToInsert = validTransport.map(
        (transport: any, idx: number) => ({
          trip_id: id,
          name: transport.name,
          description: transport.description || null,
          is_included: transport.is_included || false,
          is_recommended: idx === 0,
        }),
      )

      const { error: transportError } = await supabase
        .from("trip_transportation_options")
        .insert(transportToInsert)
      if (transportError) {
        console.error("Error updating transportation options:", transportError)
      }
    }
  }

  return NextResponse.json({ success: true })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const { id } = params
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

  // Delete the trip (packages and add-ons will be cascade deleted)
  const { error } = await supabase.from("trips").delete().eq("id", id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
