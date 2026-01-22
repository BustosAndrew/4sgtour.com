'use client'

import { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'

const heroImages = [
  '/images/royalty1.png',
  '/images/royalty2.jpg',
  '/images/royalty3.png',
  '/images/royalty4.jpg',
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
    <section className="relative h-[500px] sm:h-[600px] md:h-[700px] bg-[#22333b] overflow-hidden">
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
          <div className="absolute inset-0 bg-black/40" />
        </div>
      ))}

      {/* Text Content - Right Aligned */}
      <div className="absolute inset-0 flex items-center justify-end">
        <div className="text-right px-8 md:px-16 lg:px-24">
          {/* Subtitle */}
          <p
            className="uppercase text-white/80 text-[24px] font-semibold"
            style={{ fontFamily: "'sweet-sans-pro', sans-serif" }}
          >
            Luxury Golf Travel
          </p>
          {/* Main heading */}
          <p
            className="text-[64px] text-white"
            style={{
              fontFamily: "'loretta', serif",
              fontWeight: 400,
            }}
          >
            4 Seasons Golf Tour
          </p>
          {/* Tagline */}
          <p className="text-[24px] text-white/90 mb-8">
            Customize <em>your</em> golf journey.
          </p>
          {/* CTA Button */}
          <Link
            href="/destinations"
            className="inline-block bg-[#735c38] hover:bg-[#5d4a2d] text-white px-8 py-3 text-sm uppercase tracking-[0.15em] transition-colors"
            style={{ fontFamily: "'sweet-sans-pro', sans-serif" }}
          >
            Start Exploring &gt;
          </Link>
        </div>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={goToPrev}
        className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-6 w-6 text-white" />
      </button>
      <button
        onClick={goToNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
        aria-label="Next slide"
      >
        <ChevronRight className="h-6 w-6 text-white" />
      </button>

      {/* Dot Indicators */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
        {heroImages.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-2 h-2 rounded-full transition-colors ${
              index === currentIndex ? 'bg-white' : 'bg-white/40'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  )
}
