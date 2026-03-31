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
import { getServerTranslations, getServerLocale } from '@/lib/i18n/server'
import { createClient } from '@/lib/supabase/server'
import { getLocalizedField } from '@/lib/i18n/get-localized-field'

export default async function HomePage() {
  const t = await getServerTranslations('home')
  const tStats = await getServerTranslations('stats')
  const locale = await getServerLocale()
  const supabase = await createClient()

  // Fetch tournament events with their tournament info
  const { data: eventsData } = await supabase
    .from('tournament_events')
    .select(
      `
      id,
      slug,
      title,
      title_ko,
      title_de,
      location,
      location_ko,
      location_de,
      date,
      duration,
      price,
      image,
      tournament_id,
      tournaments!inner(slug)
    `,
    )
    .order('date', { ascending: true })
    .limit(8)

  // Transform events for the carousel
  const tournamentEvents = (eventsData || []).map((event: any) => ({
    id: event.id,
    title: getLocalizedField(event, 'title', locale) as string,
    location: getLocalizedField(event, 'location', locale) as string,
    date: event.date,
    duration: event.duration,
    price: event.price,
    image: event.image,
    href: `/tournaments/${event.tournaments.slug}/${event.slug}`,
  }))

  const stats = [
    {
      iconSrc: '/svg/plane.svg',
      iconAlt: 'Plane',
      number: '15+',
      line1: tStats('yearsExpertiseLine1'),
      line2: tStats('yearsExpertiseLine2'),
    },
    {
      iconSrc: '/svg/flag.svg',
      iconAlt: 'Flag',
      number: '3000+',
      line1: tStats('globalDestinationsLine1'),
      line2: tStats('globalDestinationsLine2'),
    },
    {
      iconSrc: '/svg/location.svg',
      iconAlt: 'Location',
      number: '2500+',
      line1: tStats('customJourneysLine1'),
      line2: tStats('customJourneysLine2'),
    },
    {
      iconSrc: '/svg/support.svg',
      iconAlt: 'Support',
      number: '100%',
      line1: tStats('tailoredExperiencesLine1'),
      line2: tStats('tailoredExperiencesLine2'),
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
                {t('settingStandard')}
                <br />
                {t('forOverseas')}
              </h2>
              <p
                className="text-[#735c38] leading-relaxed mb-8"
                style={{ fontFamily: 'var(--font-body)' }}
              >
                {t('description')}
              </p>
              {/* Gold divider line */}
              <div className="w-12 h-0.5 bg-[#735c38] mx-auto mb-6"></div>
              <Link
                href="/destinations"
                className="inline-flex items-center gap-1 text-[#22333b] font-semibold uppercase tracking-wider text-base hover:text-[#5d4a2d] transition-colors"
                style={{ fontFamily: 'var(--font-body)' }}
              >
                {t('viewAll')} &gt;
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
                The{' '}
                <span className="italic inline-block translate-y-[-0.2em]">
                  4
                </span>{' '}
                Seasons Difference.
              </h2>
              <p
                className="text-white leading-relaxed mb-8"
                style={{ fontFamily: 'var(--font-body)' }}
              >
                {t('differenceDescription')}
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
                    {stat.line1}
                    <br />
                    {stat.line2}
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
                {t('viewTournaments')}
              </h2>
              <p
                className="text-[#735c38] leading-relaxed mb-8 text-sm md:text-base"
                style={{ fontFamily: 'var(--font-body)' }}
              >
                {t('tournamentsDescription')}
              </p>
              {/* Gold divider line */}
              <div className="w-12 h-0.5 bg-[#735c38] mx-auto mb-6"></div>
              <Link
                href="/tournaments"
                className="inline-flex items-center gap-1 text-[#22333b] font-semibold uppercase tracking-wider text-base hover:text-[#735c38] transition-colors"
                style={{ fontFamily: 'var(--font-body)' }}
              >
                {t('viewAll')} &gt;
              </Link>
            </div>
          </div>

          {/* Tournament Carousel - bleeding to the right */}
          <TournamentsCarousel events={tournamentEvents} />
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
                {t('charmOfGolf')}
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
              <span className="italic inline-block translate-y-[-0.2em]">
                4
              </span>{' '}
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
        <section className="py-10 md:py-14 mb-20">
          <div className="container">
            <div className="flex flex-col md:flex-row items-stretch w-full gap-4 md:gap-6">
              <div className="md:w-[50%]">
                <div className="text-center mb-10">
                  <h2
                    className="text-3xl md:text-4xl lg:text-5xl text-[#735c38]"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    {t('worldGolfTeeTime')}
                  </h2>
                </div>
                {/* Left: Tiger Booking Logo + Region Links */}
                <div className="bg-white border border-[#22333b]/10 shadow-md h-full">
                  <TigerBooking />
                </div>
              </div>

              <div className="md:w-[50%]">
                <div className="text-center mb-10">
                  <h2
                    className="text-3xl md:text-4xl lg:text-5xl text-[#735c38]"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    {t('worldGolfDelivery')}
                  </h2>
                </div>
                {/* Right: Ship Sticks Delivery Card */}
                <div className="flex-1 border border-[#22333b]/10 bg-white shadow-md px-5 sm:px-6 md:px-7 py-5 md:py-6 flex flex-col items-center justify-center h-full">
                  {/* Logo - centered */}
                  <div className="relative h-16 sm:h-20 md:h-24 shrink-0 mb-4">
                    <Image
                      src="/images/sticks.png"
                      alt="Ship Sticks"
                      width={200}
                      height={100}
                      className="h-full object-contain"
                      style={{ width: 'auto' }}
                    />
                  </div>

                  {/* Divider */}
                  <div className="h-px w-full bg-[#22333b]/20 mb-4" />

                  {/* Text + CTA */}
                  <div className="flex flex-col items-center gap-3 text-center">
                    <div>
                      <h3
                        className="mb-1.5 text-[14px] lg:text-[16px] font-bold uppercase tracking-[0.12em] text-[#22333b]"
                        style={{ fontFamily: 'var(--font-body)' }}
                      >
                        {t('golfClubDeliveryService')}
                      </h3>
                      <p
                        className="text-[14px] lg:text-[15px] leading-relaxed text-[#22333b]/80"
                        style={{ fontFamily: 'var(--font-body)' }}
                      >
                        {t('golfClubDeliveryDescription')}
                      </p>
                    </div>
                    <Link
                      href="https://www.shipsticks.com/4seasons-golf-tour"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center bg-[#64CF69] hover:bg-[#45a049] text-white font-semibold py-2 px-6 uppercase tracking-[0.15em] transition-colors text-[13px] lg:text-[14px]"
                      style={{ fontFamily: 'var(--font-body)' }}
                    >
                      {t('deliveryRequest')}
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
          <div className="text-center mb-6">
            <h2
              className="text-3xl md:text-4xl lg:text-5xl text-[#735c38] mb-10"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {t('ourPartners')}
            </h2>
          </div>
          <PartnerLogosCarousel />
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
