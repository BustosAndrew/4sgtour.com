import { SiteFooter } from '@/components/site-footer'
import { createClient } from '@/lib/supabase/server'
import { SiteHeaderWrapper } from '@/components/site-header-wrapper'
import { HeroCarousel } from '@/components/hero-carousel'
import { DestinationsCarousel } from '@/components/destinations-carousel'
import { TournamentsCarousel } from '@/components/tournaments-carousel'
import Link from 'next/link'
import Image from 'next/image'

export default async function HomePage() {
  const supabase = await createClient()

  const { data: featuredTrips } = await supabase
    .from('trips')
    .select(
      `
      *,
      packages(id, name, price),
      courses_photo_url
    `,
    )
    .order('created_at', { ascending: false })
    .limit(4)

  const stats = [
    { number: '220+', label: 'GOLF TOURS' },
    { number: '220+', label: 'GOLF PARTNERS' },
    { number: '220+', label: 'WORLD-WIDE DESTINATIONS' },
    { number: '220+', label: 'SCHEDULED TOURS' },
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
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Setting a New Standard
                <br />
                for Overseas Golf Travel
              </h2>
              <p
                className="text-[#735c38] leading-relaxed mb-8"
                style={{ fontFamily: 'var(--font-body)' }}
              >
                We are a Korean travel agency specializing in overseas golf
                travel, offering exceptional service and a variety of
                destinations, offering the best golf tours. We emphasize
                overseas golf travel and tours, and you can enjoy the various
                special offers and benefits offered by our tours.
              </p>
              {/* Gold divider line */}
              <div className="w-12 h-0.5 bg-[#735c38] mx-auto mb-6"></div>
              <Link
                href="/destinations"
                className="inline-flex items-center gap-1 text-[#22333b] font-semibold uppercase tracking-wider text-[20px] hover:text-[#5d4a2d] transition-colors"
                style={{ fontFamily: 'var(--font-body)' }}
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
                style={{ fontFamily: 'var(--font-display)' }}
              >
                The 4 Seasons <em className="italic">Difference.</em>
              </h2>
              <p
                className="text-white/70 leading-relaxed mb-8"
                style={{ fontFamily: 'var(--font-body)' }}
              >
                At 4SGTours, we believe your journey should be as extraordinary
                as the courses you play. With curated luxury, exclusive insider
                access, seamless planning, and the option of a personal host, we
                create unforgettable golf experiences tailored to you.
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
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    {stat.number}
                  </p>
                  <p
                    className="text-white/50 text-[10px] md:text-xs uppercase tracking-wider leading-tight"
                    style={{ fontFamily: 'var(--font-body)' }}
                  >
                    World Wide
                    <br />
                    Destinations
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
                className="text-3xl md:text-4xl lg:text-5xl text-[#735c38] mb-6"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                View Golf Tournaments
              </h2>
              <p
                className="text-[#735c38] leading-relaxed mb-8 text-sm md:text-base"
                style={{ fontFamily: 'var(--font-body)' }}
              >
                We are a Korean travel agency specializing in overseas golf
                travel, offering exceptional service and a variety of
                destinations, offering the best golf tours. We emphasize
                overseas golf travel and tours, and you can enjoy the various
                special offers and benefits offered by our tours.
              </p>
              {/* Gold divider line */}
              <div className="w-12 h-0.5 bg-[#735c38] mx-auto mb-6"></div>
              <Link
                href="/tournaments"
                className="inline-flex items-center gap-1 text-[#22333b] font-semibold uppercase tracking-wider text-[20px] hover:text-[#735c38] transition-colors"
                style={{ fontFamily: 'var(--font-body)' }}
              >
                View All &gt;
              </Link>
            </div>
          </div>

          {/* Tournament Carousel - bleeding to the right */}
          <TournamentsCarousel />
        </section>

        {/* Travel with us now Section */}
        <section className="bg-[#fffff8] py-12 sm:py-16 md:py-24">
          <div className="container">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8 md:gap-12 mb-6 sm:mb-8">
              <h2
                className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-[60px] text-[#735C38]"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Travel with us now
              </h2>
              <div className="flex-1 h-[2px] bg-[#735C38] hidden sm:block"></div>
            </div>

            {/* Video embed */}
            <div className="aspect-video relative overflow-hidden">
              <iframe
                className="absolute inset-0 h-full w-full"
                src="https://www.youtube.com/embed/kS8ULAe8OW8?si=3eJnVZUvI1_ZX8AV"
                title="YouTube video player"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            </div>
          </div>
        </section>

        {/* Partner Logos Section */}
        <section className="bg-[#fffff8] py-12">
          <div className="container">
            <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16 opacity-60">
              <div className="h-8 flex items-center">
                <span className="text-[#22333b] font-medium text-sm uppercase tracking-wider">
                  Experiences
                </span>
              </div>
              <div className="h-8 flex items-center">
                <span className="text-[#22333b] font-medium text-sm uppercase tracking-wider">
                  PGA Magazine
                </span>
              </div>
              <div className="h-8 flex items-center">
                <span className="text-[#22333b] font-medium text-sm uppercase tracking-wider">
                  Signature
                </span>
              </div>
              <div className="h-8 flex items-center">
                <span className="text-[#22333b] font-medium text-sm uppercase tracking-wider">
                  IATAN
                </span>
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
