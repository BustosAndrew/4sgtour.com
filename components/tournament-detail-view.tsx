import { MapPin, Calendar } from 'lucide-react'
import Link from 'next/link'

type TournamentEvent = {
  id: string
  name: string
  slug: string
  location: string
  event_date: string
  image_url: string | null
  short_description: string | null
}

type Tournament = {
  id: string
  slug: string
  name: string
  description: string | null
  logo_url: string | null
  hero_image_url: string | null
  tournament_events: TournamentEvent[]
}

interface TournamentDetailViewProps {
  tournament: Tournament
}

export function TournamentDetailView({ tournament }: TournamentDetailViewProps) {
  const events = tournament.tournament_events || []
  const heroImage = tournament.hero_image_url || '/placeholder.svg'
  const displayName = tournament.name

  return (
    <div>
      {/* Hero Banner */}
      <section className="relative h-[45vh] sm:h-[50vh] md:h-[55vh] w-full">
        <img
          src={heroImage}
          alt={displayName}
          className="h-full w-full object-cover"
          style={{ objectPosition: '50% 35%' }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-black/20" />

        {/* Hero Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center px-4">
          <p
            className="text-sm uppercase tracking-[0.25em] text-white/90 sm:text-base"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            Upcoming Events
          </p>
          <div className="mx-auto my-3 h-[2px] w-8 bg-[#735c38]" />
          <h1
            className="text-center text-4xl italic text-white sm:text-5xl md:text-6xl lg:text-7xl"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {displayName}
          </h1>
        </div>
      </section>

      {/* Events List */}
      <section className="bg-[#fffff8] py-10 sm:py-14 md:py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-8 sm:gap-10">
            {events.map((event) => {
              const eventDate = new Date(event.event_date)
              const formattedDate = eventDate.toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })

              return (
                <Link
                  key={event.id}
                  href={`/tournaments/${tournament.slug}/${event.slug}`}
                  className="group overflow-hidden border border-[#d9d9d9] bg-white shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="flex flex-col md:flex-row">
                    {/* Event Image */}
                    <div className="relative aspect-[4/3] w-full md:aspect-auto md:w-[45%]">
                      <img
                        src={event.image_url || '/placeholder.svg'}
                        alt={event.name}
                        className="h-full w-full object-cover"
                      />
                    </div>

                    {/* Event Details */}
                    <div className="flex flex-1 flex-col justify-center px-6 py-6 sm:px-8 sm:py-8 md:px-10">
                      <h3
                        className="text-base font-bold uppercase tracking-wide text-[#735c38] sm:text-lg md:text-xl"
                        style={{ fontFamily: 'var(--font-body)' }}
                      >
                        {event.name}
                      </h3>

                      <div className="mt-4 flex flex-col gap-2.5 sm:mt-5">
                        <div className="flex items-center gap-2.5 text-[#22333b]">
                          <MapPin className="h-4 w-4 flex-shrink-0 text-[#735c38]" />
                          <span
                            className="text-sm sm:text-base"
                            style={{ fontFamily: 'var(--font-body)' }}
                          >
                            {event.location}
                          </span>
                        </div>
                        <div className="flex items-center gap-2.5 text-[#22333b]">
                          <Calendar className="h-4 w-4 flex-shrink-0 text-[#735c38]" />
                          <span
                            className="text-sm sm:text-base"
                            style={{ fontFamily: 'var(--font-body)' }}
                          >
                            {formattedDate}
                          </span>
                        </div>
                      </div>

                      <div className="mt-5 sm:mt-6">
                        <span
                          className="inline-block bg-[#495c48] px-8 py-3 text-sm font-semibold uppercase tracking-wider text-white transition-colors group-hover:bg-[#3a4a3b] sm:px-10 sm:text-base"
                          style={{ fontFamily: 'var(--font-body)' }}
                        >
                          Get Tickets
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
