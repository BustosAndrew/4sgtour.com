import { SiteHeaderWrapper } from '@/components/site-header-wrapper'
import { SiteFooter } from '@/components/site-footer'
import { TournamentDetailView } from '@/components/tournament-detail-view'
import { TOURNAMENTS } from '@/lib/tournament-data'
import { notFound } from 'next/navigation'

interface TournamentPageProps {
  params: Promise<{ slug: string }>
}

export default async function TournamentPage({ params }: TournamentPageProps) {
  const { slug } = await params
  const tournament = TOURNAMENTS[slug]

  if (!tournament) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-[#fffff8]">
      <SiteHeaderWrapper />
      <main>
        <TournamentDetailView
          slug={slug}
          name={tournament.name}
          displayName={tournament.displayName}
          heroImage={tournament.heroImage}
          logo={tournament.logo}
          objectPosition={tournament.objectPosition}
        />
      </main>
      <SiteFooter />
    </div>
  )
}
