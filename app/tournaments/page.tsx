import { SiteHeaderWrapper } from '@/components/site-header-wrapper'
import { SiteFooter } from '@/components/site-footer'
import { TournamentsView } from '@/components/tournaments-view'
import { createClient } from '@/lib/supabase/server'
import { getServerLocale } from '@/lib/i18n/server'

export default async function TournamentsPage() {
  const supabase = await createClient()
  const locale = await getServerLocale()

  const { data: tournaments } = await supabase
    .from('tournaments')
    .select('id, name, name_ko, name_de, slug, logo, hero_image')
    .order('name', { ascending: true })

  return (
    <div className="min-h-screen bg-[#22333b]">
      <SiteHeaderWrapper />
      <main>
        <TournamentsView tournaments={tournaments || []} locale={locale} />
      </main>
      <SiteFooter />
    </div>
  )
}
