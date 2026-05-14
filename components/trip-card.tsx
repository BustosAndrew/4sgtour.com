"use client"

import type React from "react"
import Image from "next/image"
import { AnimatedButton } from "@/components/ui/animated-button"
import { Button } from "@/components/ui/button"
import { Heart } from "lucide-react"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import type { Trip } from "@/lib/types/database"
import { useTranslations, useLocale } from "@/lib/i18n/provider"
import { getLocalizedField } from "@/lib/i18n/get-localized-field"

interface TripCardProps {
  trip: Trip & { images?: Array<{ image_url: string }> }
  isFavorite?: boolean
}

export function TripCard({ trip, isFavorite = false }: TripCardProps) {
  const t = useTranslations("tripCard")
  const locale = useLocale()
  const [favorite, setFavorite] = useState(isFavorite)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const upgradePackage = trip.packages?.find((pkg: any) => pkg.name === "Upgrade")
  const premiumPackage = trip.packages?.find((pkg: any) => pkg.name === "Premium")
  const hasBothPackages = upgradePackage && premiumPackage

  const handleFavoriteToggle = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
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

  const handleCardClick = () => {
    router.push(`/trips/${trip.slug}`)
  }

  const handlePackageClick = (e: React.MouseEvent, packageId: string) => {
    e.preventDefault()
    e.stopPropagation()
    router.push(`/trips/${trip.slug}/book?package=${packageId}`)
  }

  // Get localized title and location
  const tripTitle = getLocalizedField(trip as any, 'title', locale) as string
  const tripLocation = getLocalizedField(trip as any, 'location', locale) as string

  const imageUrl = trip.courses_photo_url || `/placeholder.svg?height=300&width=400&query=golf course ${tripLocation}`

  return (
    <div onClick={handleCardClick} className="group block cursor-pointer">
      <div className="overflow-hidden border border-border bg-card transition-shadow hover:shadow-md">
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          <Image
            src={imageUrl}
            alt={tripTitle}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        </div>
        <div className="p-3 sm:p-4">
          <p className="text-xs text-muted-foreground sm:text-sm">{tripLocation}</p>
          <h3 className="mt-1 text-sm font-semibold text-foreground sm:text-base min-h-[2.5rem] sm:min-h-[3rem] line-clamp-2">{tripTitle}</h3>

          <div className="mt-2 flex items-center gap-3">
            {hasBothPackages ? (
              <>
                <p className="text-base font-bold text-[#6096BA] sm:text-lg">
                {trip.show_from_price && <span className="text-xs font-semibold sm:text-sm">{t("from")} </span>}
                ${Number(premiumPackage.price).toFixed(2)}
                </p>
                <p className="text-base font-bold text-[#274C77] sm:text-lg">
                  {trip.show_from_price && <span className="text-xs font-semibold sm:text-sm">{t("from")} </span>}
                  ${Number(upgradePackage.price).toFixed(2)}
                </p>
              </>
            ) : (
              <p className="text-base font-bold text-foreground sm:text-lg">
                {trip.show_from_price && <span className="text-xs font-semibold sm:text-sm">{t("from")} </span>}
                {trip.packages && trip.packages.length > 0
                  ? `$${Number(trip.packages[0].price).toFixed(2)}`
                  : `$${trip.price_regular?.toFixed(2) || "0.00"}`}
              </p>
            )}
          </div>

          <div className="mt-3 flex items-center gap-2 sm:mt-4">
            {hasBothPackages ? (
              <>
                <AnimatedButton
                  startColor="#6096BA"
                  endColor="#4a7a9e"
                  hoverText={t("inquire")}
                  className="flex-1 text-white text-sm sm:text-base py-2"
                  onClick={(e) => handlePackageClick(e, premiumPackage.id)}
                >
                  {t("premium")}
                </AnimatedButton>
                <AnimatedButton
                  startColor="#274C77"
                  endColor="#1a3a5c"
                  hoverText={t("inquire")}
                  className="flex-1 text-white text-sm sm:text-base py-2"
                  onClick={(e) => handlePackageClick(e, upgradePackage.id)}
                >
                  {t("upgrade")}
                </AnimatedButton>
              </>
            ) : (
              <AnimatedButton
                startColor="#6096BA"
                endColor="#4a7a9e"
                hoverText={t("inquire")}
                className="flex-1 text-white text-sm sm:text-base py-2"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  router.push(`/trips/${trip.slug}/book`)
                }}
              >
                {t("inquireNow")}
              </AnimatedButton>
            )}
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
    </div>
  )
}
