import { SiteHeaderWrapper } from "@/components/site-header-wrapper"
import { AnimatedButton } from "@/components/ui/animated-button"
import { AnimatedHr } from "@/components/ui/animated-hr"
import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import Link from "next/link"
import {} from "lucide-react"
import { SiteFooter } from "@/components/site-footer"
import {
  TripImageGallery,
  RoomImageSection,
} from "@/components/trip-image-gallery"
import { getServerTranslations, getServerLocale } from "@/lib/i18n/server"
import { getLocalizedField } from "@/lib/i18n/get-localized-field"
import type { Locale } from "@/lib/i18n/config"

interface TripPageProps {
  params: Promise<{ slug: string }>
}

export default async function TripPage({ params }: TripPageProps) {
  const { slug } = await params
  const supabase = await createClient()
  const t = await getServerTranslations("tripDetails")
  const locale = await getServerLocale()

  const { data: trip, error } = await supabase
    .from("trips")
    .select(
      `
      *,
      destination:destinations!left(name, name_ko, name_de, country, country_ko, country_de),
      packages(id, name, name_ko, name_de, description, description_ko, description_de, price),
      trip_images(id, image_url, display_order)
    `,
    )
    .eq("slug", slug)
    .single()
  
  if (error) {
    console.error("[v0] Error fetching trip:", error)
  }

  if (!trip) {
    notFound()
  }

  const mainImage =
    trip.courses_photo_url ||
    `/placeholder.svg?height=800&width=1920&query=golf course ${trip.location}`

  const tripImages =
    trip.trip_images?.sort(
      (a: any, b: any) => a.display_order - b.display_order,
    ) || []
  const additionalImages =
    tripImages.length > 0
      ? tripImages.map((img: any) => img.image_url)
      : []

  const roomImage = trip.room_photo_url || null

  // Get localized content
  const tripTitle = getLocalizedField(trip, 'title', locale)
  const tripLocation = getLocalizedField(trip, 'location', locale)
  const tripOverview = getLocalizedField(trip, 'overview_content', locale)
  const tripDescription = getLocalizedField(trip, 'description', locale)
  const tripRefundPolicy = getLocalizedField(trip, 'refund_policy', locale)
  const tripHighlights = getLocalizedField(trip, 'highlights', locale, true) as string[] | null

  return (
    <div className="min-h-screen bg-background">
      <SiteHeaderWrapper />

      {/* Hero Section */}
      <section className="relative h-[50vh] sm:h-[60vh] md:h-[70vh] w-full">
        <img
          src={mainImage || "/placeholder.svg"}
          alt={tripTitle}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        <div className="absolute inset-x-0 top-0 pt-24 sm:pt-28 md:pt-32 lg:pt-36">
          <div className="container px-4 sm:px-6 lg:px-8">
            <h1 className="text-2xl font-bold text-white drop-shadow-lg sm:text-3xl md:text-4xl lg:text-5xl">
              {tripTitle}
            </h1>
            <p className="mt-1 text-sm text-white/90 drop-shadow-lg sm:text-base md:text-lg">
              {tripLocation}
            </p>
          </div>
        </div>
      </section>

      <section className="container px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-4">
          {/* Right Column - Inquire Now, Refund Policy, Images */}
          <div className="order-1 lg:order-2 space-y-8">
            {/* Packages / Inquire Now Section - Desktop Only */}
            <div className="hidden lg:block">
              <h2 className="text-xl font-bold text-foreground sm:text-2xl md:text-3xl">
                {t("inquireNow")}
              </h2>
              <div className="mt-2 mb-4">
                <AnimatedHr />
              </div>
              <p className="text-xs text-muted-foreground sm:text-sm md:text-base">
                {t("choosePackage")}
              </p>

              {trip.packages && trip.packages.length > 0 ? (
                <div className="mt-6 space-y-4">
                  {trip.packages.map((pkg: any) => {
                    const isUpgrade = pkg.name === "Upgrade"
                    const pkgName = getLocalizedField(pkg, 'name', locale)

                    return (
                      <div
                        key={pkg.id}
                        className="group flex flex-col gap-4 border-l-[3px] py-4 pl-5 pr-2 transition-colors sm:flex-row sm:items-center sm:justify-between"
                        style={{ borderColor: isUpgrade ? "#274C77" : "#6096BA" }}
                      >
                        <div className="flex-1">
                          <h3 className="font-serif text-lg font-bold text-foreground sm:text-xl">
                            {pkgName}
                          </h3>
                          <p className="mt-1 text-2xl font-bold text-foreground sm:text-3xl">
                            {trip.show_from_price && (
                              <span className="text-sm font-medium text-muted-foreground">
                                {t("from")}{' '}
                              </span>
                            )}
                            ${pkg.price.toFixed(0)}
                          </p>
                        </div>

                        <Link
                          href={`/trips/${trip.slug}/book?package=${pkg.id}`}
                          className="shrink-0"
                        >
                          <AnimatedButton
                            startColor={isUpgrade ? "#274C77" : "#6096BA"}
                            endColor={isUpgrade ? "#1a3a5c" : "#4a7a9e"}
                            hoverText={t("letsGo")}
                            className="w-full sm:w-auto sm:px-8"
                          >
                            {t("inquireNow")}
                          </AnimatedButton>
                        </Link>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="mt-6">
                  <Link href={`/trips/${trip.slug}/book`}>
                    <AnimatedButton
                      startColor="#6096BA"
                      endColor="#4a7a9e"
                      hoverText={t("letsGo")}
                      className="w-full sm:w-auto"
                    >
                      {t("inquireNow")}
                    </AnimatedButton>
                  </Link>
                </div>
              )}
            </div>

            {/* Refund Policy Section - Desktop Only */}
            {tripRefundPolicy && (
              <div className="hidden lg:block">
                <h2 className="text-xl font-bold text-foreground sm:text-2xl md:text-3xl">
                  {t("refundPolicy")}
                </h2>
                <div className="mt-2 mb-4">
                  <AnimatedHr />
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground sm:text-base whitespace-pre-wrap">
                  {tripRefundPolicy}
                </p>
              </div>
            )}

            {additionalImages.length > 0 && (
              <TripImageGallery images={additionalImages} title={tripTitle} />
            )}

            {/* Accommodation Image */}
            {roomImage && (
              <RoomImageSection
                imageUrl={roomImage}
                heading={t("accommodation")}
                title={tripTitle}
              />
            )}
          </div>

          {/* Left Column - Text Content */}
          <div className="order-2 space-y-8 lg:order-1">
            {/* Overview Section */}
            <div>
              <h2 className="text-xl font-bold text-foreground sm:text-2xl md:text-3xl">
                {t("overview")}
              </h2>
              <div className="mt-2 mb-4">
                <AnimatedHr />
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground sm:text-base lg:text-lg whitespace-pre-wrap">
                {tripOverview ||
                  tripDescription ||
                  t("defaultOverview")}
              </p>
            </div>

            {/* Highlights Section */}
            {tripHighlights && tripHighlights.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-foreground sm:text-2xl md:text-3xl">
                  {t("highlights")}
                </h2>
                <div className="mt-2 mb-4">
                  <AnimatedHr />
                </div>
                <ul className="space-y-3">
                  {tripHighlights.map((highlight: string, idx: number) => (
                    <li
                      key={idx}
                      className="flex items-start gap-3 text-sm text-foreground sm:text-base"
                    >
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 bg-foreground" />
                      <span>{highlight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Packages / Inquire Now Section - Mobile Only */}
            <div className="lg:hidden">
              <h2 className="text-xl font-bold text-foreground sm:text-2xl md:text-3xl">
                {t("inquireNow")}
              </h2>
              <div className="mt-2 mb-4">
                <AnimatedHr />
              </div>
              <p className="text-xs text-muted-foreground sm:text-sm md:text-base">
                {t("choosePackage")}
              </p>

              {trip.packages && trip.packages.length > 0 ? (
                <div className="mt-6 space-y-4">
                  {trip.packages.map((pkg: any) => {
                    const isUpgrade = pkg.name === "Upgrade"
                    const pkgName = getLocalizedField(pkg, 'name', locale)

                    return (
                      <div
                        key={pkg.id}
                        className="group flex flex-col gap-4 border-l-[3px] py-4 pl-5 pr-2 transition-colors sm:flex-row sm:items-center sm:justify-between"
                        style={{ borderColor: isUpgrade ? "#274C77" : "#6096BA" }}
                      >
                        <div className="flex-1">
                          <h3 className="font-serif text-lg font-bold text-foreground sm:text-xl">
                            {pkgName}
                          </h3>
                          <p className="mt-1 text-2xl font-bold text-foreground sm:text-3xl">
                            {trip.show_from_price && (
                              <span className="text-sm font-medium text-muted-foreground">
                                {t("from")}{' '}
                              </span>
                            )}
                            ${pkg.price.toFixed(0)}
                          </p>
                        </div>

                        <Link
                          href={`/trips/${trip.slug}/book?package=${pkg.id}`}
                          className="shrink-0"
                        >
                          <AnimatedButton
                            startColor={isUpgrade ? "#274C77" : "#6096BA"}
                            endColor={isUpgrade ? "#1a3a5c" : "#4a7a9e"}
                            hoverText={t("letsGo")}
                            className="w-full sm:w-auto sm:px-8"
                          >
                            {t("inquireNow")}
                          </AnimatedButton>
                        </Link>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="mt-6">
                  <Link href={`/trips/${trip.slug}/book`}>
                    <AnimatedButton
                      startColor="#6096BA"
                      endColor="#4a7a9e"
                      hoverText={t("letsGo")}
                      className="w-full sm:w-auto"
                    >
                      {t("inquireNow")}
                    </AnimatedButton>
                  </Link>
                </div>
              )}
            </div>

            {/* Refund Policy Section - Mobile Only */}
            {tripRefundPolicy && (
              <div className="lg:hidden">
                <h2 className="text-xl font-bold text-foreground sm:text-2xl md:text-3xl">
                  {t("refundPolicy")}
                </h2>
                <div className="mt-2 mb-4">
                  <AnimatedHr />
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground sm:text-base whitespace-pre-wrap">
                  {tripRefundPolicy}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}
