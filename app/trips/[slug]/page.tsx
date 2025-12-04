import { SiteHeaderWrapper } from "@/components/site-header-wrapper"
import { AnimatedButton } from "@/components/ui/animated-button"
import { AnimatedHr } from "@/components/ui/animated-hr"
import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Check, X } from "lucide-react"
import { SiteFooter } from "@/components/site-footer"

interface TripPageProps {
  params: Promise<{ slug: string }>
}

export default async function TripPage({ params }: TripPageProps) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: trip } = await supabase
    .from("trips")
    .select(`
      *,
      destination:destinations(name, country),
      packages(id, name, description, price)
    `)
    .eq("slug", slug)
    .single()

  if (!trip) {
    notFound()
  }

  const mainImage =
    trip.courses_photo_url || `/placeholder.svg?height=800&width=1920&query=golf course ${trip.location}`

  const additionalImages = [trip.double_room_photo_url, trip.single_room_photo_url].filter(Boolean)

  return (
    <div className="min-h-screen bg-background">
      <SiteHeaderWrapper />

      <section className="relative h-[50vh] sm:h-[60vh] md:h-[70vh] w-full">
        <img src={mainImage || "/placeholder.svg"} alt={trip.title} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        <div className="absolute left-0 top-0 p-4 pt-24 sm:p-6 sm:pt-28 md:p-8 md:pt-32 lg:p-12 lg:pt-36">
          <h1 className="text-2xl font-bold text-white drop-shadow-lg sm:text-3xl md:text-4xl lg:text-5xl">
            {trip.title}
          </h1>
          <p className="mt-1 text-sm text-white/90 drop-shadow-lg sm:text-base md:text-lg">{trip.location}</p>
        </div>
      </section>

      <section className="container px-4 py-6 sm:py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
          <div>
            <h2 className="text-lg font-bold text-foreground sm:text-xl md:text-2xl">Overview</h2>
            <AnimatedHr maxWidth="100%" />
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:mt-4 sm:text-base">
              {trip.overview_content ||
                trip.description ||
                "Experience an unforgettable golf adventure at this premier destination. With world-class facilities, stunning views, and exceptional service, this course offers everything you need for the perfect golf getaway. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."}
            </p>
          </div>
          {additionalImages[0] && (
            <div className="overflow-hidden rounded-lg sm:rounded-xl">
              <img
                src={additionalImages[0] || "/placeholder.svg"}
                alt={`${trip.title} view`}
                className="h-[200px] w-full object-cover sm:h-[250px] md:h-[300px]"
              />
            </div>
          )}
        </div>
      </section>

      {trip.highlights && trip.highlights.length > 0 && (
        <section className="container px-4 py-6 sm:py-8 sm:px-6 lg:px-8">
          <h2 className="text-lg font-bold text-foreground sm:text-xl md:text-2xl">Highlights</h2>
          <AnimatedHr maxWidth="100%" />
          <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:gap-8">
            <ul className="space-y-2">
              {trip.highlights.map((highlight: string, idx: number) => (
                <li key={idx} className="flex items-center gap-3 text-sm text-foreground sm:text-base">
                  <span className="h-2 w-2 shrink-0 rounded-full bg-foreground" />
                  <span>{highlight}</span>
                </li>
              ))}
            </ul>
            {additionalImages.length > 1 && (
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {additionalImages.slice(1, 3).map((img, idx) => (
                  <div key={idx} className="overflow-hidden rounded-lg sm:rounded-xl">
                    <img
                      src={img || "/placeholder.svg"}
                      alt={`${trip.title} highlight ${idx + 1}`}
                      className="h-[100px] w-full object-cover sm:h-[120px] md:h-[150px]"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      <section className="bg-muted/30 py-8 sm:py-10 md:py-12">
        <div className="container px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-xl font-bold text-foreground sm:text-2xl md:text-3xl">Inquire Now</h2>
            <p className="mt-2 text-xs text-muted-foreground sm:text-sm md:text-base">
              Choose your perfect package and start your golf adventure today
            </p>
          </div>

          {trip.packages && trip.packages.length > 0 ? (
            <div
              className={`mt-6 grid gap-4 sm:mt-8 sm:gap-6 lg:gap-8 justify-center ${
                trip.packages.length === 1 ? "grid-cols-1" : "sm:grid-cols-2"
              }`}
            >
              {trip.packages.map((pkg: any) => {
                const displayName = pkg.name === "Basic" ? "Premium" : pkg.name === "Premium" ? "Upgrade" : pkg.name
                const isUpgrade = pkg.name === "Premium"
                const isPremium = pkg.name === "Basic"
                const headerBg = isUpgrade ? "bg-[#274C77]" : "bg-[#6096BA]"
                const borderColor = isUpgrade ? "border-[#274C77]" : "border-[#6096BA]"
                const headerText = "text-white"

                return (
                  <div
                    key={pkg.id}
                    className={`flex flex-col overflow-hidden rounded-2xl border-2 ${borderColor} bg-white shadow-lg transition-shadow hover:shadow-xl max-w-[290px] mx-auto w-full`}
                  >
                    <div className={`${headerBg} px-6 py-6 text-center`}>
                      <h3 className={`text-xl font-bold ${headerText} sm:text-2xl`}>{displayName}</h3>
                    </div>

                    <div className="flex flex-1 flex-col p-6">
                      <p className="mb-6 text-center text-3xl font-bold text-foreground sm:text-4xl">
                        ${pkg.price.toFixed(0)}
                      </p>

                      {pkg.description && (
                        <div className="mb-6 space-y-3">
                          {pkg.description.split("\n").map((item: string, idx: number) => {
                            const isIncluded = !item.trim().toLowerCase().startsWith("no ")
                            const text = item.replace(/^no /i, "").trim()
                            return (
                              <div key={idx} className="flex items-start gap-3 text-sm sm:text-base">
                                {isIncluded ? (
                                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
                                ) : (
                                  <X className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
                                )}
                                <span className={isIncluded ? "text-foreground" : "text-muted-foreground"}>{text}</span>
                              </div>
                            )
                          })}
                        </div>
                      )}

                      <Link href={`/trips/${trip.slug}/book?package=${pkg.id}`} className="mt-auto w-full">
                        <AnimatedButton
                          startColor={isUpgrade ? "#274C77" : "#6096BA"}
                          endColor={isUpgrade ? "#1a3a5c" : "#4a7a9e"}
                          hoverText="Let's Go!"
                          className="w-full"
                        >
                          Inquire Now
                        </AnimatedButton>
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="mt-6 text-center sm:mt-8">
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
      </section>

      <SiteFooter />
    </div>
  )
}
