import { SiteHeaderWrapper } from "@/components/site-header-wrapper"
import { SiteFooter } from "@/components/site-footer"
import { TripCard } from "@/components/trip-card"
import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import type { Trip } from "@/lib/types/database"

interface ContinentTripsPageProps {
  params: Promise<{ continent: string }>
}

const CONTINENT_NAMES: Record<string, string> = {
  africa: "Africa",
  asia: "Asia",
  europe: "Europe",
  "north-america": "North America",
  "south-america": "South America",
}

export default async function ContinentTripsPage({ params }: ContinentTripsPageProps) {
  const { continent: continentSlug } = await params
  const continentName = CONTINENT_NAMES[continentSlug]

  if (!continentName) {
    notFound()
  }

  const supabase = await createClient()

  const { data: trips } = await supabase
    .from("trips")
    .select(`
      *,
      packages(id, name, price)
    `)
    .eq("continent", continentName)
    .order("created_at", { ascending: false })

  const heroImage =
    trips?.[0]?.courses_photo_url || `/placeholder.svg?height=600&width=1200&query=golf+course+${continentName}`

  return (
    <div className="min-h-screen">
      <SiteHeaderWrapper />

      <section className="relative h-[300px] sm:h-[400px] md:h-[500px] lg:h-[600px]">
        <img
          src={heroImage || "/placeholder.svg"}
          alt={`Golf courses in ${continentName}`}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        <div className="absolute inset-0 flex items-center justify-center px-4">
          <div className="container text-center text-white">
            <h1 className="text-balance text-3xl font-bold sm:text-4xl md:text-5xl lg:text-6xl">4 Seasons Golf Tour</h1>
            <p className="mt-2 text-lg sm:mt-4 sm:text-xl md:text-2xl">Courses in {continentName}</p>
          </div>
        </div>
      </section>

      <main className="container px-4 py-8 sm:px-6 sm:py-12 md:py-16 lg:py-20">
        <div className="mb-6 text-center sm:mb-8 md:mb-12">
          <h2 className="text-2xl font-bold text-foreground sm:text-3xl md:text-4xl">Courses in {continentName}</h2>
          <p className="mx-auto mt-3 max-w-3xl px-4 text-pretty text-sm text-muted-foreground sm:mt-4 sm:text-base">
            Discover world-class golf courses and unforgettable experiences across {continentName}.
          </p>
        </div>

        {trips && trips.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {trips.map((trip) => (
              <TripCard key={trip.id} trip={trip as Trip} isFavorite={false} />
            ))}
          </div>
        ) : (
          <div className="py-8 text-center sm:py-12">
            <p className="text-sm text-muted-foreground sm:text-base">
              No courses available in {continentName} at the moment.
            </p>
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  )
}
