import { SiteHeaderWrapper } from "@/components/site-header-wrapper"
import { SiteFooter } from "@/components/site-footer"
import { createClient } from "@/lib/supabase/server"
import { notFound, redirect } from "next/navigation"
import { BookingForm } from "@/components/booking/booking-form"

interface BookingPageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ package?: string }>
}

export default async function BookingPage({ params, searchParams }: BookingPageProps) {
  const { slug } = await params
  const { package: packageId } = await searchParams
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/auth/login?redirect=/trips/${slug}/book`)
  }

  const { data: trip } = await supabase
    .from("trips")
    .select(`
      *,
      images:trip_images(image_url, display_order),
      destination:destinations(name, country),
      packages(*),
      add_ons(*)
    `)
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

  // Combine all data
  const tripWithOptions = {
    ...trip,
    golf_courses: golfCourses || [],
    meal_options: mealOptions || [],
    transportation_options: transportationOptions || [],
  }

  const { data: profile } = await supabase.from("profiles").select("display_name, email").eq("id", user.id).single()

  return (
    <div className="min-h-screen bg-background">
      <SiteHeaderWrapper />
      <main className="container px-4 py-8 sm:px-6 lg:px-8">
        <BookingForm trip={tripWithOptions} user={user} profile={profile} preSelectedPackageId={packageId} />
      </main>
      <SiteFooter />
    </div>
  )
}
