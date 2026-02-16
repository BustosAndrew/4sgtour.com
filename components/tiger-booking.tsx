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

  return (
    <div className="flex flex-col h-full px-5 sm:px-6 md:px-8 py-5 md:py-6">
      {/* Tiger Booking Logo + heading row */}
      <div className="flex items-center gap-4 mb-4">
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
            className="w-full max-w-[140px] md:max-w-[160px] h-auto object-contain brightness-0 invert"
          />
        </Link>
        <div className="h-px flex-1 bg-[#fffff8]/10" />
        <span
          className="text-[12px] font-bold uppercase tracking-[0.15em] text-[#EAE0D6] shrink-0"
          style={{ fontFamily: 'var(--font-body)' }}
        >
          Book by Region
        </span>
      </div>

      {/* Region Links */}
      <div className="flex flex-col flex-1">
        <div className="flex flex-col">
          <div className="h-px bg-[#fffff8]/10" />
          {REGIONS.map((region) => (
            <div key={region.slug}>
              <button
                onClick={() =>
                  setSelectedRegion(
                    selectedRegion === region.slug ? null : region.slug,
                  )
                }
                className={`group flex w-full items-center justify-between py-2 text-left transition-all duration-200 ${
                  selectedRegion === region.slug
                    ? 'text-[#EAE0D6]'
                    : 'text-[#fffff8] hover:text-[#EAE0D6]'
                }`}
              >
                <span
                  className="text-[14px] font-semibold tracking-wide"
                  style={{ fontFamily: 'var(--font-body)' }}
                >
                  {region.name}
                </span>
                <ChevronRight
                  className={`h-3.5 w-3.5 shrink-0 transition-transform duration-300 ease-out ${
                    selectedRegion === region.slug
                      ? 'rotate-90'
                      : 'group-hover:translate-x-0.5'
                  }`}
                />
              </button>

              <div
                className={`grid transition-all duration-300 ease-in-out ${
                  selectedRegion === region.slug
                    ? 'grid-rows-[1fr] opacity-100'
                    : 'grid-rows-[0fr] opacity-0'
                }`}
              >
                <div className="overflow-hidden">
                  <div className="flex flex-wrap gap-x-3 gap-y-1 pb-2">
                    {region.countries.map((country) => (
                      <a
                        key={country.name}
                        href={country.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[13px] font-semibold text-[#fffff8]/80 underline decoration-[#EAE0D6]/30 underline-offset-2 transition-colors hover:text-[#EAE0D6] hover:decoration-[#EAE0D6]/60"
                        style={{ fontFamily: 'var(--font-body)' }}
                      >
                        {country.name}
                      </a>
                    ))}
                  </div>
                </div>
              </div>

              <div className="h-px bg-[#fffff8]/10" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
