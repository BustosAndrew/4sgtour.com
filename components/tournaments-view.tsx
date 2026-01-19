'use client'

import { useState } from 'react'

const TOURNAMENTS = [
  {
    name: 'MASTERS',
    slug: 'masters',
    image:
      'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800&q=80',
  },
  {
    name: 'US OPEN',
    slug: 'us-open',
    image:
      'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=800&q=80',
  },
  {
    name: 'THE OPEN',
    slug: 'the-open',
    image:
      'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=800&q=80',
  },
  {
    name: 'RYDER CUP',
    slug: 'ryder-cup',
    image:
      'https://images.unsplash.com/photo-1592919505780-303950717480?w=800&q=80',
  },
]

export function TournamentsView() {
  const [hoveredTournament, setHoveredTournament] = useState<string | null>(
    null,
  )

  return (
    <div className="relative min-h-screen bg-[#22333b]">
      {/* Header text overlay */}
      <div className="absolute left-0 right-0 top-0 z-20 px-4 pt-28 text-center lg:pt-36">
        <h1
          className="text-4xl text-white drop-shadow-lg md:text-5xl lg:text-6xl"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Follow the Greatest Tournaments
        </h1>
        <p
          className="mx-auto mt-4 max-w-2xl text-base tracking-wide text-white/80 md:text-lg"
          style={{ fontFamily: 'var(--font-body)' }}
        >
          Journey through golf&apos;s most prestigious events across legendary
          courses worldwide.
        </p>
      </div>

      {/* Vertical panels container */}
      <div className="flex min-h-screen w-full flex-col pt-[70px] lg:flex-row lg:pt-0">
        {TOURNAMENTS.map((tournament) => (
          <div
            key={tournament.slug}
            className="group relative flex-1 cursor-default overflow-hidden transition-all duration-500 ease-out lg:hover:flex-[1.5]"
            onMouseEnter={() => setHoveredTournament(tournament.slug)}
            onMouseLeave={() => setHoveredTournament(null)}
          >
            {/* Background image */}
            <div className="absolute inset-0 overflow-hidden">
              <img
                src={tournament.image || '/placeholder.svg'}
                alt={tournament.name}
                className="h-full w-full scale-100 object-cover transition-transform duration-700 ease-out group-hover:scale-110"
              />
              {/* Dark overlay that lightens on hover */}
              <div
                className={`absolute inset-0 transition-all duration-500 ${
                  hoveredTournament === tournament.slug
                    ? 'bg-black/20'
                    : 'bg-black/40'
                }`}
              />
              {/* Vertical divider line */}
              <div className="absolute bottom-0 left-0 top-0 hidden w-px bg-white/20 lg:block" />
            </div>

            {/* Tournament name - positioned at bottom */}
            <div className="absolute bottom-0 left-0 right-0 flex items-end justify-center p-6 lg:p-8">
              <h2
                className="whitespace-pre-line text-center text-xl font-semibold uppercase tracking-[0.2em] text-white drop-shadow-lg transition-all duration-300 group-hover:tracking-[0.3em] md:text-2xl lg:text-2xl"
                style={{ fontFamily: 'var(--font-body)' }}
              >
                {tournament.name}
              </h2>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
