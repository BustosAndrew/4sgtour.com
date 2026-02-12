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
      { name: 'Thailand', url: 'https://www.tigerbooking.com/Product/FIT/TH' },
      { name: 'Vietnam', url: 'https://www.tigerbooking.com/Product/FIT/VN' },
      { name: 'Japan', url: 'https://www.tigerbooking.com/Product/FIT/JP' },
      { name: 'South Korea', url: 'https://www.tigerbooking.com/Product/FIT/KR' },
    ],
  },
  {
    name: 'Europe',
    slug: 'europe',
    description:
      'Play legendary links across Europe. Home to the birthplace of golf, with centuries-old courses set against dramatic coastlines and rolling countryside.',
    countries: [
      { name: 'Ireland', url: 'https://www.tigerbooking.com/Product/FIT/IE' },
      { name: 'Spain', url: 'https://www.tigerbooking.com/Product/FIT/ES' },
      { name: 'Portugal', url: 'https://www.tigerbooking.com/Product/FIT/PT' },
    ],
  },
  {
    name: 'North America',
    slug: 'north-america',
    description:
      'Experience iconic championship venues with diverse climates and terrain for year-round play.',
    countries: [
      {
        name: 'Pebble Beach',
        url: 'https://www.tigerbooking.com/Product/Search?playdate=&playerCnt=&searchName=Pebble%20Beach&searchCode=USC5155&searchType=city',
      },
      {
        name: 'Pinehurst',
        url: 'https://www.tigerbooking.com/Product/Search?playdate=&playerCnt=&searchName=Pinehurst%20&searchCode=USC0931&searchType=city',
      },
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
    ],
  },
  {
    name: 'World',
    slug: 'world',
    description:
      'Explore golf destinations across the globe. Our worldwide network connects you with extraordinary courses on every continent.',
    countries: [
      { name: 'Australia', url: 'https://www.tigerbooking.com/Product/FIT/AU' },
      { name: 'New Zealand', url: 'https://www.tigerbooking.com/Product/FIT/NZ' },
      { name: 'South Africa', url: 'https://www.tigerbooking.com/Product/FIT/ZA' },
    ],
  },
]

export function TigerBooking() {
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null)

  return (
    <div className="flex flex-col h-full px-6 sm:px-8 md:px-10 py-8 md:py-10">
      {/* Tiger Booking Logo */}
      <div className="flex items-center justify-center mb-6">
        <Link
          href="https://www.tigerbooking.golf/"
          target="_blank"
          rel="noopener noreferrer"
          className="transition-opacity hover:opacity-80"
        >
          <Image
            src="/images/tiger.png"
            alt="Tiger Booking"
            width={280}
            height={140}
            className="w-full max-w-[200px] md:max-w-[240px] h-auto object-contain"
          />
        </Link>
      </div>

      {/* Region Links */}
      <div className="flex flex-col flex-1">
        <h4
          className="text-[15px] font-bold uppercase tracking-[0.15em] text-[#735c38] mb-4"
          style={{ fontFamily: 'var(--font-body)' }}
        >
          Book by Region
        </h4>

        <div className="flex flex-col">
          <div className="h-px bg-[#22333b]/8" />
          {REGIONS.map((region) => (
            <div key={region.slug}>
              <button
                onClick={() =>
                  setSelectedRegion(
                    selectedRegion === region.slug ? null : region.slug,
                  )
                }
                className={`group flex w-full items-center justify-between py-3.5 text-left transition-all duration-200 ${selectedRegion === region.slug
                  ? 'text-[#735c38]'
                  : 'text-[#22333b] hover:text-[#735c38]'
                  }`}
              >
                <span
                  className="text-[16px] font-medium tracking-wide"
                  style={{ fontFamily: 'var(--font-body)' }}
                >
                  {region.name}
                </span>
                <ChevronRight
                  className={`h-4 w-4 shrink-0 transition-transform duration-300 ease-out ${selectedRegion === region.slug ? 'rotate-90' : 'group-hover:translate-x-0.5'
                    }`}
                />
              </button>

              <div
                className={`grid transition-all duration-300 ease-in-out ${selectedRegion === region.slug
                  ? 'grid-rows-[1fr] opacity-100'
                  : 'grid-rows-[0fr] opacity-0'
                  }`}
              >
                <div className="overflow-hidden">
                  <p
                    className="text-[15px] leading-relaxed text-[#735c38]/80 pb-2 pr-4"
                    style={{ fontFamily: 'var(--font-body)' }}
                  >
                    {region.description}
                  </p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1.5 pb-3">
                    {region.countries.map((country) => (
                      <a
                        key={country.name}
                        href={country.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[14px] font-medium text-[#22333b] underline decoration-[#735c38]/30 underline-offset-2 transition-colors hover:text-[#735c38] hover:decoration-[#735c38]/60"
                        style={{ fontFamily: 'var(--font-body)' }}
                      >
                        {country.name}
                      </a>
                    ))}
                  </div>
                </div>
              </div>

              <div className="h-px bg-[#22333b]/8" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
