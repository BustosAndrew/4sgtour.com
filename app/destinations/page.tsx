import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { ContinentsView } from "@/components/continents-view"
import { createClient } from "@/lib/supabase/server"

type Destination = {
  id: string
  name: string
  continent: string
  country: string
  description: string | null
  image_url: string | null
  slug: string
}

export default async function DestinationsPage() {
  const supabase = await createClient()

  const { data: destinations } = await supabase.from("destinations").select("*").order("name", { ascending: true })

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main>
        <ContinentsView destinations={destinations || []} />
      </main>
      <SiteFooter />
    </div>
  )
}
