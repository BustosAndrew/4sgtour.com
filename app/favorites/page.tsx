import { SiteHeaderWrapper } from "@/components/site-header-wrapper"
import { SiteFooter } from "@/components/site-footer"
import { TripCard } from "@/components/trip-card"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import type { Trip } from "@/lib/types/database"

export default async function FavoritesPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: favorites } = await supabase
    .from("favorites")
    .select(
      `
      trip_id,
      trips(
        *,
        images:trip_images(image_url)
      )
    `,
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  const trips =
    (favorites?.map((f: any) => f.trips).filter(Boolean) as Array<
      Trip & { images?: Array<{ image_url: string }> }
    >) || []

  return (
    <div className="">
      <SiteHeaderWrapper />
      <main className="container px-4 pt-28 pb-8 sm:px-6 lg:px-8 lg:pt-32 min-h-screen">
        <h1 className="mb-8 text-2xl font-semibold sm:text-3xl">
          My Favorites
        </h1>

        {trips.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {trips.map((trip) => (
              <TripCard key={trip.id} trip={trip} isFavorite={true} />
            ))}
          </div>
        ) : (
          <div className="border border-border bg-card p-8 text-center sm:p-12">
            <p className="text-muted-foreground">
              You haven&apos;t added any favorites yet.
            </p>
            <Button asChild className="mt-4">
              <Link href="/">Browse Trips</Link>
            </Button>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  )
}
