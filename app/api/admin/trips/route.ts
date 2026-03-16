import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { getUserType } from "@/lib/supabase/get-user-type"
import { autoTranslateTrip, autoTranslatePackages } from "@/lib/auto-translate"
import { headers } from "next/headers"

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
      refund_policy,
      overview_content,
      location,
      continent,
      price_regular,
      max_guests,
      max_days,
      min_days_advance,
      courses_photo_url,
      course_images,
      room_photo_url,
      highlights,
      // Korean translations
      title_ko,
      description_ko,
      refund_policy_ko,
      overview_content_ko,
      location_ko,
      highlights_ko,
      // German translations
      title_de,
      description_de,
      refund_policy_de,
      overview_content_de,
      location_de,
      highlights_de,
      packages,
      golfCourses,
      mealOptions,
      transportationOptions,
      serviceOptions,
    } = body

    const baseSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")

    // Add timestamp to ensure uniqueness
    const slug = `${baseSlug}-${Date.now()}`

    // Build insert data - only include Korean fields if explicitly provided
    // German fields are auto-translated and should not be set manually
    const insertData: Record<string, any> = {
      title,
      description,
      refund_policy: refund_policy || null,
      overview_content: overview_content || null,
      location,
      continent,
      slug,
      price_regular: price_regular || 0,
      max_guests: max_guests || 20,
      max_nights: body.max_nights || max_days || null,
      min_nights: body.min_nights || body.min_days || 1,
      min_days_advance: min_days_advance || 0,
      courses_photo_url,
      room_photo_url,
      highlights: highlights || [],
      show_from_price: body.show_from_price || false,
      is_payment_link_trip: false,
    }

    // Only include Korean fields if they were explicitly provided
    if (title_ko) insertData.title_ko = title_ko
    if (description_ko) insertData.description_ko = description_ko
    if (refund_policy_ko) insertData.refund_policy_ko = refund_policy_ko
    if (overview_content_ko) insertData.overview_content_ko = overview_content_ko
    if (location_ko) insertData.location_ko = location_ko
    if (highlights_ko && highlights_ko.length > 0) insertData.highlights_ko = highlights_ko

    // German is always auto-translated, don't set from form

    const { data: tripData, error: tripError } = await supabase
      .from("trips")
      .insert(insertData)
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
        price_per_extra_night: pkg.price_per_extra_night || null,
        availability: pkg.availability,
        quantity: pkg.quantity,
        participants_per_booking: pkg.participants_per_booking,
      }))

      const { error: packagesError } = await supabase
        .from("packages")
        .insert(packagesData)

      if (packagesError) {
        console.error("[v0] Error creating packages:", packagesError)
      }
    }

    if (golfCourses && golfCourses.length > 0) {
      const golfCoursesData = golfCourses.map((course: any) => ({
        trip_id: tripData.id,
        course_name: course.course_name,
        max_rounds: Number(course.max_rounds),
        num_holes: Number(course.num_holes) || 18,
        description: course.description || null,
      }))

      const { error: golfCoursesError } = await supabase
        .from("trip_golf_courses")
        .insert(golfCoursesData)

      if (golfCoursesError) {
        console.error("[v0] Error creating golf courses:", golfCoursesError)
      }
    }

    if (course_images && course_images.length > 0) {
      const coursePhotosData = course_images
        .slice(0, 5)
        .filter((url: string) => url && url.trim())
        .map((url: string, idx: number) => ({
          trip_id: tripData.id,
          image_url: url,
          display_order: idx,
        }))

      if (coursePhotosData.length > 0) {
        const { error: photosError } = await supabase
          .from("trip_images")
          .insert(coursePhotosData)

        if (photosError) {
          console.error("[v0] Error creating course photos:", photosError)
        }
      }
    }

    if (mealOptions && mealOptions.length > 0) {
      const mealOptionsData = mealOptions.map((meal: any) => ({
        trip_id: tripData.id,
        name: meal.name,
        description: meal.description || null,
        is_included: meal.is_included || false,
      }))

      const { error: mealsError } = await supabase
        .from("trip_meal_options")
        .insert(mealOptionsData)

      if (mealsError) {
        console.error("[v0] Error creating meal options:", mealsError)
      }
    }

    if (transportationOptions && transportationOptions.length > 0) {
      const transportOptionsData = transportationOptions.map(
        (transport: any) => ({
          trip_id: tripData.id,
          name: transport.name,
          description: transport.description || null,
          is_included: transport.is_included || false,
        }),
      )

      const { error: transportError } = await supabase
        .from("trip_transportation_options")
        .insert(transportOptionsData)

      if (transportError) {
        console.error(
          "[v0] Error creating transportation options:",
          transportError,
        )
      }
    }

    if (serviceOptions && serviceOptions.length > 0) {
      const serviceOptionsData = serviceOptions.map((service: any) => ({
        trip_id: tripData.id,
        name: service.name,
        description: service.description || null,
        is_included: service.is_included || false,
      }))

      const { error: serviceError } = await supabase
        .from("trip_service_options")
        .insert(serviceOptionsData)

      if (serviceError) {
        console.error("[v0] Error creating service options:", serviceError)
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
      
      // Don't await - let it run in background
      autoTranslateTrip(
        baseUrl,
        tripData.id,
        useEnglishAsSource
          ? { title, description, location, refund_policy, overview_content, highlights }
          : { title: title_ko, description: description_ko, location: location_ko, refund_policy: refund_policy_ko, overview_content: overview_content_ko, highlights: highlights_ko },
        useEnglishAsSource ? "en" : "ko",
        supabase
      ).catch(err => console.error("[v0] Background translation error:", err))
      
      // Also translate packages if they were created
      const { data: insertedPackages } = await supabase
        .from("packages")
        .select("id, name, description")
        .eq("trip_id", tripData.id)
      
      if (insertedPackages && insertedPackages.length > 0) {
        autoTranslatePackages(
          baseUrl,
          insertedPackages,
          useEnglishAsSource ? "en" : "ko",
          supabase
        ).catch(err => console.error("[v0] Background package translation error:", err))
      }
    }

    return NextResponse.json(tripData, { status: 201 })
  } catch (error) {
    console.error("[v0] Error creating trip:", error)
    return NextResponse.json(
      { error: "Failed to create trip" },
      { status: 500 },
    )
  }
}
