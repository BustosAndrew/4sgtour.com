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

  const { data: profile } = await supabase.from("profiles").select("full_name, email").eq("id", user.id).single()

  return (
    <div className="min-h-screen bg-background">
      <SiteHeaderWrapper />
      <main className="container px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="mb-8 text-2xl font-bold sm:text-3xl">Make A Reservation</h1>
        <BookingForm trip={trip} user={user} profile={profile} preSelectedPackageId={packageId} />
      </main>
      <SiteFooter />
    </div>
  )
}
