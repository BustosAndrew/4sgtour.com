import { SiteHeaderWrapper } from '@/components/site-header-wrapper'
import { SiteFooter } from '@/components/site-footer'
import { TournamentsView } from '@/components/tournaments-view'

export default async function TournamentsPage() {
  return (
    <div className="min-h-screen bg-[#22333b]">
      <SiteHeaderWrapper />
      <main>
        <TournamentsView />
      </main>
      <SiteFooter />
    </div>
  )
}
