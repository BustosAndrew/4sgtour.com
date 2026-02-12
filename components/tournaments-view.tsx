'use client'

import Link from 'next/link'
import { useState } from 'react'

const TOURNAMENTS = [
  {
    name: 'THE OPEN',
    slug: 'the-open',
    image: '/images/1.png',
    objectPosition: '50% 35%',
  },
  {
    name: 'RYDER CUP',
    slug: 'ryder-cup',
    image: '/images/2.png',
    objectPosition: '50% 35%',
  },
  {
    name: 'MASTERS',
    slug: 'masters',
    image: '/images/3.png',
    objectPosition: '50% 35%',
  },
  {
    name: 'US OPEN',
    slug: 'us-open',
    image: '/images/4.png',
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
      <div className="relative z-20 px-4 pt-38 pb-10 text-center sm:pt-28 sm:pb-12 lg:absolute lg:left-0 lg:right-0 lg:top-0 lg:pb-0 lg:pt-36">
        <h1
          className="text-2xl text-white drop-shadow-lg sm:text-3xl md:text-4xl lg:text-6xl"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Follow the Greatest Tournaments
        </h1>
        <p
          className="mx-auto mt-3 max-w-2xl px-4 text-sm tracking-wide text-white/80 sm:mt-4 sm:text-base md:text-lg"
          style={{ fontFamily: 'var(--font-body)' }}
        >
          Journey through golf&apos;s most prestigious events across legendary
          courses worldwide.
        </p>
      </div>

      {/* Vertical panels container */}
      <div className="flex min-h-screen w-full flex-col pt-6 lg:flex-row lg:pt-20">
        {TOURNAMENTS.map((tournament) => (
          <Link
            key={tournament.slug}
            href={`/tournaments/${tournament.slug}`}
            className="group relative min-h-[120px] flex-1 cursor-pointer overflow-hidden transition-all duration-500 ease-out sm:min-h-[150px] lg:min-h-0 lg:hover:flex-[1.5]"
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
            <div className="absolute bottom-0 left-0 right-0 flex items-end justify-center p-4 sm:p-6 lg:p-8">
              <h2
                className="whitespace-pre-line text-center text-base font-semibold uppercase tracking-[0.15em] text-white drop-shadow-lg transition-all duration-300 group-hover:tracking-[0.25em] sm:text-lg sm:tracking-[0.2em] md:text-xl lg:text-2xl lg:group-hover:tracking-[0.3em]"
                style={{ fontFamily: 'var(--font-body)' }}
              >
                {tournament.name}
              </h2>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
