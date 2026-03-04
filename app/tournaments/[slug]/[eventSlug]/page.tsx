import { SiteHeaderWrapper } from '@/components/site-header-wrapper'
import { SiteFooter } from '@/components/site-footer'
import { EventDetailView } from '@/components/event-detail-view'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { getServerLocale } from '@/lib/i18n/server'

interface EventPageProps {
  params: Promise<{ slug: string; eventSlug: string }>
}

export default async function EventPage({ params }: EventPageProps) {
  const { slug, eventSlug } = await params
  const supabase = await createClient()
  const locale = await getServerLocale()

  // Get tournament
  const { data: tournament } = await supabase
    .from('tournaments')
    .select('id, slug, name, hero_image')
    .eq('slug', slug)
    .single()

  if (!tournament) {
    notFound()
  }

  // Get event with all related data
  const { data: event } = await supabase
    .from('tournament_events')
    .select(`
      *,
      tournament_event_itinerary_days(id, display_order, title, content),
      tournament_event_gallery_images(id, image_url, display_order, gallery_type),
      tournament_event_pricing_tiers(id, name, price, display_order)
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
