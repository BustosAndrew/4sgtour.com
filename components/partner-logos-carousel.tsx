'use client'

import Image from 'next/image'

const partners = [
  {
    src: '/images/tiger.png',
    alt: 'Tiger Booking',
  },
  {
    src: '/images/iagto.png',
    alt: 'IAGTO',
  },
  { src: '/images/los-cabos.png', alt: 'Los Cabos Tourism Board' },
  { src: '/images/ireland.png', alt: 'Ireland Tourism Board' },
  {
    src: '/images/pebble.png',
    alt: 'Pebble Beach Golf Links',
  },
  {
    src: '/images/times.png',
    alt: 'Global Golf Times',
  },
]

export function PartnerLogosCarousel() {
  return (
    <div className="relative w-full overflow-hidden" aria-label="Partner logos">
      {/* Fade masks on left and right edges */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-[#fffff8] to-transparent sm:w-24" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-[#fffff8] to-transparent sm:w-24" />

      {/* Scrolling track: two copies for seamless loop */}
      <div className="flex w-max animate-scroll-logos">
        {[...partners, ...partners].map((partner, i) => {
          const isTimes =
            partner.src?.includes('times.png') ||
            partner.alt === 'Global Golf Times'
          const isIreland =
            partner.src?.includes('ireland.png') ||
            partner.alt === 'Ireland Tourism Board'
          const isLarger = isTimes || isIreland
          const containerClass = isLarger
            ? 'relative h-20 w-36 sm:h-24 sm:w-44 md:h-28 md:w-52 lg:h-32 lg:w-60'
            : 'relative h-14 w-28 sm:h-18 sm:w-36 md:h-20 md:w-44 lg:h-24 lg:w-52'
          const sizes = isLarger
            ? '(min-width: 1024px) 15rem, (min-width: 768px) 13rem, (min-width: 640px) 11rem, 9rem'
            : '(min-width: 1024px) 13rem, (min-width: 768px) 11rem, (min-width: 640px) 9rem, 7rem'

          return (
            <div
              key={`${partner.alt}-${i}`}
              className="flex flex-shrink-0 flex-col items-center justify-center px-6 sm:px-10 md:px-14 lg:px-16"
            >
              <div className={containerClass}>
                <Image
                  src={partner.src}
                  alt={partner.alt}
                  fill
                  className="object-contain"
                  sizes={sizes}
                />
              </div>
              {/* {partner.label && (
                <p
                  className="mt-2 text-center text-[10px] font-bold uppercase sm:text-xs"
                  style={{ fontFamily: 'var(--font-body)' }}
                >
                  {partner.label}
                </p>
              )} */}
            </div>
          )
        })}
      </div>
    </div>
  )
}
