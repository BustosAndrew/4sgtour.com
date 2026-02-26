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

interface TripPageProps {
  params: Promise<{ slug: string }>
}

export default async function TripPage({ params }: TripPageProps) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: trip } = await supabase
    .from("trips")
    .select(
      `
      *,
      destination:destinations(name, country),
      packages(id, name, description, price),
      trip_images(id, image_url, display_order)
    `,
    )
    .eq("slug", slug)
    .single()

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

  return (
    <div className="min-h-screen bg-background">
      <SiteHeaderWrapper />

      {/* Hero Section */}
      <section className="relative h-[50vh] sm:h-[60vh] md:h-[70vh] w-full">
        <img
          src={mainImage || "/placeholder.svg"}
          alt={trip.title}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        <div className="absolute inset-x-0 top-0 pt-24 sm:pt-28 md:pt-32 lg:pt-36">
          <div className="container px-4 sm:px-6 lg:px-8">
            <h1 className="text-2xl font-bold text-white drop-shadow-lg sm:text-3xl md:text-4xl lg:text-5xl">
              {trip.title}
            </h1>
            <p className="mt-1 text-sm text-white/90 drop-shadow-lg sm:text-base md:text-lg">
              {trip.location}
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
                Inquire Now
              </h2>
              <div className="mt-2 mb-4">
                <AnimatedHr />
              </div>
              <p className="text-xs text-muted-foreground sm:text-sm md:text-base">
                Choose your perfect package and start your golf adventure today
              </p>

              {trip.packages && trip.packages.length > 0 ? (
                <div className="mt-6 space-y-4">
                  {trip.packages.map((pkg: any) => {
                    const isUpgrade = pkg.name === "Upgrade"

                    return (
                      <div
                        key={pkg.id}
                        className="group flex flex-col gap-4 border-l-[3px] py-4 pl-5 pr-2 transition-colors sm:flex-row sm:items-center sm:justify-between"
                        style={{ borderColor: isUpgrade ? "#274C77" : "#6096BA" }}
                      >
                        <div className="flex-1">
                          <h3 className="font-serif text-lg font-bold text-foreground sm:text-xl">
                            {pkg.name}
                          </h3>
                          <p className="mt-1 text-2xl font-bold text-foreground sm:text-3xl">
                            {trip.show_from_price && (
                              <span className="text-sm font-medium text-muted-foreground">
                                {'From '}
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
                            hoverText="Let's Go!"
                            className="w-full sm:w-auto sm:px-8"
                          >
                            Inquire Now
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
                      hoverText="Let's Go!"
                      className="w-full sm:w-auto"
                    >
                      Inquire Now
                    </AnimatedButton>
                  </Link>
                </div>
              )}
            </div>

            {/* Refund Policy Section - Desktop Only */}
            {trip.refund_policy && (
              <div className="hidden lg:block">
                <h2 className="text-xl font-bold text-foreground sm:text-2xl md:text-3xl">
                  Refund Policy
                </h2>
                <div className="mt-2 mb-4">
                  <AnimatedHr />
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground sm:text-base whitespace-pre-wrap">
                  {trip.refund_policy}
                </p>
              </div>
            )}

            {additionalImages.length > 0 && (
              <TripImageGallery images={additionalImages} title={trip.title} />
            )}

            {/* Accommodation Image */}
            {roomImage && (
              <RoomImageSection
                imageUrl={roomImage}
                heading="Accommodation"
                title={trip.title}
              />
            )}
          </div>

          {/* Left Column - Text Content */}
          <div className="order-2 space-y-8 lg:order-1">
            {/* Overview Section */}
            <div>
              <h2 className="text-xl font-bold text-foreground sm:text-2xl md:text-3xl">
                Overview
              </h2>
              <div className="mt-2 mb-4">
                <AnimatedHr />
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground sm:text-base lg:text-lg whitespace-pre-wrap">
                {trip.overview_content ||
                  trip.description ||
                  "Experience an unforgettable golf adventure at this premier destination. With world-class facilities, stunning views, and exceptional service, this course offers everything you need for the perfect golf getaway."}
              </p>
            </div>

            {/* Highlights Section */}
            {trip.highlights && trip.highlights.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-foreground sm:text-2xl md:text-3xl">
                  Highlights
                </h2>
                <div className="mt-2 mb-4">
                  <AnimatedHr />
                </div>
                <ul className="space-y-3">
                  {trip.highlights.map((highlight: string, idx: number) => (
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
                Inquire Now
              </h2>
              <div className="mt-2 mb-4">
                <AnimatedHr />
              </div>
              <p className="text-xs text-muted-foreground sm:text-sm md:text-base">
                Choose your perfect package and start your golf adventure today
              </p>

              {trip.packages && trip.packages.length > 0 ? (
                <div className="mt-6 space-y-4">
                  {trip.packages.map((pkg: any) => {
                    const isUpgrade = pkg.name === "Upgrade"

                    return (
                      <div
                        key={pkg.id}
                        className="group flex flex-col gap-4 border-l-[3px] py-4 pl-5 pr-2 transition-colors sm:flex-row sm:items-center sm:justify-between"
                        style={{ borderColor: isUpgrade ? "#274C77" : "#6096BA" }}
                      >
                        <div className="flex-1">
                          <h3 className="font-serif text-lg font-bold text-foreground sm:text-xl">
                            {pkg.name}
                          </h3>
                          <p className="mt-1 text-2xl font-bold text-foreground sm:text-3xl">
                            {trip.show_from_price && (
                              <span className="text-sm font-medium text-muted-foreground">
                                {'From '}
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
                            hoverText="Let's Go!"
                            className="w-full sm:w-auto sm:px-8"
                          >
                            Inquire Now
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
                      hoverText="Let's Go!"
                      className="w-full sm:w-auto"
                    >
                      Inquire Now
                    </AnimatedButton>
                  </Link>
                </div>
              )}
            </div>

            {/* Refund Policy Section - Mobile Only */}
            {trip.refund_policy && (
              <div className="lg:hidden">
                <h2 className="text-xl font-bold text-foreground sm:text-2xl md:text-3xl">
                  Refund Policy
                </h2>
                <div className="mt-2 mb-4">
                  <AnimatedHr />
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground sm:text-base whitespace-pre-wrap">
                  {trip.refund_policy}
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
