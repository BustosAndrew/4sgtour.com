"use client"

import { useState } from "react"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

const CONTINENTS = [
  {
    name: "Africa",
    slug: "africa",
    image: "/placeholder.svg?height=1080&width=1920",
  },
  {
    name: "South America",
    slug: "south-america",
    image: "/placeholder.svg?height=1080&width=1920",
  },
  {
    name: "North America",
    slug: "north-america",
    image: "/placeholder.svg?height=1080&width=1920",
  },
  {
    name: "Asia",
    slug: "asia",
    image: "/placeholder.svg?height=1080&width=1920",
  },
  {
    name: "Europe",
    slug: "europe",
    image: "/placeholder.svg?height=1080&width=1920",
  },
]

type Destination = {
  id: string
  name: string
  continent: string
  country: string
  description: string | null
  image_url: string | null
  slug: string
}

type ContinentsViewProps = {
  destinations: Destination[]
}

export function ContinentsView({ destinations }: ContinentsViewProps) {
  const [selectedContinent, setSelectedContinent] = useState<string | null>(null)

  const filteredDestinations = selectedContinent
    ? destinations.filter((d) => d.continent === selectedContinent && d.continent !== null)
    : []

  if (!selectedContinent) {
    return (
      <div className="relative min-h-screen">
        <div className="absolute left-0 right-0 top-0 z-10 hidden px-4 pt-32 text-center lg:block">
          <h1 className="text-balance text-6xl font-bold leading-tight text-white drop-shadow-lg xl:text-7xl">
            Explore Golf Destinations
          </h1>
          <p className="mx-auto mt-5 max-w-4xl px-2 text-pretty text-xl leading-relaxed text-white drop-shadow-lg xl:text-2xl">
            Choose a continent to discover world-class golf destinations and unforgettable experiences
          </p>
        </div>

        <div className="flex h-screen w-full flex-col lg:flex-row">
          {CONTINENTS.map((continent) => (
            <Link
              key={continent.slug}
              href={`/destinations/${continent.slug}`}
              className="group relative flex-1 overflow-hidden"
            >
              <div className="absolute inset-0 overflow-hidden">
                <img
                  src={continent.image || "/placeholder.svg"}
                  alt={continent.name}
                  className="h-full w-full scale-100 object-cover transition-transform duration-500 ease-out group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-4 text-center sm:p-6 md:p-8">
                <h2 className="text-balance text-xl font-bold text-white drop-shadow-lg sm:text-2xl md:text-3xl lg:text-4xl">
                  {continent.name}
                </h2>
              </div>
            </Link>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <div className="mb-8">
        <Button variant="ghost" onClick={() => setSelectedContinent(null)} className="mb-4">
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Continents
        </Button>

        <div className="text-center">
          <h1 className="text-balance text-4xl font-bold text-foreground">{selectedContinent}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-pretty text-muted-foreground">
            Discover amazing golf destinations in {selectedContinent}
          </p>
        </div>
      </div>

      {filteredDestinations.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredDestinations.map((destination) => (
            <Link
              key={destination.id}
              href={`/destinations/${destination.slug}`}
              className="group block overflow-hidden rounded-2xl border border-border bg-card transition-transform hover:scale-[1.02]"
            >
              <div className="relative h-64 overflow-hidden">
                <img
                  src={
                    destination.image_url ||
                    `/placeholder.svg?height=400&width=600&query=golf+course+${destination.name || "/placeholder.svg"}`
                  }
                  alt={destination.name}
                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-foreground">{destination.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{destination.country}</p>
                {destination.description && (
                  <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{destination.description}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="py-12 text-center">
          <p className="text-muted-foreground">No destinations available in {selectedContinent} yet.</p>
        </div>
      )}
    </div>
  )
}
