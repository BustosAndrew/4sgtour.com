import { SiteFooter } from '@/components/site-footer'
import { SiteHeaderWrapper } from '@/components/site-header-wrapper'
import { HeroCarousel } from '@/components/hero-carousel'
import { DestinationsCarousel } from '@/components/destinations-carousel'
import { TournamentsCarousel } from '@/components/tournaments-carousel'
import { PartnerLogosCarousel } from '@/components/partner-logos-carousel'
import { TigerBooking } from '@/components/tiger-booking'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronRight } from 'lucide-react'

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
      number: '3000+',
      lines: ['GLOBAL GOLF', 'COURSE DESTINATIONS'],
    },
    {
      iconSrc: '/svg/location.svg',
      iconAlt: 'Location',
      number: '2500+',
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
            <div className="mb-12 text-center">
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
                className="inline-flex items-center gap-1 text-[#22333b] font-semibold uppercase tracking-wider text-base hover:text-[#5d4a2d] transition-colors"
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
              src="/images/difference.jpg"
              alt=""
              fill
              className="object-cover"
              sizes="100vw"
              priority={false}
            />
            <div className="absolute inset-0 bg-[#22333b]/25" />
            <div className="absolute inset-0 bg-black/15" />
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
                      src={stat.iconSrc || '/placeholder.svg'}
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
                className="inline-flex items-center gap-1 text-[#22333b] font-semibold uppercase tracking-wider text-base hover:text-[#735c38] transition-colors"
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
        <section className="bg-white py-12 sm:py-16 md:py-24">
          <div className="container">
            {/* Section heading */}
            <div className="flex items-center justify-between">
              <h2
                className="text-3xl md:text-4xl lg:text-5xl text-[#735c38] mb-10 tracking-wide"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                The Charm of Overseas Golf Travel
              </h2>
              <div className="w-1/3 h-0.5 bg-[#735c38] mb-10 hidden lg:block"></div>
            </div>

            {/* Single large video */}
            <div className="aspect-video relative overflow-hidden mt-6">
              <video className="w-full h-full object-cover" controls>
                <source src="/videos/vid1.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        </section>

        {/* A Special Journey with 4 Seasons Golf Tour Section */}
        <section className="bg-white pb-12 sm:pb-16 md:pb-24">
          <div className="container">
            {/* Section heading */}
            <h2
              className="text-3xl md:text-4xl lg:text-5xl text-[#735c38] text-center"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Journey with{' '}
              <span style={{ fontVariantNumeric: 'lining-nums' }}>4</span>{' '}
              Seasons Golf Tour
            </h2>

            {/* Three videos in a row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mt-12">
              {/* Video 1 */}
              <div className="aspect-video relative overflow-hidden bg-black rounded-sm">
                <video className="w-full h-full object-cover" controls>
                  <source src="/videos/vid2.mp4" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>

              {/* Video 2 */}
              <div className="aspect-video relative overflow-hidden bg-black rounded-sm">
                <video className="w-full h-full object-cover" controls>
                  <source src="/videos/vid3.mp4" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>

              {/* Video 3 */}
              <div className="aspect-video relative overflow-hidden bg-black rounded-sm">
                <video className="w-full h-full object-cover" controls>
                  <source src="/videos/vid4.mp4" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
            </div>
          </div>
        </section>

        {/* Tiger Booking & Golf Club Delivery Section */}
        <section className="py-12 md:py-16">
          <div className="container">
            <div className="bg-[#f2f0ec] flex flex-col md:flex-row items-stretch w-full overflow-hidden">
              {/* Left: Tiger Booking Logo + Region Links */}
              <div className="md:w-[48%]">
                <TigerBooking />
              </div>

              {/* Vertical Divider */}
              <div className="hidden md:flex items-center py-8">
                <div className="w-px h-full bg-[#22333b]/10" />
              </div>

              {/* Horizontal Divider (mobile) */}
              <div className="md:hidden h-px bg-[#22333b]/10 mx-6" />

              {/* Right: Ship Sticks Delivery Card */}
              <div className="flex-1 px-6 sm:px-8 md:px-10 py-8 md:py-10 flex items-center justify-center">
                <div className="flex flex-col items-center gap-5 w-full max-w-sm">
                  {/* Logo */}
                  <div className="relative h-16 sm:h-20 md:h-24 shrink-0">
                    <Image
                      src="/images/sticks.png"
                      alt="Ship Sticks"
                      width={96}
                      height={96}
                      className="h-full w-auto object-contain"
                    />
                  </div>

                  {/* Text */}
                  <div className="text-center flex flex-col gap-4">
                    <div>
                      <h3
                        className="mb-2 text-[15px] lg:text-[17px] font-bold uppercase tracking-[0.12em] text-[#22333b]"
                        style={{ fontFamily: 'var(--font-body)' }}
                      >
                        Golf Club Delivery Service
                      </h3>
                      <p
                        className="text-[13px] lg:text-[14px] leading-relaxed text-[#735C38]/80"
                        style={{ fontFamily: 'var(--font-body)' }}
                      >
                        Ship Sticks makes it easier than ever to transport your
                        golf clubs to your destination, allowing you to enjoy a
                        hassle-free travel experience anywhere in the world.
                      </p>
                    </div>
                    <Link
                      href="https://www.shipsticks.com/4seasons-golf-tour"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center bg-[#22333b] hover:bg-[#22333b]/90 text-[#fffff8] font-semibold py-2.5 px-6 uppercase tracking-[0.15em] transition-colors text-[12px] lg:text-[13px] w-fit mx-auto"
                      style={{ fontFamily: 'var(--font-body)' }}
                    >
                      Delivery Request
                      <ChevronRight className="ml-1.5 h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Partner Logos Section */}
        <section className="py-12 pb-20">
          <PartnerLogosCarousel />
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
