import { SiteHeaderWrapper } from '@/components/site-header-wrapper'
import { SiteFooter } from '@/components/site-footer'
import { TournamentTicketForm } from '@/components/tournament-ticket-form'
import { TOURNAMENTS } from '@/lib/tournament-data'
import { notFound } from 'next/navigation'

interface TicketsPageProps {
  params: Promise<{ slug: string; eventSlug: string }>
  searchParams: Promise<{ tier?: string }>
}

export default async function TicketsPage({ params, searchParams }: TicketsPageProps) {
  const { slug, eventSlug } = await params
  const { tier } = await searchParams

  const tournament = TOURNAMENTS[slug]
  if (!tournament) {
    notFound()
  }

  const event = tournament.events.find((e) => e.slug === eventSlug)
  if (!event) {
    notFound()
  }

  // Find matching tier if provided
  const matchedTier = tier
    ? event.pricingTiers.find(
        (t) => t.name.toLowerCase() === tier.toLowerCase(),
      )
    : null

  return (
    <div className="min-h-screen bg-[#fffff8]">
      <SiteHeaderWrapper />
      <main>
        <TournamentTicketForm
          eventTitle={event.title}
          eventDate={event.date}
          eventLocation={event.location}
          tierName={matchedTier?.name ?? null}
          tierPrice={matchedTier?.price ?? null}
          backHref={`/tournaments/${slug}/${eventSlug}`}
        />
      </main>
      <SiteFooter />
    </div>
  )
}
