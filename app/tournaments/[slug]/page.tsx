import { SiteHeaderWrapper } from '@/components/site-header-wrapper'
import { SiteFooter } from '@/components/site-footer'
import { TournamentDetailView } from '@/components/tournament-detail-view'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'

interface TournamentPageProps {
  params: Promise<{ slug: string }>
}

export default async function TournamentPage({ params }: TournamentPageProps) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: tournament } = await supabase
    .from('tournaments')
    .select(`
      *,
      tournament_events(id, name, slug, location, event_date, image_url, short_description)
    `)
    .eq('slug', slug)
    .single()

  if (!tournament) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-[#fffff8]">
      <SiteHeaderWrapper />
      <main>
        <TournamentDetailView tournament={tournament} />
      </main>
      <SiteFooter />
    </div>
  )
}
