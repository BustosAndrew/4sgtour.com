'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CONTINENTS } from '@/lib/continents'

type Destination = {
  id: string
  name: string
  continent: string
  country: string
  description: string | null
  image_url: string | null
  slug: string
}

type ContinentsViewProps = {
  destinations: Destination[]
}

export function ContinentsView({ destinations }: ContinentsViewProps) {
  const [selectedContinent, setSelectedContinent] = useState<string | null>(
    null,
  )
  const [hoveredContinent, setHoveredContinent] = useState<string | null>(null)

  const filteredDestinations = selectedContinent
    ? destinations.filter(
        (d) => d.continent === selectedContinent && d.continent !== null,
      )
    : []

  if (!selectedContinent) {
    return (
      <div className="relative min-h-screen bg-[#22333b]">
        {/* Header text overlay */}
        <div className="absolute left-0 right-0 top-0 z-20 px-4 pt-28 text-center lg:pt-36">
          <h1
            className="text-4xl text-white drop-shadow-lg md:text-5xl lg:text-6xl"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Explore Golf Destinations
          </h1>
          <p
            className="mx-auto mt-4 max-w-2xl text-base tracking-wide text-white/80 md:text-lg"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            Choose a continent to discover world-class golf destinations and
            unforgettable experiences
          </p>
        </div>

        {/* Vertical panels container */}
        <div className="flex min-h-screen w-full flex-col pt-[70px] lg:flex-row lg:pt-0">
          {CONTINENTS.map((continent) => (
            <Link
              key={continent.slug}
              href={`/destinations/${continent.slug}`}
              className="group relative flex-1 overflow-hidden transition-all duration-500 ease-out lg:hover:flex-[1.5]"
              onMouseEnter={() => setHoveredContinent(continent.slug)}
              onMouseLeave={() => setHoveredContinent(null)}
            >
              {/* Background image */}
              <div className="absolute inset-0 overflow-hidden">
                <img
                  src={continent.image || '/placeholder.svg'}
                  alt={
                    continent.displayName || continent.name.replace('\n', ' ')
                  }
                  className="h-full w-full scale-100 object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                />
                {/* Dark overlay that lightens on hover */}
                <div
                  className={`absolute inset-0 transition-all duration-500 ${
                    hoveredContinent === continent.slug
                      ? 'bg-black/20'
                      : 'bg-black/40'
                  }`}
                />
                {/* Vertical divider line */}
                <div className="absolute bottom-0 left-0 top-0 hidden w-px bg-white/20 lg:block" />
              </div>

              {/* Continent name - positioned at bottom */}
              <div className="absolute bottom-0 left-0 right-0 flex items-end justify-center p-6 lg:p-8">
                <h2
                  className="whitespace-pre-line text-center text-xl font-semibold uppercase tracking-[0.2em] text-white drop-shadow-lg transition-all duration-300 group-hover:tracking-[0.3em] md:text-2xl lg:text-2xl"
                  style={{ fontFamily: 'var(--font-body)' }}
                >
                  {continent.name}
                </h2>
              </div>
            </Link>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#fffff8] pt-[70px]">
      <div className="container py-12">
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => setSelectedContinent(null)}
            className="mb-4 text-[#735c38] hover:bg-[#735c38]/10 hover:text-[#735c38]"
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Continents
          </Button>

          <div className="text-center">
            <h1
              className="text-4xl italic text-[#22333b] md:text-5xl"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {selectedContinent}
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-[#666666]">
              Discover amazing golf destinations in {selectedContinent}
            </p>
          </div>
        </div>

        {filteredDestinations.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredDestinations.map((destination) => (
              <Link
                key={destination.id}
                href={`/destinations/${destination.slug}`}
                className="group block overflow-hidden border border-[#d9d9d9] bg-white transition-all duration-300 hover:shadow-lg"
              >
                <div className="relative h-64 overflow-hidden">
                  <img
                    src={
                      destination.image_url ||
                      `/placeholder.svg?height=400&width=600&query=golf+course+${
                        destination.name || '/placeholder.svg'
                      }`
                    }
                    alt={destination.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-6">
                  <h3
                    className="text-xl font-medium text-[#22333b]"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    {destination.name}
                  </h3>
                  <p className="mt-1 text-sm text-[#735c38]">
                    {destination.country}
                  </p>
                  {destination.description && (
                    <p className="mt-3 line-clamp-2 text-sm text-[#666666]">
                      {destination.description}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center">
            <p className="text-[#666666]">
              No destinations available in {selectedContinent} yet.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
