import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { BookingForm } from "@/components/booking/booking-form"

interface BookingPageProps {
  params: Promise<{ slug: string }>
}

export default async function BookingPage({ params }: BookingPageProps) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: trip } = await supabase
    .from("trips")
    .select(`
      *,
      images:trip_images(image_url, display_order),
      destination:destinations(name, country)
    `)
    .eq("slug", slug)
    .single()

  if (!trip) {
    notFound()
  }

  if (!trip.wetravel_uuid) {
    return (
      <div className="min-h-screen">
        <SiteHeader />
        <main className="container py-16 text-center">
          <h1 className="text-2xl font-bold">Booking Not Available</h1>
          <p className="mt-4 text-muted-foreground">This trip is not available for online booking.</p>
        </main>
        <SiteFooter />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="container py-8">
        <h1 className="mb-8 text-3xl font-bold">Make A Reservation</h1>
        <BookingForm trip={trip} />
      </main>
      <SiteFooter />
    </div>
  )
}
