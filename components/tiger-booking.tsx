'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

type CountryLink = {
  name: string
  url: string
}

type Region = {
  name: string
  slug: string
  description: string
  countries: CountryLink[]
}

const REGIONS: Region[] = [
  {
    name: 'Asia',
    slug: 'asia',
    description:
      'Discover premier golf courses across Asia. A unique blend of ancient culture, stunning landscapes, and world-class resort experiences at exceptional value.',
    countries: [
      { name: 'Japan', url: 'https://www.tigerbooking.com/Product/FIT/JP' },
      { name: 'Korea', url: 'https://www.tigerbooking.com/Product/FIT/KR' },
      { name: 'Thailand', url: 'https://www.tigerbooking.com/Product/FIT/TH' },
      { name: 'China', url: 'https://www.tigerbooking.com/Product/FIT/CN' },
      { name: 'Malaysia', url: 'https://www.tigerbooking.com/Product/FIT/MY' },
      { name: 'Singapore', url: 'https://www.tigerbooking.com/Product/FIT/SG' },
      { name: 'Vietnam', url: 'https://www.tigerbooking.com/Product/FIT/VN' },
    ],
  },
  {
    name: 'Europe',
    slug: 'europe',
    description:
      'Play legendary links across Europe. Home to the birthplace of golf, with centuries-old courses set against dramatic coastlines and rolling countryside.',
    countries: [
      { name: 'Austria', url: 'https://www.tigerbooking.com/Product/FIT/AT' },
      { name: 'Bulgaria', url: 'https://www.tigerbooking.com/Product/FIT/BG' },
      { name: 'Czech', url: 'https://www.tigerbooking.com/Product/FIT/CZ' },
      { name: 'Denmark', url: 'https://www.tigerbooking.com/Product/FIT/DK' },
      { name: 'Germany', url: 'https://www.tigerbooking.com/Product/FIT/DE' },
      { name: 'Italy', url: 'https://www.tigerbooking.com/Product/FIT/IT' },
      { name: 'Ireland', url: 'https://www.tigerbooking.com/Product/EVT/IE' },
      { name: 'Poland', url: 'https://www.tigerbooking.com/Product/FIT/PL' },
      { name: 'Portugal', url: 'https://www.tigerbooking.com/Product/FIT/PT' },
      { name: 'Spain', url: 'https://www.tigerbooking.com/Product/FIT/ES' },
      { name: 'Sweden', url: 'https://www.tigerbooking.com/Product/FIT/SE' },
      { name: 'Turkey', url: 'https://www.tigerbooking.com/Product/FIT/TR' },
      { name: 'UK', url: 'https://www.tigerbooking.com/Product/EVT/GB' },
    ],
  },
  {
    name: 'North America',
    slug: 'north-america',
    description:
      'Experience iconic championship venues with diverse climates and terrain for year-round play.',
    countries: [
      { name: 'Canada', url: 'https://www.tigerbooking.com/Product/FIT/CA' },
      { name: 'Mexico', url: 'https://www.tigerbooking.com/Product/FIT/MX' },
      { name: 'USA', url: 'https://www.tigerbooking.com/Product/FIT/US' },
    ],
  },
  {
    name: 'Latin America',
    slug: 'latin-america',
    description:
      'Explore hidden gems across South America. Breathtaking natural beauty with emerging golf destinations, offering unforgettable courses amid the Andes and beyond.',
    countries: [
      { name: 'Argentina', url: 'https://www.tigerbooking.com/Product/FIT/AR' },
      { name: 'Brazil', url: 'https://www.tigerbooking.com/Product/FIT/BR' },
      { name: 'Chile', url: 'https://www.tigerbooking.com/Product/FIT/CL' },
      { name: 'Colombia', url: 'https://www.tigerbooking.com/Product/FIT/CO' },
      { name: 'Costa Rica', url: 'https://www.tigerbooking.com/Product/FIT/CR' },
      { name: 'Los Cabos', url: 'https://www.tigerbooking.com/Product/EVT/MX' },
      { name: 'Dominica', url: 'https://www.tigerbooking.com/Product/FIT/DO' },
      { name: 'Panama', url: 'https://www.tigerbooking.com/Product/FIT/AR' },
    ],
  },
  {
    name: 'World',
    slug: 'world',
    description:
      'Explore golf destinations across the globe. Our worldwide network connects you with extraordinary courses on every continent.',
    countries: [
      { name: 'Australia', url: 'https://www.tigerbooking.com/Product/FIT/AU' },
      { name: 'Dubai', url: 'https://www.tigerbooking.com/Product/FIT/AE' },
      { name: 'Morocco', url: 'https://www.tigerbooking.com/Product/FIT/MA' },
      { name: 'Mauritius', url: 'https://www.tigerbooking.com/Product/FIT/MU' },
      { name: 'New Zealand', url: 'https://www.tigerbooking.com/Product/FIT/NZ' },
      { name: 'South Africa', url: 'https://www.tigerbooking.com/Product/FIT/ZA' },
    ],
  },
]

export function TigerBooking() {
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null)
  const activeRegion = REGIONS.find((r) => r.slug === selectedRegion)

  return (
    <div className="flex flex-col h-full px-5 sm:px-6 md:px-7 py-5 md:py-6">
      {/* Top row: logo left, region pill tabs right */}
      <div className="flex items-center justify-between gap-4 mb-4">
        <Link
          href="https://www.tigerbooking.golf/"
          target="_blank"
          rel="noopener noreferrer"
          className="transition-opacity hover:opacity-80 shrink-0"
        >
          <Image
            src="/images/tiger.png"
            alt="Tiger Booking"
            width={280}
            height={140}
            className="max-w-[100px] md:max-w-[120px] h-auto object-contain"
          />
        </Link>

        {/* Region pill tabs */}
        <div className="flex flex-wrap justify-end gap-1.5">
          {REGIONS.map((region) => (
            <button
              key={region.slug}
              onClick={() =>
                setSelectedRegion(
                  selectedRegion === region.slug ? null : region.slug,
                )
              }
              className={`px-2.5 py-1 text-[11px] md:text-[12px] font-semibold uppercase tracking-wider transition-all duration-200 border ${
                selectedRegion === region.slug
                  ? 'bg-[#22333b] text-[#fffff8] border-[#22333b]'
                  : 'bg-transparent text-[#22333b]/60 border-[#22333b]/15 hover:border-[#735c38]/50 hover:text-[#735c38]'
              }`}
              style={{ fontFamily: 'var(--font-body)' }}
            >
              {region.name}
            </button>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-[#22333b]/10 mb-3" />

      {/* Country links area */}
      <div className="flex-1 min-h-[48px]">
        {activeRegion ? (
          <div>
            <p
              className="text-[14px] leading-relaxed text-[#22333b] mb-2.5"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              {activeRegion.description}
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-1.5">
              {activeRegion.countries.map((country) => (
                <a
                  key={country.name}
                  href={country.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[14px] font-semibold text-[#22333b] underline decoration-[#735c38]/30 underline-offset-2 transition-colors hover:text-[#735c38] hover:decoration-[#735c38]/60"
                  style={{ fontFamily: 'var(--font-body)' }}
                >
                  {country.name}
                </a>
              ))}
            </div>
          </div>
        ) : (
          <p
            className="text-[14px] text-[#22333b]/40"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            Select a region above to view available destinations
          </p>
        )}
      </div>
    </div>
  )
}
