import { SiteHeaderWrapper } from '@/components/site-header-wrapper'
import { SiteFooter } from '@/components/site-footer'
import { TournamentDetailView } from '@/components/tournament-detail-view'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { getServerLocale } from '@/lib/i18n/server'

interface TournamentPageProps {
  params: Promise<{ slug: string }>
}

export default async function TournamentPage({ params }: TournamentPageProps) {
  const { slug } = await params
  const supabase = await createClient()
  const locale = await getServerLocale()

  const { data: tournament } = await supabase
    .from('tournaments')
    .select(`
      *,
      tournament_events(id, title, title_ko, title_de, slug, location, location_ko, location_de, date, image, description, description_ko, description_de, price, duration)
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
        <TournamentDetailView tournament={tournament} locale={locale} />
      </main>
      <SiteFooter />
    </div>
  )
}
