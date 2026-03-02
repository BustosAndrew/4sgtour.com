import { SiteHeaderWrapper } from '@/components/site-header-wrapper'
import { SiteFooter } from '@/components/site-footer'
import { TournamentTicketForm } from '@/components/tournament-ticket-form'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'

interface TicketsPageProps {
  params: Promise<{ slug: string; eventSlug: string }>
  searchParams: Promise<{ tier?: string }>
}

export default async function TicketsPage({ params, searchParams }: TicketsPageProps) {
  const { slug, eventSlug } = await params
  const { tier } = await searchParams
  const supabase = await createClient()

  // Get tournament
  const { data: tournament } = await supabase
    .from('tournaments')
    .select('id, slug, name, hero_image_url')
    .eq('slug', slug)
    .single()

  if (!tournament) {
    notFound()
  }

  // Get event with pricing tiers
  const { data: event } = await supabase
    .from('tournament_events')
    .select(`
      *,
      tournament_event_pricing_tiers(id, name, price, description, features)
    `)
    .eq('tournament_id', tournament.id)
    .eq('slug', eventSlug)
    .single()

  if (!event) {
    notFound()
  }

  const pricingTiers = event.tournament_event_pricing_tiers || []

  // Find matching tier if provided
  const matchedTier = tier
    ? pricingTiers.find(
        (t: { name: string }) => t.name.toLowerCase() === tier.toLowerCase(),
      )
    : null

  // Format date
  const eventDate = new Date(event.event_date)
  const formattedDate = eventDate.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <div className="min-h-screen bg-[#fffff8]">
      <SiteHeaderWrapper />
      <main>
        <TournamentTicketForm
          eventTitle={event.name}
          eventDate={formattedDate}
          eventLocation={event.location}
          tierName={matchedTier?.name ?? null}
          tierPrice={matchedTier?.price ?? null}
          backHref={`/tournaments/${slug}/${eventSlug}`}
          heroImage={tournament.hero_image_url || '/placeholder.svg'}
        />
      </main>
      <SiteFooter />
    </div>
  )
}
