import { SiteHeaderWrapper } from '@/components/site-header-wrapper'
import { SiteFooter } from '@/components/site-footer'
import { TripCard } from '@/components/trip-card'
import { ScrollIndicator } from '@/components/scroll-indicator'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import type { Trip } from '@/lib/types/database'

interface ContinentTripsPageProps {
  params: Promise<{ continent: string }>
}

const CONTINENT_NAMES: Record<string, string> = {
  africa: 'World',
  asia: 'Asia',
  europe: 'Europe',
  'north-america': 'North America',
  'south-america': 'Latin America',
}

const CONTINENT_IMAGES: Record<string, string> = {
  africa: '/images/world.jpg',
  asia: '/images/asia_2.jpg',
  europe: '/images/europ.png',
  'north-america': '/images/na_3.jpg',
  'south-america': '/images/sa.jpg',
}

export default async function ContinentTripsPage({
  params,
}: ContinentTripsPageProps) {
  const { continent: continentSlug } = await params
  const continentName = CONTINENT_NAMES[continentSlug]

  if (!continentName) {
    notFound()
  }

  const supabase = await createClient()

  const { data: trips } = await supabase
    .from('trips')
    .select(
      `
      *,
      packages(id, name, price)
    `,
    )
    .eq('continent', continentName)
    .order('created_at', { ascending: false })

  const heroImage =
    CONTINENT_IMAGES[continentSlug] ||
    `/placeholder.svg?height=800&width=1920&query=golf+course+${continentName}`

  return (
    <div className="min-h-screen">
      <SiteHeaderWrapper />

      <section className="relative h-screen">
        <img
          src={heroImage || '/placeholder.svg'}
          alt={`Golf courses in ${continentName}`}
          className={`h-full w-full ${continentSlug === 'europe' ? 'object-top' : 'object-cover'}`}
          loading="eager"
          fetchPriority="high"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        <div className="absolute inset-0 flex items-center justify-center lg:justify-start px-4 lg:px-20">
          <div className="container text-center lg:text-left text-white">
            <p
              className="text-3xl sm:text-4xl md:text-5xl lg:text-[64px] text-white leading-tight"
              style={{
                fontFamily: "'loretta', serif",
                fontWeight: 600,
              }}
            >
              <span
                style={{
                  fontVariantNumeric: 'lining-nums',
                  fontWeight: 400,
                  WebkitTextStroke: '1.5px currentColor',
                }}
              >
                4
              </span>{' '}
              Seasons Golf Tour
            </p>
            <p className="mt-2 text-3xl sm:mt-4">Courses in {continentName}</p>
          </div>
        </div>
        <ScrollIndicator />
      </section>

      <main className="container px-4 py-8 sm:px-6 sm:py-12 md:py-16 lg:py-20">
        <div className="mb-6 text-center sm:mb-8 md:mb-12">
          <h2 className="text-2xl font-bold text-foreground sm:text-3xl md:text-4xl">
            Courses in {continentName}
          </h2>
          <p className="mx-auto mt-3 max-w-4xl px-4 text-pretty text-xl sm:mt-4">
            Discover world-class golf courses and unforgettable experiences
            across {continentName}.
          </p>
        </div>

        {trips && trips.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
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
