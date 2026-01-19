"use client"

import { useState, useRef } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

const destinationImages = [
  { src: "/placeholder.svg?height=400&width=600&query=golf+course+scotland+castle", alt: "Scotland golf course" },
  { src: "/placeholder.svg?height=400&width=600&query=golf+course+aerial+ocean", alt: "Aerial ocean golf course" },
  { src: "/placeholder.svg?height=400&width=600&query=golf+course+sunset+fairway", alt: "Sunset fairway" },
  { src: "/placeholder.svg?height=400&width=600&query=golf+course+ireland+links", alt: "Ireland links" },
  { src: "/placeholder.svg?height=400&width=600&query=golf+course+mountains", alt: "Mountain golf course" },
]

export function DestinationsCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  
  const visibleCount = 3
  const maxIndex = Math.max(0, destinationImages.length - visibleCount)

  const goToPrev = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1))
  }

  const goToNext = () => {
    setCurrentIndex((prev) => Math.min(maxIndex, prev + 1))
  }

  return (
    <div className="relative">
      {/* Navigation Arrows */}
      <button
        onClick={goToPrev}
        disabled={currentIndex === 0}
        className="absolute -left-4 md:-left-6 top-1/2 -translate-y-1/2 z-10 p-2 bg-white/80 hover:bg-white rounded-full shadow-md disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-5 w-5 text-[#22333b]" />
      </button>
      <button
        onClick={goToNext}
        disabled={currentIndex >= maxIndex}
        className="absolute -right-4 md:-right-6 top-1/2 -translate-y-1/2 z-10 p-2 bg-white/80 hover:bg-white rounded-full shadow-md disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        aria-label="Next slide"
      >
        <ChevronRight className="h-5 w-5 text-[#22333b]" />
      </button>

      {/* Carousel Container */}
      <div className="overflow-hidden" ref={containerRef}>
        <div 
          className="flex gap-4 transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${currentIndex * (100 / visibleCount)}%)` }}
        >
          {destinationImages.map((image, index) => (
            <div 
              key={index} 
              className="flex-shrink-0 w-full md:w-[calc(33.333%-11px)]"
            >
              <div className="aspect-[4/3] overflow-hidden">
                <img
                  src={image.src || "/placeholder.svg"}
                  alt={image.alt}
                  className="h-full w-full object-cover hover:scale-105 transition-transform duration-500"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dot indicators */}
      <div className="flex justify-center gap-2 mt-6">
        {Array.from({ length: maxIndex + 1 }).map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-2 h-2 rounded-full transition-colors ${
              index === currentIndex ? "bg-[#735c38]" : "bg-[#d9d9d9]"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  )
}
