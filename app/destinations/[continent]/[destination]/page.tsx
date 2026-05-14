import type { Metadata } from 'next'
import { SiteHeaderWrapper } from '@/components/site-header-wrapper'
import { SiteFooter } from '@/components/site-footer'
import { TripCard } from '@/components/trip-card'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import type { Trip } from '@/lib/types/database'
import { getServerTranslations, getServerLocale } from '@/lib/i18n/server'
import { getLocalizedField } from '@/lib/i18n/get-localized-field'

interface DestinationTripsPageProps {
  params: Promise<{ continent: string; destination: string }>
}

export async function generateMetadata({
  params,
}: DestinationTripsPageProps): Promise<Metadata> {
  const { destination: destinationSlug } = await params
  const supabase = await createClient()

  const { data: destination } = await supabase
    .from('destinations')
    .select('name, description, image_url')
    .eq('slug', destinationSlug)
    .single()

  if (!destination) {
    return { title: 'Destination Not Found | 4 Seasons Golf Tour' }
  }

  const description =
    destination.description ||
    `Discover golf trips to ${destination.name}. Find the best golf packages and book your dream vacation with 4 Seasons Golf Tour.`

  return {
    title: `Golf Trips to ${destination.name} | 4 Seasons Golf Tour`,
    description: description.slice(0, 160),
    openGraph: {
      title: `Golf Trips to ${destination.name} | 4 Seasons Golf Tour`,
      description: description.slice(0, 160),
      images: destination.image_url ? [destination.image_url] : undefined,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `Golf Trips to ${destination.name} | 4 Seasons Golf Tour`,
      description: description.slice(0, 160),
      images: destination.image_url ? [destination.image_url] : undefined,
    },
  }
}

export default async function DestinationTripsPage({
  params,
}: DestinationTripsPageProps) {
  const { destination: destinationSlug } = await params
  const supabase = await createClient()
  const locale = await getServerLocale()
  const t = await getServerTranslations('destinations')

  const { data: destination } = await supabase
    .from('destinations')
    .select('*')
    .eq('slug', destinationSlug)
    .single()

  if (!destination) {
    notFound()
  }

  const { data: trips } = await supabase
    .from('trips')
    .select(
      `
      *,
      images:trip_images(image_url)
    `,
    )
    .eq('destination_id', destination.id)
    .neq('is_custom', true)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen">
      <SiteHeaderWrapper />
      <main className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">
            {getLocalizedField(destination, 'name', locale)}
          </h1>
          {(destination.description ||
            destination.description_ko ||
            destination.description_de) && (
            <p className="mt-2 text-muted-foreground">
              {getLocalizedField(destination, 'description', locale)}
            </p>
          )}
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {trips?.map((trip) => (
            <TripCard
              key={trip.id}
              trip={trip as Trip & { images?: Array<{ image_url: string }> }}
              isFavorite={false}
            />
          ))}
        </div>

        {(!trips || trips.length === 0) && (
          <div className="py-12 text-center">
            <p className="text-muted-foreground">{t('noTripsAvailable')}</p>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  )
}
