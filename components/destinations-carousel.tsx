'use client'

import React from 'react'

import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const destinationImages = [
  {
    src: '/placeholder.svg?height=400&width=600&query=golf+course+scotland+castle',
    alt: 'Scotland golf course',
  },
  {
    src: '/placeholder.svg?height=400&width=600&query=golf+course+aerial+ocean',
    alt: 'Aerial ocean golf course',
  },
  {
    src: '/placeholder.svg?height=400&width=600&query=golf+course+sunset+fairway',
    alt: 'Sunset fairway',
  },
  {
    src: '/placeholder.svg?height=400&width=600&query=golf+course+ireland+links',
    alt: 'Ireland links',
  },
  {
    src: '/placeholder.svg?height=400&width=600&query=golf+course+mountains',
    alt: 'Mountain golf course',
  },
]

export function DestinationsCarousel() {
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
    setCurrentIndex((prev) => Math.min(destinationImages.length - 1, prev + 1))
  }

  // Touch/drag handling for desktop
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
    if (newIndex >= 0 && newIndex < destinationImages.length) {
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
      {/* Navigation Arrows */}
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
        disabled={currentIndex >= destinationImages.length - 2}
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
          style={{
            transform: `translateX(-${currentIndex * (cardWidth + gap)}px)`,
          }}
        >
          {destinationImages.map((image, index) => (
            <div
              key={index}
              className="flex-shrink-0 w-[280px] md:w-[320px] lg:w-[380px]"
            >
              <div className="aspect-[4/3] overflow-hidden">
                <img
                  src={image.src || '/placeholder.svg'}
                  alt={image.alt}
                  className="h-full w-full object-cover hover:scale-105 transition-transform duration-500 pointer-events-none"
                  draggable={false}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dot indicators */}
      <div className="flex justify-center gap-2 mt-6 px-4">
        {destinationImages.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-2 h-2 rounded-full transition-colors ${
              index === currentIndex ? 'bg-[#735c38]' : 'bg-[#d9d9d9]'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  )
}
