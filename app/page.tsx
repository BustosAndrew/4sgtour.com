import { SiteFooter } from "@/components/site-footer"
import { createClient } from "@/lib/supabase/server"
import { SiteHeaderWrapper } from "@/components/site-header-wrapper"
import { HeroCarousel } from "@/components/hero-carousel"
import { DestinationsCarousel } from "@/components/destinations-carousel"
import { TournamentsCarousel } from "@/components/tournaments-carousel"
import Link from "next/link"
import Image from "next/image"

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

  const stats = [
    { number: "220+", label: "GOLF TOURS" },
    { number: "220+", label: "GOLF PARTNERS" },
    { number: "220+", label: "WORLD-WIDE DESTINATIONS" },
    { number: "220+", label: "SCHEDULED TOURS" },
  ]



  return (
    <div className="min-h-screen bg-[#fffff8]">
      <SiteHeaderWrapper />
      <main>
        <HeroCarousel />

        {/* Setting a New Standard Section */}
        <section className="bg-[#fffff8] py-16 md:py-24">
          <div className="container">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h2 
                className="text-3xl md:text-4xl lg:text-5xl text-[#735c38] mb-6"
                style={{ fontFamily: "var(--font-display), Georgia, serif" }}
              >
                Setting a New Standard<br />for Overseas Golf Travel
              </h2>
              <p 
                className="text-[#888888] leading-relaxed mb-8"
                style={{ fontFamily: "var(--font-body), Helvetica Neue, sans-serif" }}
              >
                We are a Korean travel agency specializing in overseas golf travel,
                offering exceptional service and a variety of destinations, offering the
                best golf tours. We emphasize overseas golf travel and tours, and you
                can enjoy the various special offers and benefits offered by our tours.
              </p>
              {/* Gold divider line */}
              <div className="w-12 h-0.5 bg-[#735c38] mx-auto mb-6"></div>
              <Link 
                href="/destinations"
                className="inline-flex items-center gap-1 text-[#735c38] font-medium uppercase tracking-wider text-sm hover:text-[#5d4a2d] transition-colors"
                style={{ fontFamily: "var(--font-body), Helvetica Neue, sans-serif" }}
              >
                View All &gt;
              </Link>
            </div>
            
            {/* Destinations Carousel - contained within container */}
            <DestinationsCarousel />
          </div>
        </section>

        {/* The 4 Seasons Difference Section */}
        <section className="bg-[#22333b] py-16 md:py-24">
          <div className="container">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 
                className="text-3xl md:text-4xl lg:text-5xl text-white mb-6"
                style={{ fontFamily: "var(--font-display), Georgia, serif" }}
              >
                The 4 Seasons <em className="italic">Difference.</em>
              </h2>
              <p 
                className="text-white/70 leading-relaxed mb-8"
                style={{ fontFamily: "var(--font-body), Helvetica Neue, sans-serif" }}
              >
                At 4SGTours, we believe your journey should be as extraordinary as the
                courses you play. With curated luxury, exclusive insider access,
                seamless planning, and the option of a personal host, we create
                unforgettable golf experiences tailored to you.
              </p>
              {/* White divider line */}
              <div className="w-12 h-0.5 bg-white/40 mx-auto"></div>
            </div>
            
            {/* Stats grid - filled cream circles with stats below */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  {/* Filled cream/light gray circle */}
                  <div className="w-28 h-28 md:w-36 md:h-36 mx-auto mb-6 rounded-full bg-[#d9d9d9]"></div>
                  {/* Number below circle */}
                  <p 
                    className="text-2xl md:text-3xl text-white mb-2"
                    style={{ fontFamily: "var(--font-display), Georgia, serif" }}
                  >
                    {stat.number}
                  </p>
                  <p 
                    className="text-white/50 text-[10px] md:text-xs uppercase tracking-wider leading-tight"
                    style={{ fontFamily: "var(--font-body), Helvetica Neue, sans-serif" }}
                  >
                    World Wide<br />Destinations
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* View Golf Tournaments Section */}
        <section className="bg-[#fffff8] py-16 md:py-24 overflow-hidden">
          <div className="container">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 
                className="text-3xl md:text-4xl lg:text-5xl text-[#22333b] mb-6 italic"
                style={{ fontFamily: "var(--font-display), Georgia, serif" }}
              >
                View Golf Tournaments
              </h2>
              <p 
                className="text-[#888888] leading-relaxed mb-8 text-sm md:text-base"
                style={{ fontFamily: "var(--font-body), Helvetica Neue, sans-serif" }}
              >
                We are a Korean travel agency specializing in overseas golf travel,
                offering exceptional service and a variety of destinations, offering the
                best golf tours. We emphasize overseas golf travel and tours, and you
                can enjoy the various special offers and benefits offered by our tours.
              </p>
              {/* Gold divider line */}
              <div className="w-12 h-0.5 bg-[#735c38] mx-auto mb-6"></div>
              <Link 
                href="/tournaments"
                className="inline-flex items-center gap-1 text-[#22333b] font-medium uppercase tracking-wider text-sm hover:text-[#735c38] transition-colors"
                style={{ fontFamily: "var(--font-body), Helvetica Neue, sans-serif" }}
              >
                View All &gt;
              </Link>
            </div>
          </div>
          
          {/* Tournament Carousel - bleeding to the right */}
          <TournamentsCarousel />
        </section>

        {/* Travel with us now Section */}
        <section className="bg-[#fffff8] py-16 md:py-24 border-t border-[#d9d9d9]">
          <div className="container">
            <div className="flex items-center gap-4 mb-8">
              <h2 
                className="text-3xl md:text-4xl text-[#22333b] italic whitespace-nowrap"
                style={{ fontFamily: "var(--font-display), Georgia, serif" }}
              >
                Travel with us now
              </h2>
              <div className="flex-1 h-px bg-[#d9d9d9]"></div>
            </div>
            
            {/* Video embed placeholder */}
            <div className="aspect-video bg-[#22333b] relative overflow-hidden">
              <img
                src="/images/royalty1.png"
                alt="The Ancient Links of Scotland and Ireland"
                className="h-full w-full object-cover opacity-80"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p 
                    className="text-white/60 text-sm uppercase tracking-wider mb-2"
                    style={{ fontFamily: "var(--font-body), Helvetica Neue, sans-serif" }}
                  >
                    Travel The World with Premier Golf
                  </p>
                  <h3 
                    className="text-3xl md:text-5xl text-white uppercase tracking-wide"
                    style={{ fontFamily: "var(--font-display), Georgia, serif" }}
                  >
                    The Ancient<br />Links of Scotland<br />& Ireland
                  </h3>
                </div>
              </div>
              <div className="absolute bottom-4 right-4">
                <p 
                  className="text-white/80 text-sm"
                  style={{ fontFamily: "var(--font-body), Helvetica Neue, sans-serif" }}
                >
                  Old Head, Ireland
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Partner Logos Section */}
        <section className="bg-[#fffff8] py-12 border-t border-[#d9d9d9]">
          <div className="container">
            <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16 opacity-60">
              <div className="h-8 flex items-center">
                <span className="text-[#22333b] font-medium text-sm uppercase tracking-wider">Experiences</span>
              </div>
              <div className="h-8 flex items-center">
                <span className="text-[#22333b] font-medium text-sm uppercase tracking-wider">PGA Magazine</span>
              </div>
              <div className="h-8 flex items-center">
                <span className="text-[#22333b] font-medium text-sm uppercase tracking-wider">Signature</span>
              </div>
              <div className="h-8 flex items-center">
                <span className="text-[#22333b] font-medium text-sm uppercase tracking-wider">IATAN</span>
              </div>
              <div className="h-8 flex items-center">
                <Image
                  src="/images/golf-member.png"
                  alt="IAGTO Member Logo"
                  width={60}
                  height={40}
                  className="object-contain"
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
