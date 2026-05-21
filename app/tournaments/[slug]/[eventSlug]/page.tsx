import type { Metadata } from 'next'
import { SiteHeaderWrapper } from '@/components/site-header-wrapper'
import { SiteFooter } from '@/components/site-footer'
import { EventDetailView } from '@/components/event-detail-view'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { getServerLocale } from '@/lib/i18n/server'

interface EventPageProps {
  params: Promise<{ slug: string; eventSlug: string }>
}

export async function generateMetadata({
  params,
}: EventPageProps): Promise<Metadata> {
  const { slug, eventSlug } = await params
  const supabase = await createClient()

  const { data: tournament } = await supabase
    .from('tournaments')
    .select('id, display_name')
    .eq('slug', slug)
    .single()

  if (!tournament) {
    return {
      title: '4 Seasons Golf Tour',
      description:
        'Book your perfect golf vacation with 4 Seasons Golf Tour. Explore top golf destinations worldwide.',
    }
  }

  const { data: event } = await supabase
    .from('tournament_events')
    .select('title, description, image, location')
    .eq('tournament_id', tournament.id)
    .eq('slug', eventSlug)
    .single()

  if (!event) {
    return {
      title: `${tournament.display_name} | 4 Seasons Golf Tour`,
      description: `Experience the ${tournament.display_name} with 4 Seasons Golf Tour.`,
    }
  }

  const description =
    (Array.isArray(event.description) ? event.description[0] : event.description) ||
    `Join us for ${event.title} at ${event.location || tournament.display_name}. Book your tickets with 4 Seasons Golf Tour.`

  return {
    title: `${event.title} | ${tournament.display_name} | 4 Seasons Golf Tour`,
    description: (typeof description === 'string' ? description : '').slice(0, 160),
    openGraph: {
      title: `${event.title} | ${tournament.display_name} | 4 Seasons Golf Tour`,
      description: (typeof description === 'string' ? description : '').slice(0, 160),
      images: event.image ? [event.image] : undefined,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${event.title} | ${tournament.display_name}`,
      description: (typeof description === 'string' ? description : '').slice(0, 160),
      images: event.image ? [event.image] : undefined,
    },
  }
}

export default async function EventPage({ params }: EventPageProps) {
  const { slug, eventSlug } = await params
  const supabase = await createClient()
  const locale = await getServerLocale()

  // Get tournament
  const { data: tournament } = await supabase
    .from('tournaments')
    .select('id, slug, display_name, hero_image')
    .eq('slug', slug)
    .single()

  if (!tournament) {
    notFound()
  }

  // Get event with all related data including translations
  const { data: event } = await supabase
    .from('tournament_events')
    .select(`
      *,
      tournament_event_itinerary_days(id, display_order, title, title_ko, title_de, content, content_ko, content_de),
      tournament_event_gallery_images(id, image_url, display_order, gallery_type),
      tournament_event_pricing_tiers(id, name, name_ko, name_de, price, display_order, booking_url)
    `)
    .eq('tournament_id', tournament.id)
    .eq('slug', eventSlug)
    .single()

  if (!event) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-[#fffff8]">
      <SiteHeaderWrapper />
      <main>
        <EventDetailView 
          event={event} 
          tournamentSlug={tournament.slug} 
          tournamentHeroImage={tournament.hero_image || '/placeholder.svg'}
          locale={locale}
        />
      </main>
      <SiteFooter />
    </div>
  )
}
