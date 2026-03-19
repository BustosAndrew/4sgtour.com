import { SiteHeaderWrapper } from "@/components/site-header-wrapper"
import { SiteFooter } from "@/components/site-footer"
import { ContinentsView } from "@/components/continents-view"
import { createClient } from "@/lib/supabase/server"
import { getServerLocale, getServerMessages } from "@/lib/i18n/server"

export default async function DestinationsPage() {
  const supabase = await createClient()
  const locale = await getServerLocale()
  const allMessages = await getServerMessages(locale)
  const destinationsNamespace = allMessages?.destinations as Record<string, unknown> ?? {}
  // Flatten the nested continents object into the messages
  const continents = (destinationsNamespace.continents ?? {}) as Record<string, string>
  const destinationMessages: Record<string, string> = {
    ...(Object.fromEntries(
      Object.entries(destinationsNamespace).filter(([_, v]) => typeof v === 'string')
    ) as Record<string, string>),
    ...Object.fromEntries(
      Object.entries(continents).map(([k, v]) => [`continents.${k}`, v])
    ),
  }

  const { data: destinations } = await supabase
    .from("destinations")
    .select("*")
    .order("name", { ascending: true })

  return (
    <div className="min-h-screen bg-[#22333b]">
      <SiteHeaderWrapper />
      <main>
        <ContinentsView destinations={destinations || []} locale={locale} messages={destinationMessages} />
      </main>
      <SiteFooter />
    </div>
  )
}
