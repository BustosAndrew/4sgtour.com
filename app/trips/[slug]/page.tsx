import { SiteHeaderWrapper } from "@/components/site-header-wrapper"
import { Button } from "@/components/ui/button"
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
    trip.courses_photo_url || `/placeholder.svg?height=600&width=1200&query=golf course ${trip.location}`

  const additionalImages = [trip.double_room_photo_url, trip.single_room_photo_url].filter(Boolean)

  return (
    <div className="min-h-screen bg-background">
      <SiteHeaderWrapper />

      <section className="container px-4 py-4 sm:py-6 sm:px-6 lg:px-8">
        <h1 className="text-xl font-bold text-foreground sm:text-2xl md:text-3xl lg:text-4xl">{trip.title}</h1>
        <p className="mt-1 text-xs text-muted-foreground sm:text-sm md:text-base">{trip.location}</p>

        <div className="mt-4 overflow-hidden rounded-lg sm:mt-6 sm:rounded-xl">
          <img
            src={mainImage || "/placeholder.svg"}
            alt={trip.title}
            className="h-[250px] w-full object-cover sm:h-[350px] md:h-[450px] lg:h-[500px]"
          />
        </div>
      </section>

      <section className="container px-4 py-6 sm:py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
          <div>
            <h2 className="text-lg font-bold text-foreground sm:text-xl md:text-2xl">Overview</h2>
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
          <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:gap-8">
            <ul className="space-y-2">
              {trip.highlights.map((highlight, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-foreground sm:text-base">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground" />
                  {highlight}
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
            <h2 className="text-xl font-bold text-foreground sm:text-2xl md:text-3xl">Book Now</h2>
            <p className="mt-2 text-xs text-muted-foreground sm:text-sm md:text-base">
              Choose your perfect package and start your golf adventure today
            </p>
          </div>

          {trip.packages && trip.packages.length > 0 ? (
            <div
              className={`mt-6 grid gap-4 sm:mt-8 sm:gap-6 lg:gap-8 ${
                trip.packages.length === 1
                  ? "grid-cols-1 mx-auto max-w-md" // Center single package
                  : "sm:grid-cols-2" // Two columns for multiple packages
              }`}
            >
              {trip.packages.map((pkg: any) => {
                const displayName = pkg.name === "Regular" ? "Basic" : pkg.name
                const isPremium = displayName === "Premium"
                const headerBg = isPremium ? "bg-[#d4c5a0]" : "bg-[#c8d5a0]"
                const borderColor = isPremium ? "border-[#d4c5a0]" : "border-[#c8d5a0]"
                const headerText = "text-black"

                return (
                  <div
                    key={pkg.id}
                    className={`flex flex-col overflow-hidden rounded-2xl border-2 ${borderColor} bg-white shadow-lg transition-shadow hover:shadow-xl`}
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

                      <Button asChild className="mt-auto w-full bg-[#a4b96a] text-base text-white hover:bg-[#93a55e]">
                        <Link href={`/trips/${trip.slug}/book?package=${pkg.id}`}>Book Now</Link>
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="mt-6 text-center sm:mt-8">
              <Button asChild size="lg" className="w-full sm:w-auto">
                <Link href={`/trips/${trip.slug}/book`}>Inquire Now</Link>
              </Button>
            </div>
          )}
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}
