'use client'

import { useState } from 'react'

const TOURNAMENTS = [
  {
    name: 'MASTERS',
    slug: 'masters',
    image: '/images/masters.png',
    objectPosition: '50% 35%',
  },
  {
    name: 'US OPEN',
    slug: 'us-open',
    image: '/images/us.png',
    objectPosition: '50% 35%',
  },
  {
    name: 'THE OPEN',
    slug: 'the-open',
    image: '/images/open.png',
    objectPosition: '50% 35%',
  },
  {
    name: 'RYDER CUP',
    slug: 'ryder-cup',
    image: '/images/ryder.png',
    objectPosition: '50% 35%',
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
      <div className="flex min-h-screen w-full flex-col pt-[82px] lg:flex-row lg:pt-20">
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
                className="h-full w-full scale-100 object-cover object-top transition-transform duration-700 ease-out group-hover:scale-110 md:object-center"
                style={{ objectPosition: tournament.objectPosition }}
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
