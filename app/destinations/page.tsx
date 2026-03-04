import { SiteHeaderWrapper } from "@/components/site-header-wrapper"
import { SiteFooter } from "@/components/site-footer"
import { ContinentsView } from "@/components/continents-view"
import { createClient } from "@/lib/supabase/server"
import { getLocale } from "next-intl/server"

export default async function DestinationsPage() {
  const supabase = await createClient()
  const locale = await getLocale()

  const { data: destinations } = await supabase
    .from("destinations")
    .select("*")
    .order("name", { ascending: true })

  return (
    <div className="min-h-screen bg-[#22333b]">
      <SiteHeaderWrapper />
      <main>
        <ContinentsView destinations={destinations || []} locale={locale} />
      </main>
      <SiteFooter />
    </div>
  )
}
