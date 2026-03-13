'use client'

import { MapPin, Calendar } from 'lucide-react'
import Link from 'next/link'
import { useTranslations } from '@/lib/i18n/provider'

type TournamentEvent = {
  id: string
  title: string
  title_ko?: string | null
  title_de?: string | null
  slug: string
  location: string
  location_ko?: string | null
  location_de?: string | null
  date: string
  image: string | null
  description: string[] | null
  description_ko?: string[] | null
  description_de?: string[] | null
  price: string | null
  duration: string | null
}

type Tournament = {
  id: string
  slug: string
  name: string
  name_ko?: string | null
  name_de?: string | null
  display_name: string | null
  display_name_ko?: string | null
  display_name_de?: string | null
  logo: string | null
  hero_image: string | null
  tournament_events: TournamentEvent[]
}

interface TournamentDetailViewProps {
  tournament: Tournament
  locale?: string
}

export function TournamentDetailView({ tournament, locale = 'en' }: TournamentDetailViewProps) {
  const events = tournament.tournament_events || []
  const heroImage = tournament.hero_image || '/placeholder.svg'
  const t = useTranslations('tournaments')
  const tNames = useTranslations('tournaments.names')

  const getLocalizedField = <T extends Record<string, any>>(
    obj: T,
    field: string
  ): string | string[] | null => {
    if (locale === 'ko') {
      const koValue = obj[`${field}_ko`]
      if (koValue !== null && koValue !== undefined) return koValue
    }
    if (locale === 'de') {
      const deValue = obj[`${field}_de`]
      if (deValue !== null && deValue !== undefined) return deValue
    }
    return obj[field]
  }

  // Tournament names are fixed — use i18n translation map keyed by uppercase DB name
  const rawName = tournament.name // e.g. "MASTERS"
  const translatedName = tNames(rawName)
  const displayName = translatedName !== rawName ? translatedName : (tournament.display_name || tournament.name)

  return (
    <div>
      {/* Hero Banner — includes 100px top padding for fixed header */}
      <section className="relative h-[55vh] sm:h-[55vh] md:h-[60vh] w-full pt-[100px]">
        <img
          src={heroImage}
          alt={displayName}
          className="absolute inset-0 h-full w-full object-cover"
          style={{ objectPosition: '50% 35%' }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-black/20" />

        {/* Hero Content */}
        <div className="relative z-10 flex h-full flex-col items-center justify-center px-4">
          <p
            className="text-xs font-bold uppercase tracking-[0.25em] text-white/90 sm:text-sm"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            {t('upcomingEvents')}
          </p>
          <div className="mx-auto my-2 h-[2px] w-6 bg-[#735c38] sm:my-3 sm:w-8" />
          <h1
            className="text-center text-3xl font-semibold italic text-white sm:text-5xl md:text-6xl lg:text-7xl"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {displayName}
          </h1>
          {/* White divider under title */}
          <div className="mx-auto mt-4 h-[3px] w-[50px] bg-white" />
        </div>
      </section>

      {/* Events List */}
      <section className="bg-[#fffff8] py-10 sm:py-14 md:py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 sm:gap-8 md:gap-10">
            {events.map((event) => {
              const eventTitle = getLocalizedField(event, 'title') as string
              const eventLocation = getLocalizedField(event, 'location') as string

              return (
                <Link
                  key={event.id}
                  href={`/tournaments/${tournament.slug}/${event.slug}`}
                  className="group overflow-hidden border border-[#d9d9d9] bg-white shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="flex flex-col sm:flex-row">
                    {/* Event Image */}
                    <div className="relative w-full overflow-hidden sm:w-[42%] sm:flex-shrink-0">
                      <img
                        src={event.image || '/placeholder.svg'}
                        alt={eventTitle}
                        className="h-52 w-full object-cover sm:h-full"
                      />
                    </div>

                    {/* Event Details */}
                    <div className="flex flex-1 flex-col justify-center px-5 py-5 sm:px-7 sm:py-6 md:px-10 md:py-8">
                      <h3
                        className="text-sm font-bold uppercase tracking-wide text-[#735c38] sm:text-base md:text-lg"
                        style={{ fontFamily: 'var(--font-body)' }}
                      >
                        {eventTitle}
                      </h3>

                      <div className="mt-3 flex flex-col gap-2 sm:mt-4">
                        <div className="flex items-center gap-2 text-[#22333b]">
                          <MapPin className="h-4 w-4 flex-shrink-0 text-[#735c38]" />
                          <span
                            className="text-sm sm:text-base"
                            style={{ fontFamily: 'var(--font-body)' }}
                          >
                            {eventLocation}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[#22333b]">
                          <Calendar className="h-4 w-4 flex-shrink-0 text-[#735c38]" />
                          <span
                            className="text-sm sm:text-base"
                            style={{ fontFamily: 'var(--font-body)' }}
                          >
                            {event.date}
                          </span>
                        </div>
                      </div>

                      {event.price && (
                        <p
                          className="mt-3 text-sm font-semibold text-[#735c38] sm:mt-4"
                          style={{ fontFamily: 'var(--font-body)' }}
                        >
                          <span className="text-base font-bold sm:text-lg">{event.price}</span>
                        </p>
                      )}

                      <div className="mt-4 sm:mt-5">
                        <span
                          className="inline-block bg-[#495c48] px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-white transition-colors group-hover:bg-[#3a4a3b] sm:px-8 sm:py-3 sm:text-sm"
                          style={{ fontFamily: 'var(--font-body)' }}
                        >
                          {t('getTickets')}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>
    </div>
  )
}
