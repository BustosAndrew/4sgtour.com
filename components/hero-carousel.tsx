"use client"

import { useState, useEffect, useCallback } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

const heroImages = [
  "/images/royalty1.png",
  "/images/royalty2.jpg",
  "/images/royalty3.png",
  "/images/royalty4.jpg",
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
    <section className="relative h-[500px] sm:h-[600px] md:h-[700px] bg-muted shadow-xl overflow-hidden">
      {/* Carousel Images */}
      {heroImages.map((src, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
            index === currentIndex ? "opacity-100" : "opacity-0"
          }`}
        >
          <img
            src={src || "/placeholder.svg"}
            alt={`Hero slide ${index + 1}`}
            className="h-full w-full object-cover"
          />
          {/* Dark overlay for text readability */}
          <div className="absolute inset-0 bg-black/30" />
        </div>
      ))}

      {/* Text Content - Center Left */}
      <div className="absolute inset-0 flex items-center">
        <div className="container">
          <div className="max-w-2xl">
            <h1
              style={{ fontFamily: "Bitter, serif" }}
              className="text-4xl sm:text-5xl font-bold text-white tracking-wide md:text-5xl"
            >
              4 Seasons Golf Tour
            </h1>
            <p className="mt-4 text-white/90 font-sans text-3xl font-semibold">
              Customize your golf journey
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={goToPrev}
        className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/20 hover:bg-white/40 transition-colors"
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-6 w-6 text-white" />
      </button>
      <button
        onClick={goToNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/20 hover:bg-white/40 transition-colors"
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
            className={`w-3 h-3 rounded-full transition-colors ${
              index === currentIndex ? "bg-white" : "bg-white/50"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  )
}
