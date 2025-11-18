"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Heart } from 'lucide-react'
import Link from "next/link"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from 'next/navigation'
import type { Trip } from "@/lib/types/database"

interface TripCardProps {
  trip: Trip & { images?: Array<{ image_url: string }> }
  isFavorite?: boolean
}

export function TripCard({ trip, isFavorite = false }: TripCardProps) {
  const [favorite, setFavorite] = useState(isFavorite)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const price = trip.price_regular

  const handleFavoriteToggle = async (e: React.MouseEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const supabase = createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push("/auth/login")
      setIsLoading(false)
      return
    }

    try {
      if (favorite) {
        await supabase.from("favorites").delete().eq("user_id", user.id).eq("trip_id", trip.id)
        setFavorite(false)
      } else {
        await supabase.from("favorites").insert({ user_id: user.id, trip_id: trip.id })
        setFavorite(true)
      }
      router.refresh()
    } catch (error) {
      console.error("Error toggling favorite:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const imageUrl =
    trip.images?.[0]?.image_url || `/placeholder.svg?height=300&width=400&query=golf course ${trip.location}`

  return (
    <Link href={`/trips/${trip.slug}`} className="group block">
      <div className="overflow-hidden rounded-lg border border-border bg-card transition-shadow hover:shadow-md">
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          <img
            src={imageUrl || "/placeholder.svg"}
            alt={trip.title}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        </div>
        <div className="p-3 sm:p-4">
          <p className="text-xs text-muted-foreground sm:text-sm">{trip.location}</p>
          <h3 className="mt-1 text-sm font-semibold text-foreground sm:text-base">{trip.title}</h3>
          <p className="mt-2 text-base font-bold text-foreground sm:text-lg">${price.toFixed(2)}</p>
          <div className="mt-3 flex items-center gap-2 sm:mt-4">
            <Button className="flex-1 text-sm sm:text-base bg-primary text-primary-foreground hover:bg-primary/90">
              Book Now
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleFavoriteToggle}
              disabled={isLoading}
              className="h-9 w-9 shrink-0 bg-transparent sm:h-10 sm:w-10"
            >
              <Heart className={`h-4 w-4 ${favorite ? "fill-current text-red-500" : ""}`} />
            </Button>
          </div>
        </div>
      </div>
    </Link>
  )
}
