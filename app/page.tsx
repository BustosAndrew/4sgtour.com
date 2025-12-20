import { SiteFooter } from "@/components/site-footer"
import { createClient } from "@/lib/supabase/server"
import { RecommendationsCarousel } from "@/components/recommendations-carousel"
import { SiteHeaderWrapper } from "@/components/site-header-wrapper"
import { AnimatedButton } from "@/components/ui/animated-button"
import { AnimatedHr } from "@/components/ui/animated-hr"
import { HeroCarousel } from "@/components/hero-carousel"
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
        <HeroCarousel />

        <section className="container py-12 text-center">
          <h1 className="text-balance text-4xl font-bold text-foreground font-serif">
            Setting a New Standard for Overseas Golf Travel
          </h1>
          <p className="mx-auto mt-4 text-pretty text-lg leading-relaxed font-serif text-black font-semibold text-center">
            4SGTour is a Korean travel agency specializing in overseas golf
            travel, offering exceptional service and a variety of destinations,
            offering the best golf tours. We emphasize overseas golf travel and
            tours, and you can enjoy the various special offers and benefits
            offered by 4SGTour.
          </p>
        </section>

        <section className="bg-background py-12">
          <div className="container">
            <h2 className="mb-8 text-center text-3xl font-bold text-foreground font-serif">
              Recommendations
            </h2>
            <RecommendationsCarousel trips={featuredTrips || []} />
            <p className="mx-auto mt-8 text-pretty text-lg leading-relaxed font-serif text-black font-semibold text-center">
              Explore our curated selection of top golf travel packages,
              handpicked to offer you unforgettable experiences on the best
              courses around the world.
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
                src="/images/ex.png"
                alt="golf course"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="flex flex-col justify-center">
              <h2 className="text-balance text-3xl font-bold text-foreground font-serif">
                The Joy of Golf Travel
              </h2>
              <AnimatedHr maxWidth="75%" />
              <p className="mt-4 w-3/4 text-pretty text-lg leading-relaxed font-serif font-semibold text-black">
                An overseas golf trip is a special experience that allows you to
                experience the joy of golf while exploring various destinations.
                With 4SGTour, you can enjoy a truly special golf trip abroad.
              </p>
              <Link href="/destinations" className="mt-6 w-fit">
                <AnimatedButton
                  startColor="#6096BA"
                  endColor="#7ab0d0"
                  hoverText="Explore!"
                >
                  Learn More
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
                  Start Your Adventure Today
                </h2>
                <AnimatedHr maxWidth="75%" />
                <p className="mt-4 w-3/4 text-pretty text-lg leading-relaxed font-semibold text-black font-serif">
                  With customer-focused service, a team of professional guides,
                  and special benefits from Korean travel agents, 4SGTour offers
                  you the ultimate overseas golf trip. If you're looking for a
                  unique experience and new adventure, join 4SGTour today! The
                  joy and enrichment of travel await you. Join 4SGTour, the new
                  standard in overseas golf travel!
                </p>
                <Link href="/destinations" className="mt-6 w-fit">
                  <AnimatedButton
                    startColor="#6096BA"
                    endColor="#7ab0d0"
                    hoverText="Explore!"
                  >
                    Start Your Adventure Today
                  </AnimatedButton>
                </Link>
              </div>
              <div
                className="aspect-video overflow-hidden rounded-lg bg-muted lg:order-1"
                style={{ boxShadow: "0 8px 10px rgba(0, 0, 0, 0.25)" }}
              >
                <img
                  src="/images/ex2.png"
                  alt="golf courses"
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
