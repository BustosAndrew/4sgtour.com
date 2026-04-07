import { createClient } from "@/lib/supabase/server"
import { getUserType } from "@/lib/supabase/get-user-type"
import { type NextRequest, NextResponse } from "next/server"
import { autoTranslateTrip, autoTranslatePackages } from "@/lib/auto-translate"
import { headers } from "next/headers"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { Resend } from "resend"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
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

  // Build update object - only include localized fields if they were explicitly sent
  // This allows auto-translate to fill in missing translations without being overwritten
  const updateData: Record<string, any> = {
    title: body.title,
    description: body.description,
    refund_policy: body.refund_policy || null,
    location: body.location,
    continent: body.continent,
    price_regular: body.price_regular,
    max_guests: body.max_guests,
    max_nights: body.max_nights || body.max_days,
    min_nights: body.min_nights || body.min_days || 1,
    min_days_advance: body.min_days_advance,
    highlights: body.highlights,
    overview_content: body.overview_content,
    courses_photo_url: body.courses_photo_url,
    room_photo_url: body.room_photo_url,
    show_from_price: body.show_from_price ?? false,
    updated_at: new Date().toISOString(),
  }

  // Only update Korean fields if they were explicitly provided in the request
  if ('title_ko' in body) updateData.title_ko = body.title_ko
  if ('description_ko' in body) updateData.description_ko = body.description_ko
  if ('refund_policy_ko' in body) updateData.refund_policy_ko = body.refund_policy_ko
  if ('location_ko' in body) updateData.location_ko = body.location_ko
  if ('highlights_ko' in body) updateData.highlights_ko = body.highlights_ko
  if ('overview_content_ko' in body) updateData.overview_content_ko = body.overview_content_ko

  // German is always auto-translated, never manually set from the form
  // So we don't include _de fields here - they'll be set by autoTranslateTrip

  const { error } = await supabase
    .from("trips")
    .update(updateData)
    .eq("id", id)

  if (error) {
    console.error("[v0] Error updating trip:", error)
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
        price_per_extra_night: pkg.price_per_extra_night || null,
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
        num_holes: course.num_holes || 18,
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
      const mealsToInsert = validMeals.map((meal: any) => ({
        trip_id: id,
        name: meal.name,
        description: meal.description || null,
        is_included: meal.is_included || false,
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
        (transport: any) => ({
          trip_id: id,
          name: transport.name,
          description: transport.description || null,
          is_included: transport.is_included || false,
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

  if (body.service_options) {
    await supabase.from("trip_service_options").delete().eq("trip_id", id)

    const validServices = body.service_options.filter((service: any) =>
      service.name?.trim(),
    )

    if (validServices.length > 0) {
      const servicesToInsert = validServices.map((service: any) => ({
        trip_id: id,
        name: service.name,
        description: service.description || null,
        is_included: service.is_included || false,
      }))

      const { error: serviceError } = await supabase
        .from("trip_service_options")
        .insert(servicesToInsert)

      if (serviceError) {
        console.error("Error updating service options:", serviceError)
      }
    }
  }

  if (Array.isArray(body.course_images)) {
    await supabase.from("trip_images").delete().eq("trip_id", id)

    const coursePhotosData = body.course_images
      .slice(0, 5)
      .filter((url: string) => url && url.trim())
      .map((url: string, idx: number) => ({
        trip_id: id,
        image_url: url,
        display_order: idx,
      }))

    if (coursePhotosData.length > 0) {
      const { error: photosError } = await supabase
        .from("trip_images")
        .insert(coursePhotosData)

      if (photosError) {
        console.error("Error updating course photos:", photosError)
      }
    }
  }

  // Trigger auto-translation in the background (non-blocking)
  // Always translate from English if available, otherwise from Korean
  const hasEnglishContent = !!(body.title && body.title.trim())
  const hasKoreanContent = !!('title_ko' in body && body.title_ko && body.title_ko.trim())

  if (hasEnglishContent || hasKoreanContent) {
    const headersList = await headers()
    const host = headersList.get("host") || "localhost:3000"
    const protocol = process.env.NODE_ENV === "production" ? "https" : "http"
    const baseUrl = `${protocol}://${host}`

    // Prioritize English as source; fall back to Korean if only Korean was provided
    const useEnglishAsSource = hasEnglishContent

    autoTranslateTrip(
      baseUrl,
      id,
      useEnglishAsSource
        ? { title: body.title, description: body.description, location: body.location, refund_policy: body.refund_policy, overview_content: body.overview_content, highlights: body.highlights }
        : { title: body.title_ko, description: body.description_ko, location: body.location_ko, refund_policy: body.refund_policy_ko, overview_content: body.overview_content_ko, highlights: body.highlights_ko },
      useEnglishAsSource ? "en" : "ko",
      supabase
    ).catch(err => console.error("[auto-translate] Background translation error:", err))
    
    // Also translate packages if they exist
    if (body.packages && body.packages.length > 0) {
      // Need to fetch the newly inserted package IDs
      const { data: insertedPackages } = await supabase
        .from("packages")
        .select("id, name, description")
        .eq("trip_id", id)
      
      if (insertedPackages && insertedPackages.length > 0) {
        autoTranslatePackages(
          baseUrl,
          insertedPackages,
          useEnglishAsSource ? "en" : "ko",
          supabase
        ).catch(err => console.error("[v0] Background package translation error:", err))
      }
    }
  }

  return NextResponse.json({ success: true })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  if (!id || id === "undefined") {
    return NextResponse.json({ error: "Invalid trip id" }, { status: 400 })
  }
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

  // Delete the trip by primary key id (related records cascade via foreign keys)
  const { error } = await supabase.from("trips").delete().eq("id", id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
