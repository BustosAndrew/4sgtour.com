"use client"

import { useRef } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import type { Trip } from "@/lib/types/database"

interface RecommendationsCarouselProps {
  trips: (Trip & { images?: Array<{ image_url: string }> })[]
}

export function RecommendationsCarousel({ trips }: RecommendationsCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const scroll = (direction: "left" | "right") => {
    if (!scrollContainerRef.current) return

    const scrollAmount = 320 // Width of image (280px) + gap (40px)
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
            title: "Luxury Golf Retreat",
            slug: "luxury-golf-retreat",
            courses_photo_url: "/placeholder.svg?height=400&width=400",
          },
          {
            id: "placeholder-2",
            title: "Scottish Highlands Tour",
            slug: "scottish-highlands-tour",
            courses_photo_url: "/placeholder.svg?height=400&width=400",
          },
          {
            id: "placeholder-3",
            title: "Desert Golf Experience",
            slug: "desert-golf-experience",
            courses_photo_url: "/placeholder.svg?height=400&width=400",
          },
          {
            id: "placeholder-4",
            title: "Coastal Golf Paradise",
            slug: "coastal-golf-paradise",
            courses_photo_url: "/placeholder.svg?height=400&width=400",
          },
        ] as Trip[])

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
          <Link key={trip.id} href={`/trips/${trip.slug}`} className="group w-[280px] flex-shrink-0">
            <div className="relative aspect-square overflow-hidden rounded-lg transition-transform group-hover:scale-105">
              <img
                src={trip.courses_photo_url || "/placeholder.svg?height=400&width=400&query=golf+course"}
                alt={trip.title}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
