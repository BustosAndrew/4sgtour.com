'use client'

import React from 'react'
import Link from 'next/link'
import { useEffect, useRef, useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { CONTINENTS } from '@/lib/continents'
import { useTranslations } from '@/lib/i18n/provider'

type Destination = {
  id?: string
  name: string
  slug: string
  continent?: string
  image_url?: string | null
}

type DestinationsCarouselProps = {
  destinations?: Destination[]
}

export function DestinationsCarousel({
  destinations = [],
}: DestinationsCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [slidesPerView, setSlidesPerView] = useState(3)
  const containerRef = useRef<HTMLDivElement>(null)
  const t = useTranslations('destinations.continents')

  // Prepare carousel items.
  // If no destinations are provided, use the same continent tiles as the Destinations page comp.
  const carouselItems = useMemo(() => {
    if (destinations.length) {
      return destinations.map((dest) => ({
        name: dest.name.toUpperCase(),
        nameKey: null as string | null,
        slug: dest.slug,
        image: dest.image_url || '/placeholder.svg?height=400&width=600&query=golf+destination',
        href: `/destinations/${dest.slug}`,
      }))
    }

    return CONTINENTS.map((c) => ({
      name: c.displayName || c.name.replace('\n', ' '),
      nameKey: c.nameKey,
      slug: c.slug,
      image: c.image,
      href: `/destinations/${c.slug}`,
    }))
  }, [destinations])

  // Show a maximum of 3 slides, responsive down to 2/1.
  useEffect(() => {
    const computeSlidesPerView = () => {
      const width = window.innerWidth
      if (width < 640) return 1
      if (width < 1024) return 2
      return 3
    }

    const apply = () => setSlidesPerView(computeSlidesPerView())
    apply()

    window.addEventListener('resize', apply)
    return () => window.removeEventListener('resize', apply)
  }, [])

  const visibleSlides = Math.min(3, Math.max(1, slidesPerView))
  const maxIndex = Math.max(0, carouselItems.length - visibleSlides)

  useEffect(() => {
    setCurrentIndex((prev) => Math.min(prev, maxIndex))
  }, [maxIndex])

  const goToPrev = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1))
  }

  const goToNext = () => {
    setCurrentIndex((prev) => Math.min(maxIndex, prev + 1))
  }

  return (
    <div className="relative px-8 sm:px-0">
      {/* Navigation Arrow - Left */}
      <button
        onClick={goToPrev}
        disabled={currentIndex === 0}
        className="absolute left-0 sm:-left-6 md:-left-8 lg:-left-10 top-1/2 -translate-y-1/2 z-10 w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6 text-[#735c38]" />
      </button>

      {/* Navigation Arrow - Right */}
      <button
        onClick={goToNext}
        disabled={currentIndex >= maxIndex}
        className="absolute right-0 sm:-right-6 md:-right-8 lg:-right-10 top-1/2 -translate-y-1/2 z-10 w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        aria-label="Next slide"
      >
        <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6 text-[#735c38]" />
      </button>

      {/* Carousel Container */}
      <div className="overflow-hidden" ref={containerRef}>
        <div
          className="flex transition-transform duration-500 ease-out gap-4"
          style={{
            transform: `translateX(-${currentIndex * (100 / visibleSlides)}%)`,
          }}
        >
          {carouselItems.map((item, index) => (
            <Link
              key={index}
              href={item.href}
              className="flex-shrink-0"
              style={{ width: `${100 / visibleSlides}%` }}
            >
              <div className="group cursor-pointer">
                {/* Image */}
                <div className="aspect-[3/4] sm:aspect-[4/3] overflow-hidden">
                  <img
                    src={item.image || '/placeholder.svg'}
                    alt={item.name}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                    draggable={false}
                  />
                </div>
                {/* Label */}
                <div className="mt-2 sm:mt-3 pt-1 sm:pt-2">
                  <p
                    className="text-xs sm:text-sm md:text-base font-semibold text-[#22333b] tracking-wider text-center uppercase"
                    style={{ fontFamily: 'var(--font-body)' }}
                  >
                    {item.nameKey ? t(item.nameKey) : item.name}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
