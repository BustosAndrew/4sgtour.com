import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { createClient } from "@/lib/supabase/server"
import { notFound } from 'next/navigation'
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
      destination:destinations(name, country),
      packages(*),
      add_ons(*)
    `)
    .eq("slug", slug)
    .single()

  if (!trip) {
    notFound()
  }


  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="container px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="mb-8 text-2xl font-bold sm:text-3xl">Make A Reservation</h1>
        <BookingForm trip={trip} />
      </main>
      <SiteFooter />
    </div>
  )
}
