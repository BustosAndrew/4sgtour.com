'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { useTranslations } from '@/lib/i18n/provider'

type CountryLink = {
  nameKey: string
  url: string
}

type Region = {
  nameKey: string
  slug: string
  descriptionKey: string
  countries: CountryLink[]
}

const REGIONS: Region[] = [
  {
    nameKey: 'asia',
    slug: 'asia',
    descriptionKey: 'asiaDescription',
    countries: [
      { nameKey: 'japan', url: 'https://www.tigerbooking.com/Product/FIT/JP' },
      { nameKey: 'korea', url: 'https://www.tigerbooking.com/Product/FIT/KR' },
      { nameKey: 'thailand', url: 'https://www.tigerbooking.com/Product/FIT/TH' },
      { nameKey: 'china', url: 'https://www.tigerbooking.com/Product/FIT/CN' },
      { nameKey: 'malaysia', url: 'https://www.tigerbooking.com/Product/FIT/MY' },
      { nameKey: 'singapore', url: 'https://www.tigerbooking.com/Product/FIT/SG' },
      { nameKey: 'vietnam', url: 'https://www.tigerbooking.com/Product/FIT/VN' },
    ],
  },
  {
    nameKey: 'europe',
    slug: 'europe',
    descriptionKey: 'europeDescription',
    countries: [
      { nameKey: 'austria', url: 'https://www.tigerbooking.com/Product/FIT/AT' },
      { nameKey: 'bulgaria', url: 'https://www.tigerbooking.com/Product/FIT/BG' },
      { nameKey: 'czech', url: 'https://www.tigerbooking.com/Product/FIT/CZ' },
      { nameKey: 'denmark', url: 'https://www.tigerbooking.com/Product/FIT/DK' },
      { nameKey: 'germany', url: 'https://www.tigerbooking.com/Product/FIT/DE' },
      { nameKey: 'italy', url: 'https://www.tigerbooking.com/Product/FIT/IT' },
      { nameKey: 'ireland', url: 'https://www.tigerbooking.com/Product/EVT/IE' },
      { nameKey: 'poland', url: 'https://www.tigerbooking.com/Product/FIT/PL' },
      { nameKey: 'portugal', url: 'https://www.tigerbooking.com/Product/FIT/PT' },
      { nameKey: 'spain', url: 'https://www.tigerbooking.com/Product/FIT/ES' },
      { nameKey: 'sweden', url: 'https://www.tigerbooking.com/Product/FIT/SE' },
      { nameKey: 'turkey', url: 'https://www.tigerbooking.com/Product/FIT/TR' },
      { nameKey: 'uk', url: 'https://www.tigerbooking.com/Product/EVT/GB' },
    ],
  },
  {
    nameKey: 'northAmerica',
    slug: 'north-america',
    descriptionKey: 'northAmericaDescription',
    countries: [
      { nameKey: 'canada', url: 'https://www.tigerbooking.com/Product/FIT/CA' },
      { nameKey: 'mexico', url: 'https://www.tigerbooking.com/Product/FIT/MX' },
      { nameKey: 'usa', url: 'https://www.tigerbooking.com/Product/FIT/US' },
    ],
  },
  {
    nameKey: 'latinAmerica',
    slug: 'latin-america',
    descriptionKey: 'latinAmericaDescription',
    countries: [
      { nameKey: 'argentina', url: 'https://www.tigerbooking.com/Product/FIT/AR' },
      { nameKey: 'brazil', url: 'https://www.tigerbooking.com/Product/FIT/BR' },
      { nameKey: 'chile', url: 'https://www.tigerbooking.com/Product/FIT/CL' },
      { nameKey: 'colombia', url: 'https://www.tigerbooking.com/Product/FIT/CO' },
      { nameKey: 'costaRica', url: 'https://www.tigerbooking.com/Product/FIT/CR' },
      { nameKey: 'losCabos', url: 'https://www.tigerbooking.com/Product/EVT/MX' },
      { nameKey: 'dominica', url: 'https://www.tigerbooking.com/Product/FIT/DO' },
      { nameKey: 'panama', url: 'https://www.tigerbooking.com/Product/FIT/AR' },
    ],
  },
  {
    nameKey: 'world',
    slug: 'world',
    descriptionKey: 'worldDescription',
    countries: [
      { nameKey: 'australia', url: 'https://www.tigerbooking.com/Product/FIT/AU' },
      { nameKey: 'dubai', url: 'https://www.tigerbooking.com/Product/FIT/AE' },
      { nameKey: 'morocco', url: 'https://www.tigerbooking.com/Product/FIT/MA' },
      { nameKey: 'mauritius', url: 'https://www.tigerbooking.com/Product/FIT/MU' },
      { nameKey: 'newZealand', url: 'https://www.tigerbooking.com/Product/FIT/NZ' },
      { nameKey: 'southAfrica', url: 'https://www.tigerbooking.com/Product/FIT/ZA' },
    ],
  },
]

export function TigerBooking() {
  const t = useTranslations('tigerBooking')
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
              {t(region.nameKey)}
            </button>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-[#22333b]/20 mb-3" />

      {/* Country links area */}
      <div className="flex-1 min-h-[48px]">
        {activeRegion ? (
          <div>
            <p
              className="text-[14px] leading-relaxed text-[#22333b] mb-2.5"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              {t(activeRegion.descriptionKey)}
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-1.5">
              {activeRegion.countries.map((country) => (
                <a
                  key={country.nameKey}
                  href={country.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[14px] font-semibold text-[#22333b] underline decoration-[#735c38]/30 underline-offset-2 transition-colors hover:text-[#735c38] hover:decoration-[#735c38]/60"
                  style={{ fontFamily: 'var(--font-body)' }}
                >
                  {t(`countries.${country.nameKey}`)}
                </a>
              ))}
            </div>
          </div>
        ) : (
          <p
            className="text-[14px] text-[#22333b]/70"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            {t('selectRegion')}
          </p>
        )}
      </div>
    </div>
  )
}
