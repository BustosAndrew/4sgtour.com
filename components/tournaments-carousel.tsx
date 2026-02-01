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
    image:
      '/placeholder.svg?height=400&width=600&query=golf+tournament+royal+birkdale',
    href: '/tournaments',
  },
  {
    id: '2',
    title: 'THE 2027 RYDER CUP',
    location: 'Limerick, Ireland',
    image:
      '/placeholder.svg?height=400&width=600&query=golf+tournament+ryder+cup+ireland',
    href: '/tournaments',
  },
  {
    id: '3',
    title: 'THE MASTERS 2026',
    location: 'Augusta, Georgia',
    image:
      '/placeholder.svg?height=400&width=600&query=golf+tournament+masters+augusta',
    href: '/tournaments',
  },
  {
    id: '4',
    title: 'US OPEN 2026',
    location: 'Shinnecock Hills, New York',
    image:
      '/placeholder.svg?height=400&width=600&query=golf+tournament+us+open+shinnecock',
    href: '/tournaments',
  },
]

const cardWidth = 420 // Base card width
const gap = 32 // Gap between cards

export function TournamentsCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  // Show 2 cards at a time, stop correctly at the end
  const visibleSlides = 2
  const maxIndex = Math.max(0, tournamentItems.length - visibleSlides)

  const goToPrev = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1))
  }

  const goToNext = () => {
    setCurrentIndex((prev) => Math.min(maxIndex, prev + 1))
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

      {/* Carousel Container - bleeds to both sides */}
      <div className="overflow-hidden" ref={containerRef}>
        <div
          className="flex gap-4 md:gap-8 transition-transform duration-500 ease-out px-[calc(50vw-220px)] md:px-[calc(50vw-440px)]"
          style={{
            transform: `translateX(-${currentIndex * (cardWidth + gap)}px)`,
          }}
        >
          {tournamentItems.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className="flex-shrink-0 w-sm lg:w-md border-2 border-[#DEW388]"
            >
              <div className="group cursor-pointer">
                {/* Image */}
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src={'/images/tourney.png'}
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

      {/* Side fades (match page background) */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-20 w-10 sm:w-16 md:w-24 bg-gradient-to-r from-[#fff]/50 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-20 w-10 sm:w-16 md:w-24 bg-gradient-to-l from-[#fff]/50 to-transparent" />
    </div>
  )
}
