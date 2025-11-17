import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { RecommendationsCarousel } from "@/components/recommendations-carousel"
import { SiteHeaderWrapper } from "@/components/site-header-wrapper"

export default async function HomePage() {
  const supabase = await createClient()

  const { data: featuredTrips } = await supabase
    .from("trips")
    .select(`
      *,
      images:trip_images(image_url)
    `)
    .order("created_at", { ascending: false })
    .limit(4)

  return (
    <div className="min-h-screen">
      <SiteHeaderWrapper />
      <main>
        <section className="relative h-[400px] bg-muted">
          <img src="/placeholder.svg?height=400&width=1200" alt="Hero" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </section>

        <section className="container py-12 text-center">
          <h1 className="text-balance text-4xl font-bold text-foreground">Lorem ipsum dolor</h1>
          <p className="mx-auto mt-4 max-w-3xl text-pretty leading-relaxed text-muted-foreground">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et
            dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex
            ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat
            nulla pariatur.
          </p>
        </section>

        <section className="bg-background py-12">
          <div className="container">
            <h2 className="mb-8 text-center text-3xl font-bold text-foreground">Recommendations</h2>
            <RecommendationsCarousel trips={featuredTrips || []} />
            <p className="mx-auto mt-8 max-w-3xl text-center text-pretty leading-relaxed text-muted-foreground">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et
              dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex
              ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu
              fugiat nulla pariatur.
            </p>
          </div>
        </section>

        <section className="container py-12">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
            <div className="aspect-video overflow-hidden rounded-lg bg-muted">
              <img src="/placeholder.svg?height=400&width=600" alt="Feature 1" className="h-full w-full object-cover" />
            </div>
            <div className="flex flex-col justify-center">
              <h2 className="text-balance text-3xl font-bold text-foreground">Lorem ipsum dolor</h2>
              <p className="mt-4 text-pretty leading-relaxed text-muted-foreground">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et
                dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip
                ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu
                fugiat nulla pariatur.
              </p>
              <Button className="mt-6 w-fit bg-[#9CA986] hover:bg-[#8a9876]">Lorem ipsum dolor</Button>
            </div>
          </div>
        </section>

        <section className="bg-muted/30 py-12">
          <div className="container">
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
              <div className="flex flex-col justify-center lg:order-2">
                <h2 className="text-balance text-3xl font-bold text-foreground">Lorem ipsum dolor</h2>
                <p className="mt-4 text-pretty leading-relaxed text-muted-foreground">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et
                  dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut
                  aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum
                  dolore eu fugiat nulla pariatur.
                </p>
                <Button className="mt-6 w-fit bg-[#9CA986] hover:bg-[#8a9876]">Lorem ipsum dolor</Button>
              </div>
              <div className="aspect-video overflow-hidden rounded-lg bg-muted lg:order-1">
                <img
                  src="/placeholder.svg?height=400&width=600"
                  alt="Feature 2"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
