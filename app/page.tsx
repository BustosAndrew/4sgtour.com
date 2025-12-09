import { SiteFooter } from "@/components/site-footer"
import { createClient } from "@/lib/supabase/server"
import { RecommendationsCarousel } from "@/components/recommendations-carousel"
import { SiteHeaderWrapper } from "@/components/site-header-wrapper"
import { AnimatedButton } from "@/components/ui/animated-button"
import { AnimatedHr } from "@/components/ui/animated-hr"
import Link from "next/link"

export default async function HomePage() {
  const supabase = await createClient()

  const { data: featuredTrips } = await supabase
    .from("trips")
    .select(
      `
      *,
      packages(id, name, price),
      courses_photo_url
    `,
    )
    .order("created_at", { ascending: false })
    .limit(4)

  return (
    <div className="min-h-screen">
      <SiteHeaderWrapper />
      <main>
        <section className="relative h-[500px] sm:h-[600px] md:h-[700px] bg-muted shadow-xl">
          <img
            src="/images/royalty1.png"
            alt="Hero"
            className="h-full w-full object-cover"
          />
        </section>

        <section className="container py-12 text-center">
          <h1 className="text-balance text-4xl font-bold text-foreground font-serif">
            Lorem ipsum dolor
          </h1>
          <p className="mx-auto mt-4 text-pretty leading-relaxed font-serif text-black font-medium text-center">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
            eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim
            ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut
            aliquip ex ea commodo consequat. Duis aute irure dolor in
            reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla
            pariatur.
          </p>
        </section>

        <section className="bg-background py-12">
          <div className="container">
            <h2 className="mb-8 text-center text-3xl font-bold text-foreground font-serif">
              Recommendations
            </h2>
            <RecommendationsCarousel trips={featuredTrips || []} />
            <p className="mx-auto mt-8 text-pretty leading-relaxed font-serif text-black font-medium text-center">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
              eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
              enim ad minim veniam, quis nostrud exercitation ullamco laboris
              nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in
              reprehenderit in voluptate velit esse cillum dolore eu fugiat
              nulla pariatur.
            </p>
          </div>
        </section>

        <section className="container py-12">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
            <div
              className="aspect-video overflow-hidden rounded-lg bg-muted"
              style={{ boxShadow: "0 8px 10px rgba(0, 0, 0, 0.25)" }}
            >
              <img
                src="/placeholder.svg?height=400&width=600"
                alt="Feature 1"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="flex flex-col justify-center">
              <h2 className="text-balance text-3xl font-bold text-foreground font-serif">
                Lorem ipsum dolor
              </h2>
              <AnimatedHr maxWidth="75%" />
              <p className="mt-4 w-3/4 text-pretty leading-relaxed font-serif font-medium text-black">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
                eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
                enim ad minim veniam, quis nostrud exercitation ullamco laboris
                nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor
                in reprehenderit in voluptate velit esse cillum dolore eu fugiat
                nulla pariatur.
              </p>
              <Link href="/destinations" className="mt-6 w-fit">
                <AnimatedButton
                  startColor="#6096BA"
                  endColor="#7ab0d0"
                  hoverText="Explore!"
                >
                  Lorem ipsum dolor
                </AnimatedButton>
              </Link>
            </div>
          </div>
        </section>

        <section className="py-12">
          <div className="container">
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
              <div className="flex flex-col justify-center">
                <h2 className="text-balance text-3xl font-bold text-foreground font-serif">
                  Lorem ipsum dolor
                </h2>
                <AnimatedHr maxWidth="75%" />
                <p className="mt-4 w-3/4 text-pretty leading-relaxed font-medium text-black font-serif">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed
                  do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                  Ut enim ad minim veniam, quis nostrud exercitation ullamco
                  laboris nisi ut aliquip ex ea commodo consequat. Duis aute
                  irure dolor in reprehenderit in voluptate velit esse cillum
                  dolore eu fugiat nulla pariatur.
                </p>
                <Link href="/destinations" className="mt-6 w-fit">
                  <AnimatedButton
                    startColor="#6096BA"
                    endColor="#7ab0d0"
                    hoverText="Explore!"
                  >
                    Lorem ipsum dolor
                  </AnimatedButton>
                </Link>
              </div>
              <div
                className="aspect-video overflow-hidden rounded-lg bg-muted lg:order-1"
                style={{ boxShadow: "0 8px 10px rgba(0, 0, 0, 0.25)" }}
              >
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
