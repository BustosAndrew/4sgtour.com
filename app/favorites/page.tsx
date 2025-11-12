import { SiteHeader } from "@/components/site-header"
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
    .select(`
      trip_id,
      trip:trips(
        *,
        images:trip_images(image_url)
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  const trips = favorites?.map((f) => f.trip).filter(Boolean) || []

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="container py-8">
        <h1 className="mb-8 text-2xl font-semibold">My Favorites</h1>

        {trips.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {trips.map((trip) => (
              <TripCard
                key={trip.id}
                trip={trip as Trip & { images?: Array<{ image_url: string }> }}
                isFavorite={true}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-card p-12 text-center">
            <p className="text-muted-foreground">You haven&apos;t added any favorites yet.</p>
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
