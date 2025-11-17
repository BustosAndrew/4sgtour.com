import { SiteHeaderWrapper } from "@/components/site-header-wrapper"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/server"
import { notFound } from 'next/navigation'
import Link from "next/link"
import { MapPin } from 'lucide-react'
import { SiteFooter } from "@/components/site-footer"

interface TripPageProps {
  params: Promise<{ slug: string }>
}

export default async function TripPage({ params }: TripPageProps) {
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

  const price = trip.price_regular

  const mainImage =
    trip.images?.[0]?.image_url || `/placeholder.svg?height=600&width=800&query=golf course ${trip.location}`

  const bookingUrl = trip.booking_url || `/booking/${trip.slug}`

  return (
    <div className="min-h-screen">
      <SiteHeaderWrapper />
      <main className="container px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-1 lg:grid-cols-2">
          <div>
            <div className="overflow-hidden rounded-lg">
              <img src={mainImage || "/placeholder.svg"} alt={trip.title} className="h-[300px] w-full object-cover sm:h-[400px]" />
            </div>
            {trip.images && trip.images.length > 1 && (
              <div className="mt-4 grid grid-cols-4 gap-2">
                {trip.images.slice(1, 5).map((img, idx) => (
                  <div key={idx} className="overflow-hidden rounded-lg">
                    <img
                      src={img.image_url || "/placeholder.svg"}
                      alt={`${trip.title} ${idx + 2}`}
                      className="h-16 w-full object-cover sm:h-20"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="flex items-start gap-2 text-muted-foreground">
              <MapPin className="mt-1 h-4 w-4" />
              <span>{trip.location}</span>
            </div>
            <h1 className="mt-2 text-2xl font-bold text-foreground sm:text-3xl">{trip.title}</h1>
            <p className="mt-4 text-3xl font-bold text-foreground sm:text-4xl">${price.toFixed(2)}</p>

            {trip.description && <p className="mt-6 text-muted-foreground">{trip.description}</p>}

            <div className="mt-8 space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <span className="text-sm text-muted-foreground">Duration</span>
                <span className="font-medium">{trip.duration_nights} nights</span>
              </div>
              <div className="flex items-center justify-between border-b border-border pb-2">
                <span className="text-sm text-muted-foreground">Max Guests</span>
                <span className="font-medium">{trip.max_guests}</span>
              </div>
              <div className="flex items-center justify-between border-b border-border pb-2">
                <span className="text-sm text-muted-foreground">Breakfast</span>
                <span className="font-medium">{trip.includes_breakfast ? "Included" : "Not included"}</span>
              </div>
              <div className="flex items-center justify-between border-b border-border pb-2">
                <span className="text-sm text-muted-foreground">Transport</span>
                <span className="font-medium">{trip.includes_transport ? "Included" : "Not included"}</span>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Button asChild className="flex-1">
                <Link href={`/trips/${trip.slug}/book`}>Inquire Now</Link>
              </Button>
              <Button variant="outline" asChild className="flex-1 sm:flex-initial">
                <Link href="/contact">Contact Us</Link>
              </Button>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
