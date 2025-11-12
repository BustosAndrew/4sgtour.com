"use client"

import { useRef } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { TripCard } from "@/components/trip-card"
import type { Trip } from "@/lib/types/database"

interface RecommendationsCarouselProps {
  trips: (Trip & { images?: Array<{ image_url: string }> })[]
}

export function RecommendationsCarousel({ trips }: RecommendationsCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const scroll = (direction: "left" | "right") => {
    if (!scrollContainerRef.current) return

    const scrollAmount = 320 // Width of card (280px) + gap (40px)
    const newScrollPosition =
      scrollContainerRef.current.scrollLeft + (direction === "left" ? -scrollAmount : scrollAmount)

    scrollContainerRef.current.scrollTo({
      left: newScrollPosition,
      behavior: "smooth",
    })
  }

  const displayTrips =
    trips.length > 0
      ? trips
      : ([
          {
            id: "placeholder-1",
            destination_id: "placeholder-dest-1",
            title: "Luxury Golf Retreat",
            slug: "luxury-golf-retreat",
            location: "Pebble Beach, CA",
            price_regular: 2500,
            duration_nights: 4,
            max_guests: 4,
            includes_breakfast: true,
            includes_transport: true,
            available_courses: [
              { name: "Pebble Beach Golf Links", price: 595 },
              { name: "Spyglass Hill", price: 425 },
            ],
            description: "Experience world-class golf at iconic Pebble Beach",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            images: [{ image_url: "/placeholder.svg?height=400&width=600" }],
          },
          {
            id: "placeholder-2",
            destination_id: "placeholder-dest-2",
            title: "Scottish Highlands Tour",
            slug: "scottish-highlands-tour",
            location: "St Andrews, Scotland",
            price_regular: 3200,
            duration_nights: 7,
            max_guests: 4,
            includes_breakfast: true,
            includes_transport: true,
            available_courses: [
              { name: "Old Course", price: 295 },
              { name: "New Course", price: 195 },
            ],
            description: "Play the historic courses of Scotland",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            images: [{ image_url: "/placeholder.svg?height=400&width=600" }],
          },
          {
            id: "placeholder-3",
            destination_id: "placeholder-dest-3",
            title: "Desert Golf Experience",
            slug: "desert-golf-experience",
            location: "Scottsdale, AZ",
            price_regular: 1800,
            duration_nights: 3,
            max_guests: 4,
            includes_breakfast: true,
            includes_transport: false,
            available_courses: [
              { name: "TPC Scottsdale", price: 299 },
              { name: "Troon North", price: 275 },
            ],
            description: "Stunning desert landscapes and championship golf",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            images: [{ image_url: "/placeholder.svg?height=400&width=600" }],
          },
          {
            id: "placeholder-4",
            destination_id: "placeholder-dest-4",
            title: "Coastal Golf Paradise",
            slug: "coastal-golf-paradise",
            location: "Monterey, CA",
            price_regular: 2200,
            duration_nights: 5,
            max_guests: 4,
            includes_breakfast: true,
            includes_transport: true,
            available_courses: [
              { name: "Spanish Bay", price: 325 },
              { name: "Poppy Hills", price: 275 },
            ],
            description: "Breathtaking ocean views and pristine fairways",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            images: [{ image_url: "/placeholder.svg?height=400&width=600" }],
          },
        ] as (Trip & { images?: Array<{ image_url: string }> })[])

  return (
    <div className="relative px-12">
      <Button
        variant="outline"
        size="icon"
        onClick={() => scroll("left")}
        className="absolute left-0 top-1/2 z-10 -translate-y-1/2 rounded-full bg-background shadow-lg hover:bg-muted"
        aria-label="Scroll left"
      >
        <ChevronLeft className="h-6 w-6" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={() => scroll("right")}
        className="absolute right-0 top-1/2 z-10 -translate-y-1/2 rounded-full bg-background shadow-lg hover:bg-muted"
        aria-label="Scroll right"
      >
        <ChevronRight className="h-6 w-6" />
      </Button>

      <div
        ref={scrollContainerRef}
        className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide scroll-smooth"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {displayTrips.map((trip) => (
          <div key={trip.id} className="w-[280px] flex-shrink-0">
            <TripCard trip={trip} />
          </div>
        ))}
      </div>
    </div>
  )
}
