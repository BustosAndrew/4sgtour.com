import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { BookingForm } from "@/components/booking-form"
import { createClient } from "@/lib/supabase/server"
import { getUserType } from "@/lib/supabase/get-user-type"
import { notFound, redirect } from "next/navigation"

interface BookingPageProps {
  params: Promise<{ slug: string }>
}

export default async function BookingPage({ params }: BookingPageProps) {
  const { slug } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const userType = await getUserType()

  const { data: trip } = await supabase
    .from("trips")
    .select(`
      *,
      images:trip_images(image_url, display_order)
    `)
    .eq("slug", slug)
    .single()

  if (!trip) {
    notFound()
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="container py-8">
        <h1 className="mb-8 text-2xl font-semibold">Make A Reservation</h1>
        <BookingForm trip={trip} userType={userType} />
      </main>
      <SiteFooter />
    </div>
  )
}
