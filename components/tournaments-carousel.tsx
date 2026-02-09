'use client'

import Link from 'next/link'
import { useState, useRef, useEffect } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  MapPin,
  Calendar,
  Clock,
} from 'lucide-react'

const tournamentItems = [
  {
    id: '1',
    title: 'THE 154TH OPEN AT ROYAL BIRKDALE',
    location: 'Southport, England',
    date: 'September, 2027',
    duration: '3 Nights & 3 Rounds',
    price: '$615',
    image: '/images/1.png',
    href: '/tournaments',
  },
  {
    id: '2',
    title: 'THE 2027 RYDER CUP',
    location: 'Limerick, Ireland',
    date: 'September, 2027',
    duration: '3 Nights & 3 Rounds',
    price: '$615',
    image: '/images/2.png',
    href: '/tournaments',
  },
  {
    id: '3',
    title: 'THE MASTERS 2026',
    location: 'Augusta, Georgia',
    date: 'April, 2026',
    duration: '4 Nights & 3 Rounds',
    price: '$1,250',
    image: '/images/3.png',
    href: '/tournaments',
  },
  {
    id: '4',
    title: 'US OPEN 2026',
    location: 'Shinnecock Hills, New York',
    date: 'June, 2026',
    duration: '3 Nights & 3 Rounds',
    price: '$950',
    image: '/images/4.png',
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
      const contWidth = containerRef.current?.offsetWidth ?? window.innerWidth
      setContainerWidth(contWidth)
      const width = window.innerWidth

      if (width < 640) {
        // Mobile: use most of the container width so one card fits nicely
        const p = 20
        const g = 12
        const cw = Math.min(360, Math.max(260, contWidth - p * 2 - 16))
        setPadding(p)
        setGap(g)
        setCardWidth(cw)
      } else if (width < 1024) {
        // Tablet: show a bit of the next card
        const p = 40
        const g = 20
        const cw = Math.min(380, Math.max(320, contWidth / 1.9 - g))
        setPadding(p)
        setGap(g)
        setCardWidth(cw)
      } else {
        // Desktop: fixed card size
        setPadding(64)
        setGap(32)
        setCardWidth(420)
      }
    }
    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [])

  // Calculate visible slides based on actual container and card sizes
  const visibleSlides = containerWidth
    ? Math.max(1, containerWidth / (cardWidth + gap))
    : containerWidth < 640
      ? 1
      : containerWidth < 1024
        ? 1.5
        : 2

  const maxIndex = Math.max(
    0,
    Math.ceil(tournamentItems.length - visibleSlides),
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
    return Math.min(Math.round(stepScroll), Math.round(maxScroll))
  }

  return (
    <div className="relative">
      {/* Navigation Arrow - Left */}
      <button
        onClick={goToPrev}
        disabled={currentIndex === 0}
        className="absolute left-3 md:left-6 lg:left-20 top-1/2 -translate-y-1/2 z-50 w-14 h-14 md:w-14 md:h-14 lg:w-16 lg:h-16 flex items-center justify-center rounded-full bg-black/27 text-white shadow-md disabled:opacity-50 disabled:cursor-not-allowed transform transition-all hover:scale-105"
        aria-label="Previous slide"
      >
        <ChevronLeft
          className="h-7 w-7 md:h-8 md:w-8 text-white"
          strokeWidth={2.5}
        />
      </button>

      {/* Navigation Arrow - Right */}
      <button
        onClick={goToNext}
        disabled={currentIndex >= maxIndex}
        className="absolute right-3 md:right-10 lg:right-20 top-1/2 -translate-y-1/2 z-50 w-14 h-14 md:w-14 md:h-14 lg:w-16 lg:h-16 flex items-center justify-center rounded-full bg-black/27 text-white shadow-md disabled:opacity-50 disabled:cursor-not-allowed transform transition-all hover:scale-105"
        aria-label="Next slide"
      >
        <ChevronRight
          className="h-7 w-7 md:h-8 md:w-8 text-white"
          strokeWidth={2.5}
        />
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
              className="flex-shrink-0"
              style={{ width: `${cardWidth}px` }}
            >
              <div className="group cursor-pointer bg-white border border-gray-200">
                {/* Image */}
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                    draggable={false}
                  />
                </div>
                {/* Info section */}
                <div className="py-6 px-4 text-center">
                  <h3
                    className="text-base md:text-lg font-bold text-[#735C38] uppercase tracking-wide mb-4"
                    style={{ fontFamily: 'var(--font-body)' }}
                  >
                    {item.title}
                  </h3>
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex items-center justify-center gap-2 text-[#22333b]">
                      <MapPin className="h-4 w-4 flex-shrink-0" />
                      <span
                        className="text-sm font-semibold"
                        style={{ fontFamily: 'var(--font-body)' }}
                      >
                        {item.location}
                      </span>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-[#22333b]">
                      <Calendar className="h-4 w-4 flex-shrink-0" />
                      <span
                        className="text-sm font-semibold"
                        style={{ fontFamily: 'var(--font-body)' }}
                      >
                        {item.date}
                      </span>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-[#22333b]">
                      <Clock className="h-4 w-4 flex-shrink-0" />
                      <span
                        className="text-sm font-semibold"
                        style={{ fontFamily: 'var(--font-body)' }}
                      >
                        {item.duration}
                      </span>
                    </div>
                  </div>
                  <p
                    className="mt-4 text-sm text-[#735C38] font-semibold"
                    style={{ fontFamily: 'var(--font-body)' }}
                  >
                    from <span className="text-lg font-bold">{item.price}</span>
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Side fades for bleed effect */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-40 w-10 sm:w-32 md:w-48 bg-gradient-to-r from-[#fffff8] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-40 w-10 sm:w-32 md:w-48 bg-gradient-to-l from-[#fffff8] to-transparent" />
    </div>
  )
}
