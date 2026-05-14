'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CONTINENTS } from '@/lib/continents'

type Destination = {
  id: string
  name: string
  name_ko?: string | null
  name_de?: string | null
  continent: string
  country: string
  country_ko?: string | null
  country_de?: string | null
  description: string | null
  description_ko?: string | null
  description_de?: string | null
  image_url: string | null
  slug: string
}

type ContinentsViewProps = {
  destinations: Destination[]
  locale?: string
  messages?: Record<string, string>
}

// Map from slug to translation key
const CONTINENT_KEYS: Record<string, string> = {
  'europe': 'europe',
  'north-america': 'northAmerica',
  'south-america': 'latinAmerica',
  'asia': 'asia',
  'africa': 'world',
}

function translate(messages: Record<string, string>, key: string): string {
  return messages[key] ?? key
}

export function ContinentsView({ destinations, locale = 'en', messages = {} }: ContinentsViewProps) {
  const [selectedContinent, setSelectedContinent] = useState<string | null>(null)
  const [hoveredContinent, setHoveredContinent] = useState<string | null>(null)

  const t = (key: string) => translate(messages, key)

  const getLocalizedField = (dest: Destination, field: 'name' | 'country' | 'description') => {
    if (locale === 'ko') {
      const koField = `${field}_ko` as keyof Destination
      return (dest[koField] as string | null) || dest[field]
    }
    if (locale === 'de') {
      const deField = `${field}_de` as keyof Destination
      return (dest[deField] as string | null) || dest[field]
    }
    return dest[field]
  }

  const filteredDestinations = selectedContinent
    ? destinations.filter(
        (d) => d.continent === selectedContinent && d.continent !== null,
      )
    : []

  if (!selectedContinent) {
    return (
      <div className="relative min-h-screen bg-[#22333b]">
        {/* Header text overlay */}
        <div className="relative z-20 px-4 pt-38 pb-10 text-center sm:pt-28 sm:pb-12 lg:absolute lg:left-0 lg:right-0 lg:top-0 lg:pb-0 lg:pt-36">
          <h1
            className="text-2xl text-white drop-shadow-lg sm:text-3xl md:text-4xl lg:text-6xl"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {t('exploreDestinations')}
          </h1>
          <p
            className="mx-auto mt-3 max-w-2xl px-4 text-sm tracking-wide text-white/80 sm:mt-4 sm:text-base md:text-lg"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            {t('exploreSubtitle')}
          </p>
        </div>

        {/* Vertical panels container */}
        <div className="flex min-h-screen w-full flex-col pt-6 lg:flex-row lg:pt-0">
          {CONTINENTS.map((continent) => (
            <Link
              key={continent.slug}
              href={`/destinations/${continent.slug}`}
              className="group relative min-h-[220px] flex-1 overflow-hidden transition-all duration-500 ease-out sm:min-h-[250px] lg:min-h-0 lg:hover:flex-[1.5]"
              onMouseEnter={() => setHoveredContinent(continent.slug)}
              onMouseLeave={() => setHoveredContinent(null)}
            >
              {/* Background image */}
              <div className="absolute inset-0 overflow-hidden">
                <Image
                  src={continent.image || '/placeholder.svg'}
                  alt={continent.displayName || continent.name.replace('\n', ' ')}
                  fill
                  className="scale-100 object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  quality={90}
                  priority
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
              <div className="absolute bottom-0 left-0 right-0 flex items-end justify-center p-4 sm:p-6 lg:p-8">
                <h2
                  className="whitespace-pre-line text-center text-base font-semibold uppercase tracking-[0.15em] text-white drop-shadow-lg transition-all duration-300 group-hover:tracking-[0.25em] sm:text-lg sm:tracking-[0.2em] md:text-xl lg:text-2xl lg:group-hover:tracking-[0.3em]"
                  style={{ fontFamily: 'var(--font-body)' }}
                >
                  {t(`continents.${CONTINENT_KEYS[continent.slug]}`)}
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
            {t('backToContinents')}
          </Button>

          <div className="text-center">
            <h1
              className="text-4xl font-bold text-[#22333b] md:text-5xl"
              style={{ fontFamily: "'loretta', serif" }}
            >
              <span style={{ fontVariantNumeric: 'lining-nums', fontWeight: 400, WebkitTextStroke: '1.5px currentColor' }}>4</span>{' '}
              Seasons Golf Tour - {selectedContinent}
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-[#666666]">
              {t('discoverIn')} {selectedContinent}
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
                  <Image
                    src={
                      destination.image_url ||
                      `/placeholder.svg?height=400&width=600&query=golf+course+${destination.name || '/placeholder.svg'}`
                    }
                    alt={getLocalizedField(destination, 'name') || ''}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                </div>
                <div className="p-6">
                  <h3
                    className="text-xl font-medium text-[#22333b]"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    {getLocalizedField(destination, 'name')}
                  </h3>
                  <p className="mt-1 text-sm text-[#735c38]">
                    {getLocalizedField(destination, 'country')}
                  </p>
                  {destination.description && (
                    <p className="mt-3 line-clamp-2 text-sm text-[#666666]">
                      {getLocalizedField(destination, 'description')}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center">
            <p className="text-[#666666]">
              {t('noDestinationsYet').replace('{continent}', selectedContinent || '')}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
