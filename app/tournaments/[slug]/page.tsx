import { SiteHeaderWrapper } from '@/components/site-header-wrapper'
import { SiteFooter } from '@/components/site-footer'
import { TournamentDetailView } from '@/components/tournament-detail-view'
import { notFound } from 'next/navigation'

const TOURNAMENTS: Record<
  string,
  {
    name: string
    displayName: string
    heroImage: string
    logo: string
    objectPosition: string
  }
> = {
  'the-open': {
    name: 'THE OPEN',
    displayName: 'The Open',
    heroImage: '/images/open.png',
    logo: '/images/1.png',
    objectPosition: '50% 35%',
  },
  'ryder-cup': {
    name: 'RYDER CUP',
    displayName: 'Ryder Cup',
    heroImage: '/images/ryder.png',
    logo: '/images/2.png',
    objectPosition: '50% 35%',
  },
  masters: {
    name: 'MASTERS',
    displayName: 'Masters',
    heroImage: '/images/masters.png',
    logo: '/images/3.png',
    objectPosition: '50% 35%',
  },
  'us-open': {
    name: 'US OPEN',
    displayName: 'US Open',
    heroImage: '/images/us.png',
    logo: '/images/4.png',
    objectPosition: '50% 35%',
  },
}

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
