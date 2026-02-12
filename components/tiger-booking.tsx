'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ChevronRight } from 'lucide-react'

type Region = {
  name: string
  slug: string
  description: string
}

const REGIONS: Region[] = [
  {
    name: 'Asia',
    slug: 'asia',
    description:
      'Discover premier golf courses across Thailand, Vietnam, Japan, and South Korea. Asia offers a unique blend of ancient culture, stunning landscapes, and world-class resort experiences at exceptional value.',
  },
  {
    name: 'Europe',
    slug: 'europe',
    description:
      'Play legendary links in Scotland, Ireland, Spain, and Portugal. Europe is home to the birthplace of golf, with centuries-old courses set against dramatic coastlines and rolling countryside.',
  },
  {
    name: 'North America',
    slug: 'north-america',
    description:
      'Experience iconic courses from Pebble Beach to Pinehurst. North America boasts some of the most celebrated championship venues, with diverse climates and terrain for year-round play.',
  },
  {
    name: 'South America',
    slug: 'south-america',
    description:
      'Explore hidden gems in Argentina, Brazil, and Chile. South America combines breathtaking natural beauty with emerging golf destinations, offering unforgettable courses amid the Andes and beyond.',
  },
  {
    name: 'World',
    slug: 'world',
    description:
      'From Australia and New Zealand to South Africa and the Middle East, explore golf destinations across the globe. Our worldwide network connects you with extraordinary courses on every continent.',
  },
]

export function TigerBooking() {
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null)

  return (
    <div className="flex flex-col h-full px-6 sm:px-8 md:px-10 py-8 md:py-10">
      {/* Tiger Booking Logo */}
      <div className="flex items-center justify-center mb-6">
        <Image
          src="/images/tiger.png"
          alt="Tiger Booking"
          width={280}
          height={140}
          className="w-full max-w-[200px] md:max-w-[240px] h-auto object-contain"
        />
      </div>

      {/* Region Links */}
      <div className="flex flex-col flex-1">
        <h4
          className="text-[13px] font-bold uppercase tracking-[0.15em] text-[#735c38] mb-4"
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
                className={`group flex w-full items-center justify-between py-3 text-left transition-all duration-200 ${
                  selectedRegion === region.slug
                    ? 'text-[#735c38]'
                    : 'text-[#22333b] hover:text-[#735c38]'
                }`}
              >
                <span
                  className="text-[14px] font-medium tracking-wide"
                  style={{ fontFamily: 'var(--font-body)' }}
                >
                  {region.name}
                </span>
                <ChevronRight
                  className={`h-3.5 w-3.5 shrink-0 transition-transform duration-300 ease-out ${
                    selectedRegion === region.slug ? 'rotate-90' : 'group-hover:translate-x-0.5'
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
                  <p
                    className="text-[13px] leading-relaxed text-[#735c38]/80 pb-3 pr-4"
                    style={{ fontFamily: 'var(--font-body)' }}
                  >
                    {region.description}
                  </p>
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
