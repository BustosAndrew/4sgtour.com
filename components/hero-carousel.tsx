'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

const heroImages = [
  '/images/main4.png',
  '/images/main2.jpg',
  '/images/main3.jpg',
  '/images/main1.png',
]

export function HeroCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0)

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % heroImages.length)
  }, [])

  const goToPrev = useCallback(() => {
    setCurrentIndex(
      (prev) => (prev - 1 + heroImages.length) % heroImages.length,
    )
  }, [])

  // Auto-advance every 5 seconds
  useEffect(() => {
    const interval = setInterval(goToNext, 5000)
    return () => clearInterval(interval)
  }, [goToNext])

  return (
    <section className="relative h-[105vh] bg-[#22333b] overflow-hidden">
      {/* Carousel Images */}
      {heroImages.map((src, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
            index === currentIndex ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <img
            src={src || '/placeholder.svg'}
            alt={`Hero slide ${index + 1}`}
            className="h-full w-full object-cover"
          />
          {/* Dark overlay for text readability */}
          <div className="absolute inset-0 bg-black/10" />
        </div>
      ))}

      {/* Text Content - Right Aligned */}
      <div className="absolute inset-0 flex items-center justify-center sm:justify-end">
        <div className="text-center sm:text-right px-4 sm:px-8 md:px-16 lg:px-24">
          {/* Subtitle */}
          <p
            className="uppercase text-white text-sm sm:text-lg md:text-xl lg:text-[24px] font-semibold"
            style={{ fontFamily: "'sweet-sans-pro', sans-serif" }}
          >
            Luxury Golf Travel
          </p>
          {/* Main heading */}
          <p
            className="text-3xl sm:text-4xl md:text-5xl lg:text-[64px] text-white leading-tight"
            style={{
              fontFamily: "'loretta', serif",
              fontWeight: 400,
            }}
          >
            <span style={{ fontVariantNumeric: 'lining-nums' }}>4</span> Seasons
            Golf Tour
          </p>
          {/* Tagline */}
          <p className="text-base sm:text-lg md:text-xl lg:text-[24px] text-white mb-6 sm:mb-8 font-semibold">
            Customize <em>your</em> golf journey.
          </p>
          {/* CTA Button */}
          <Link
            href="/destinations"
            className="inline-block bg-[#735c38] hover:bg-[#5d4a2d] text-white px-6 sm:px-8 py-2.5 sm:py-3 text-xs sm:text-sm uppercase tracking-[0.15em] transition-colors"
            style={{ fontFamily: "'sweet-sans-pro', sans-serif" }}
          >
            Start Exploring &gt;
          </Link>
        </div>
      </div>

      {/* Dot Indicators */}
      <div className="absolute bottom-6 sm:bottom-8 md:bottom-10 left-1/2 -translate-x-1/2 flex gap-2">
        {heroImages.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full transition-colors border-2 border-white ${
              index === currentIndex ? 'bg-white' : 'bg-white/30'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  )
}
