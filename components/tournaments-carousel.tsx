"use client"

import React from "react"

import { useState, useRef, useEffect } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

const tournamentItems = [
  { src: "/placeholder.svg?height=400&width=600&query=golf+tournament+pebble+beach", alt: "Pebble Beach tournament" },
  { src: "/placeholder.svg?height=400&width=600&query=golf+tournament+st+andrews", alt: "St Andrews tournament" },
  { src: "/placeholder.svg?height=400&width=600&query=golf+tournament+augusta", alt: "Augusta tournament" },
  { src: "/placeholder.svg?height=400&width=600&query=golf+tournament+royal+birkdale", alt: "Royal Birkdale tournament" },
  { src: "/placeholder.svg?height=400&width=600&query=golf+tournament+torrey+pines", alt: "Torrey Pines tournament" },
]

export function TournamentsCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [scrollLeft, setScrollLeft] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const cardWidth = 380 // Base card width
  const gap = 24 // Gap between cards

  const goToPrev = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1))
  }

  const goToNext = () => {
    setCurrentIndex((prev) => Math.min(tournamentItems.length - 1, prev + 1))
  }

  // Touch/drag handling for mobile
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setStartX(e.pageX - (containerRef.current?.offsetLeft || 0))
    setScrollLeft(currentIndex * (cardWidth + gap))
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    e.preventDefault()
    const x = e.pageX - (containerRef.current?.offsetLeft || 0)
    const walk = (startX - x) * 1.5
    const newIndex = Math.round((scrollLeft + walk) / (cardWidth + gap))
    if (newIndex >= 0 && newIndex < tournamentItems.length) {
      setCurrentIndex(newIndex)
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  useEffect(() => {
    const handleMouseUpGlobal = () => setIsDragging(false)
    window.addEventListener('mouseup', handleMouseUpGlobal)
    return () => window.removeEventListener('mouseup', handleMouseUpGlobal)
  }, [])

  return (
    <div className="relative">
      {/* Navigation Arrow - Left side only since it bleeds right */}
      <button
        onClick={goToPrev}
        disabled={currentIndex === 0}
        className="absolute left-4 md:left-8 lg:left-16 top-1/2 -translate-y-1/2 z-10 p-2 bg-white/80 hover:bg-white rounded-full shadow-md disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-5 w-5 text-[#22333b]" />
      </button>
      <button
        onClick={goToNext}
        disabled={currentIndex >= tournamentItems.length - 2}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-2 bg-white/80 hover:bg-white rounded-full shadow-md disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        aria-label="Next slide"
      >
        <ChevronRight className="h-5 w-5 text-[#22333b]" />
      </button>

      {/* Carousel Container - bleeding to the right */}
      <div 
        className="pl-4 md:pl-8 lg:pl-16 xl:pl-24 overflow-hidden cursor-grab active:cursor-grabbing"
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div 
          className="flex gap-4 md:gap-6 transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${currentIndex * (cardWidth + gap)}px)` }}
        >
          {tournamentItems.map((item, index) => (
            <div 
              key={index} 
              className="flex-shrink-0 w-[280px] md:w-[320px] lg:w-[380px]"
            >
              {/* Tournament image */}
              <div className="aspect-[4/3] overflow-hidden">
                <img
                  src={item.src || "/placeholder.svg"}
                  alt={item.alt}
                  className="h-full w-full object-cover hover:scale-105 transition-transform duration-500 pointer-events-none"
                  draggable={false}
                />
              </div>
              {/* Gray placeholder area below image */}
              <div className="bg-[#d9d9d9] h-16 md:h-20"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Dot indicators */}
      <div className="flex justify-center gap-2 mt-6 px-4">
        {tournamentItems.map((_, index) => (
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
