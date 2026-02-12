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

  const activeRegion = REGIONS.find((r) => r.slug === selectedRegion)

  return (
    <div className="flex flex-col md:flex-row items-stretch w-full">
      {/* Left: Tiger Booking Logo */}
      <div className="flex items-center justify-center bg-white p-8 md:p-12 md:w-1/2">
        <Image
          src="/images/tiger.png"
          alt="Tiger Booking"
          width={400}
          height={340}
          className="w-full max-w-[320px] md:max-w-[400px] h-auto object-contain"
        />
      </div>

      {/* Right: Region Links Card */}
      <div className="md:w-1/2 bg-[#fafaf5] p-6 sm:p-8 md:p-10 flex flex-col justify-center">
        <h3
          className="text-[20px] sm:text-[22px] font-bold uppercase tracking-wide text-[#22333b] mb-5"
          style={{ fontFamily: 'var(--font-body)' }}
        >
          Book by Region
        </h3>

        <div className="flex flex-col">
          {REGIONS.map((region, index) => (
            <div key={region.slug}>
              {/* Divider on top */}
              {index === 0 && <div className="h-px bg-[#22333b]/10" />}

              {/* Region button row */}
              <button
                onClick={() =>
                  setSelectedRegion(
                    selectedRegion === region.slug ? null : region.slug,
                  )
                }
                className={`group flex w-full items-center justify-between py-3.5 text-left transition-colors duration-200 ${
                  selectedRegion === region.slug
                    ? 'text-[#64CF69]'
                    : 'text-[#22333b] hover:text-[#64CF69]'
                }`}
              >
                <span
                  className="text-[15px] sm:text-[17px] font-medium tracking-wide"
                  style={{ fontFamily: 'var(--font-body)' }}
                >
                  {region.name}
                </span>
                <ChevronRight
                  className={`h-4 w-4 transition-transform duration-200 ${
                    selectedRegion === region.slug ? 'rotate-90' : ''
                  }`}
                />
              </button>

              {/* Expandable description */}
              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  selectedRegion === region.slug
                    ? 'max-h-48 opacity-100 pb-3'
                    : 'max-h-0 opacity-0'
                }`}
              >
                <p
                  className="text-[13px] sm:text-[14px] leading-relaxed text-[#735c38] pl-1"
                  style={{ fontFamily: 'var(--font-body)' }}
                >
                  {region.description}
                </p>
              </div>

              {/* Divider */}
              <div className="h-px bg-[#22333b]/10" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
