import { SiteHeaderWrapper } from "@/components/site-header-wrapper"
import { SiteFooter } from "@/components/site-footer"
import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { BookingForm } from "@/components/booking/booking-form"

interface BookingPageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ package?: string }>
}

export default async function BookingPage({
  params,
  searchParams,
}: BookingPageProps) {
  const { slug } = await params
  const { package: packageId } = await searchParams
  const supabase = await createClient()

  // Allow guests to access booking page - no redirect
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: trip } = await supabase
    .from("trips")
    .select(
      `
      *,
      images:trip_images(image_url, display_order),
      destination:destinations(name, country),
      packages(*),
      add_ons(*)
    `,
    )
    .eq("slug", slug)
    .single()

  if (!trip) {
    notFound()
  }

  const { data: golfCourses } = await supabase
    .from("trip_golf_courses")
    .select("*")
    .eq("trip_id", trip.id)
    .order("created_at", { ascending: true })

  const { data: mealOptions } = await supabase
    .from("trip_meal_options")
    .select("*")
    .eq("trip_id", trip.id)
    .order("created_at", { ascending: true })

  const { data: transportationOptions } = await supabase
    .from("trip_transportation_options")
    .select("*")
    .eq("trip_id", trip.id)
    .order("created_at", { ascending: true })

  const { data: serviceOptions } = await supabase
    .from("trip_service_options")
    .select("*")
    .eq("trip_id", trip.id)
    .order("created_at", { ascending: true })

  // Combine all data
  const tripWithOptions = {
    ...trip,
    golf_courses: golfCourses || [],
    meal_options: mealOptions || [],
    transportation_options: transportationOptions || [],
    service_options: serviceOptions || [],
  }

  // Only fetch profile if user is logged in
  let profile = null
  if (user) {
    const { data: profileData } = await supabase
      .from("profiles")
      .select("display_name, email, phone")
      .eq("id", user.id)
      .single()
    profile = profileData
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeaderWrapper />
      <main className="container px-4 pt-28 pb-8 sm:px-6 lg:px-8 lg:pt-32">
        <BookingForm
          trip={tripWithOptions}
          user={user}
          profile={profile}
          preSelectedPackageId={packageId}
        />
      </main>
      <SiteFooter />
    </div>
  )
}
