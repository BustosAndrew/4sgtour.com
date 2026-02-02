'use client'

import React from 'react'
import Link from 'next/link'
import { useState, useRef, useEffect } from 'react'
import { ChevronLeft, ChevronRight, MapPin } from 'lucide-react'

// Single placeholder tournament item
const tournamentItems = [
  {
    id: '1',
    title: 'THE 154TH OPEN AT ROYAL BIRKDALE',
    location: 'Southport, England',
    image: '/images/tourney.png',
    href: '/tournaments',
  },
  {
    id: '2',
    title: 'THE 2027 RYDER CUP',
    location: 'Limerick, Ireland',
    image: '/images/tourney2.png',
    href: '/tournaments',
  },
  {
    id: '3',
    title: 'THE MASTERS 2026',
    location: 'Augusta, Georgia',
    image: '/images/tourney.png',
    href: '/tournaments',
  },
  {
    id: '4',
    title: 'US OPEN 2026',
    location: 'Shinnecock Hills, New York',
    image: '/images/tourney2.png',
    href: '/tournaments',
  },
]

export function TournamentsCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [containerWidth, setContainerWidth] = useState(0)
  const [cardWidth, setCardWidth] = useState(420)
  const [gap, setGap] = useState(32)
  const [padding, setPadding] = useState(64)
  const containerRef = useRef<HTMLDivElement>(null)

  // Responsive: adjust card width, gap, and visible slides based on screen size
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth)
      }
      const width = window.innerWidth
      if (width < 640) {
        // Mobile: single card, smaller gap and padding
        setCardWidth(Math.min(320, width - 80))
        setGap(16)
        setPadding(24)
      } else if (width < 1024) {
        // Tablet: medium cards
        setCardWidth(340)
        setGap(24)
        setPadding(40)
      } else {
        // Desktop: full size
        setCardWidth(420)
        setGap(32)
        setPadding(64)
      }
    }
    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [])

  // Calculate visible slides based on screen width
  const visibleSlides =
    containerWidth < 640 ? 1 : containerWidth < 1024 ? 1.5 : 2
  const maxIndex = Math.max(
    0,
    tournamentItems.length - Math.ceil(visibleSlides),
  )

  const goToPrev = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1))
  }

  const goToNext = () => {
    setCurrentIndex((prev) => Math.min(maxIndex, prev + 1))
  }

  // Calculate transform: scroll by card+gap, but cap at max scroll distance
  const getTransform = () => {
    if (currentIndex === 0) {
      return 0
    }
    // Total content width (cards + gaps + left/right padding)
    const totalContentWidth =
      tournamentItems.length * cardWidth +
      (tournamentItems.length - 1) * gap +
      padding * 2
    // Maximum we can scroll before last card hits right edge
    const maxScroll = Math.max(0, totalContentWidth - containerWidth)
    // Regular step-based scroll, capped at max
    const stepScroll = currentIndex * (cardWidth + gap)
    return Math.min(stepScroll, maxScroll)
  }

  return (
    <div className="relative">
      {/* Navigation Arrow - Left */}
      <button
        onClick={goToPrev}
        disabled={currentIndex === 0}
        className="absolute left-2 md:left-6 lg:left-10 top-1/2 -translate-y-1/2 z-30 w-10 h-10 flex items-center justify-center rounded-full disabled:opacity-30 disabled:cursor-not-allowed transition-all hover:shadow-md"
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-5 w-5 text-white" strokeWidth={4} />
      </button>

      {/* Navigation Arrow - Right */}
      <button
        onClick={goToNext}
        disabled={currentIndex >= maxIndex}
        className="absolute right-2 md:right-6 lg:right-10 top-1/2 -translate-y-1/2 z-30 w-10 h-10 flex items-center justify-center rounded-full disabled:opacity-30 disabled:cursor-not-allowed transition-all hover:shadow-md"
        aria-label="Next slide"
      >
        <ChevronRight className="h-5 w-5 text-white" strokeWidth={4} />
      </button>

      {/* Carousel Container - first slide at left edge, last slide at right edge */}
      <div className="overflow-hidden" ref={containerRef}>
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{
            transform: `translateX(-${getTransform()}px)`,
            gap: `${gap}px`,
            paddingLeft: `${padding}px`,
            paddingRight: `${padding}px`,
          }}
        >
          {tournamentItems.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className="flex-shrink-0 border-2 border-[#DEW388]"
              style={{ width: `${cardWidth}px` }}
            >
              <div className="group cursor-pointer">
                {/* Image */}
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                    draggable={false}
                  />
                </div>
                {/* White card with title and location */}
                <div className="bg-white py-6 px-4 text-center">
                  <h3
                    className="text-base md:text-lg font-bold text-[#735C38] tracking-wide mb-2"
                    style={{ fontFamily: 'var(--font-body)' }}
                  >
                    {item.title}
                  </h3>
                  <div className="flex items-center justify-center gap-1.5 text-[#22333b]">
                    <MapPin className="h-4 w-4" />
                    <span
                      className="text-sm"
                      style={{ fontFamily: 'var(--font-body)' }}
                    >
                      {item.location}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Side fades for bleed effect */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-20 w-10 sm:w-16 md:w-24 bg-gradient-to-r from-[#fffff8] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-20 w-10 sm:w-16 md:w-24 bg-gradient-to-l from-[#fffff8] to-transparent" />
    </div>
  )
}
