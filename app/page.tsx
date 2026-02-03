import { SiteFooter } from '@/components/site-footer'
import { createClient } from '@/lib/supabase/server'
import { SiteHeaderWrapper } from '@/components/site-header-wrapper'
import { HeroCarousel } from '@/components/hero-carousel'
import { DestinationsCarousel } from '@/components/destinations-carousel'
import { TournamentsCarousel } from '@/components/tournaments-carousel'
import Link from 'next/link'
import Image from 'next/image'

export default async function HomePage() {
  const stats = [
    {
      iconSrc: '/svg/plane.svg',
      iconAlt: 'Plane',
      number: '15+',
      lines: ['YEARS OF GOLF', 'TRAVEL EXPERTISE'],
    },
    {
      iconSrc: '/svg/flag.svg',
      iconAlt: 'Flag',
      number: '120+',
      lines: ['ELITE GOLF', 'DESTINATIONS'],
    },
    {
      iconSrc: '/svg/location.svg',
      iconAlt: 'Location',
      number: '250+',
      lines: ['CUSTOM LUXURY', 'GOLF JOURNEYS'],
    },
    {
      iconSrc: '/svg/support.svg',
      iconAlt: 'Support',
      number: '100%',
      lines: ['TAILORED CLIENT', 'EXPERIENCES'],
    },
  ]

  return (
    <div className="min-h-screen bg-[#fffff8]">
      <SiteHeaderWrapper />
      <main>
        <HeroCarousel />

        {/* Setting a New Standard Section */}
        <section className="bg-[#fffff8] py-16 md:py-24 overflow-hidden">
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
          </div>

          {/* Destinations Carousel */}
          <div className="mt-12 container">
            <DestinationsCarousel />
          </div>
        </section>

        {/* The 4 Seasons Difference Section */}
        <section className="relative overflow-hidden bg-[#22333b] py-16 md:py-24">
          {/* Background image + overlays */}
          <div className="absolute inset-0">
            <Image
              src="/images/main4.png"
              alt=""
              fill
              className="object-cover"
              sizes="100vw"
              priority={false}
            />
            <div className="absolute inset-0 bg-[#22333b]/25" />
            <div className="absolute inset-0 bg-black/55" />
          </div>

          <div className="container relative z-10">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2
                className="text-3xl md:text-4xl lg:text-5xl text-white mb-6"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                The <span style={{ fontVariantNumeric: 'lining-nums' }}>4</span>{' '}
                Seasons <em className="italic">Difference.</em>
              </h2>
              <p
                className="text-white leading-relaxed mb-8"
                style={{ fontFamily: 'var(--font-body)' }}
              >
                At 4SGTours, we believe your journey should be as extraordinary
                as the courses you play. With curated luxury, exclusive insider
                access, seamless planning, and the option of a personal host, we
                create unforgettable golf experiences tailored to you.
              </p>
              {/* White divider line */}
              <div className="w-12 h-0.5 bg-white mx-auto"></div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-y-12 md:gap-y-0">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="mx-auto mb-6 flex items-center justify-center">
                    <img
                      src={stat.iconSrc || "/placeholder.svg"}
                      alt={stat.iconAlt}
                      className="h-16 w-16 md:h-20 md:w-20 lg:h-24 lg:w-24"
                      draggable={false}
                    />
                  </div>
                  <p
                    className="text-2xl md:text-5xl text-white mb-2 font-semibold"
                    style={{ fontFamily: 'var(--font-body)' }}
                  >
                    {stat.number}
                  </p>
                  <p
                    className="text-white text-[10px] md:text-xs uppercase tracking-wider leading-tight"
                    style={{ fontFamily: 'var(--font-body)' }}
                  >
                    {stat.lines[0]}
                    <br />
                    {stat.lines[1]}
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

        {/* The Charm of Overseas Golf Travel Section */}
        <section className="bg-[#e8e8e8] py-12 sm:py-16 md:py-24">
          <div className="container">
            {/* Section heading */}
            <h2
              className="text-2xl md:text-3xl lg:text-4xl text-[#22333b] text-center mb-8 md:mb-12 font-bold"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              The Charm of Overseas Golf Travel
            </h2>

            {/* Single large video */}
            <div className="max-w-4xl mx-auto">
              <div className="aspect-video relative overflow-hidden bg-black rounded-sm">
                <video
                  className="w-full h-full object-cover"
                  controls
                  poster="/placeholder.svg?height=720&width=1280"
                >
                  <source src="/videos/golf-travel-main.mp4" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
            </div>
          </div>
        </section>

        {/* A Special Journey with 4 Seasons Golf Tour Section */}
        <section className="bg-[#e8e8e8] pb-12 sm:pb-16 md:pb-24">
          <div className="container">
            {/* Section heading */}
            <h2
              className="text-2xl md:text-3xl lg:text-4xl text-[#22333b] text-center mb-8 md:mb-12 font-bold"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              A Special Journey with 4 Seasons Golf Tour
            </h2>

            {/* Three videos in a row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 max-w-6xl mx-auto">
              {/* Video 1 */}
              <div className="aspect-video relative overflow-hidden bg-black rounded-sm">
                <video
                  className="w-full h-full object-cover"
                  controls
                  poster="/placeholder.svg?height=360&width=640"
                >
                  <source src="/videos/golf-journey-1.mp4" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>

              {/* Video 2 */}
              <div className="aspect-video relative overflow-hidden bg-black rounded-sm">
                <video
                  className="w-full h-full object-cover"
                  controls
                  poster="/placeholder.svg?height=360&width=640"
                >
                  <source src="/videos/golf-journey-2.mp4" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>

              {/* Video 3 */}
              <div className="aspect-video relative overflow-hidden bg-black rounded-sm">
                <video
                  className="w-full h-full object-cover"
                  controls
                  poster="/placeholder.svg?height=360&width=640"
                >
                  <source src="/videos/golf-journey-3.mp4" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
            </div>
          </div>
        </section>

        {/* Golf Club Delivery Service Section */}
        <section className="bg-[#fffff8] py-12 md:py-16">
          <div className="container">
            <div className="mx-auto max-w-6xl">
              <div className="bg-[#e8e8e8] px-6 py-10 md:px-12 md:py-16 lg:px-16">
                <div className="grid items-center gap-8 md:grid-cols-[1.25fr_auto_1fr]">
                  {/* Left: Text */}
                  <div className="text-center md:text-left">
                    <h3
                      className="mb-3 text-[24px] font-bold uppercase tracking-wide text-[#22333b] md:mb-4"
                      style={{ fontFamily: 'var(--font-body)' }}
                    >
                      Golf Club Delivery Service
                    </h3>
                    <p
                      className="mx-auto max-w-xl text-[18px] leading-relaxed text-[#735C38] md:mx-0"
                      style={{ fontFamily: 'var(--font-body)' }}
                    >
                      Ship Sticks makes it easier than ever to transport your
                      golf clubs to your destination, allowing you to enjoy a
                      hassle-free travel experience anywhere in the world.
                    </p>
                  </div>

                  {/* Divider */}
                  <div className="hidden h-full w-[1.5px] bg-[#22333b]/20 md:block ml-26" />

                  {/* Right: Logo */}
                  <div className="mx-auto w-full max-w-[420px] md:mx-0">
                    <div className="relative h-20 w-full sm:h-24 md:h-28 lg:h-32">
                      <Image
                        src="/images/sticks.png"
                        alt="Ship Sticks"
                        fill
                        className="object-contain"
                        sizes="(min-width: 1024px) 26rem, (min-width: 768px) 22rem, 80vw"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Partner Logos Section */}
        <section className="py-12 pb-20">
          <div className="container">
            <div className="mx-auto w-full max-w-6xl opacity-80">
              <div className="grid grid-cols-2 items-center justify-items-center gap-x-10 gap-y-8 sm:grid-cols-3 lg:grid-cols-5">
                <div className="relative h-16 w-full max-w-[280px] sm:h-20 lg:h-24">
                  <Image
                    src="/images/iagto.png"
                    alt="IAGTO"
                    fill
                    className="object-contain"
                    sizes="(min-width: 1024px) 14rem, (min-width: 640px) 12rem, 45vw"
                  />
                </div>
                <div className="relative h-16 w-full max-w-[280px] sm:h-20 lg:h-24">
                  <Image
                    src="/images/times.png"
                    alt="Global Golf Times"
                    fill
                    className="object-contain"
                    sizes="(min-width: 1024px) 14rem, (min-width: 640px) 12rem, 45vw"
                  />
                </div>
                <div className="relative h-16 w-full max-w-[280px] sm:h-20 lg:h-24">
                  <Image
                    src="/images/ritz.png"
                    alt="Ritz Carlton"
                    fill
                    className="object-contain"
                    sizes="(min-width: 1024px) 14rem, (min-width: 640px) 12rem, 45vw"
                  />
                </div>
                <div className="relative h-16 w-full max-w-[280px] sm:h-20 lg:h-24">
                  <Image
                    src="/images/pebble.png"
                    alt="Pebble Beach Golf Links"
                    fill
                    className="object-contain"
                    sizes="(min-width: 1024px) 14rem, (min-width: 640px) 12rem, 45vw"
                  />
                </div>
                <div className="relative h-16 w-full max-w-[280px] sm:h-20 lg:h-24">
                  <Image
                    src="/images/tiger.png"
                    alt="Tiger Booking"
                    fill
                    className="object-contain"
                    sizes="(min-width: 1024px) 14rem, (min-width: 640px) 12rem, 45vw"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
