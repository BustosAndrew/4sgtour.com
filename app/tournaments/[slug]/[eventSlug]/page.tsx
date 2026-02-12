import { SiteHeaderWrapper } from '@/components/site-header-wrapper'
import { SiteFooter } from '@/components/site-footer'
import { EventDetailView } from '@/components/event-detail-view'
import { TOURNAMENTS } from '@/lib/tournament-data'
import { notFound } from 'next/navigation'

interface EventPageProps {
  params: Promise<{ slug: string; eventSlug: string }>
}

export default async function EventPage({ params }: EventPageProps) {
  const { slug, eventSlug } = await params
  const tournament = TOURNAMENTS[slug]

  if (!tournament) {
    notFound()
  }

  const event = tournament.events.find((e) => e.slug === eventSlug)

  if (!event) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-[#fffff8]">
      <SiteHeaderWrapper />
      <main>
        <EventDetailView event={event} tournamentSlug={slug} tournamentHeroImage={tournament.heroImage} />
      </main>
      <SiteFooter />
    </div>
  )
}
