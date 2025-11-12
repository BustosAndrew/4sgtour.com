import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/server"
import { getUserType } from "@/lib/supabase/get-user-type"
import { redirect } from "next/navigation"
import Link from "next/link"
import { RefreshCw, MapPin, ExternalLink } from "lucide-react"

export default async function AdminTripsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const userType = await getUserType()

  if (userType !== "admin") {
    redirect("/")
  }

  const { data: unassignedTrips } = await supabase
    .from("trips")
    .select(`
      *,
      destination:destinations(name)
    `)
    .is("continent", null)
    .eq("is_payment_link_trip", false)
    .order("created_at", { ascending: false })

  const { data: assignedTrips } = await supabase
    .from("trips")
    .select(`
      *,
      destination:destinations(name)
    `)
    .not("continent", "is", null)
    .eq("is_payment_link_trip", false)
    .order("continent", { ascending: true })
    .order("created_at", { ascending: false })

  return (
    <div className="min-h-screen bg-background">
      <main className="container py-8">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Manage Trips</h1>
          <div className="flex gap-2">
            <form action="/api/wetravel/sync" method="POST">
              <Button type="submit" variant="outline">
                <RefreshCw className="mr-2 h-4 w-4" />
                Sync from WeTravel
              </Button>
            </form>
            <Button asChild variant="outline">
              <Link href="/admin">Back to Dashboard</Link>
            </Button>
          </div>
        </div>

        <div className="mb-8 rounded-lg border border-border bg-card">
          <div className="border-b border-border p-6">
            <h2 className="text-lg font-semibold">Unassigned Trips</h2>
            <p className="text-sm text-muted-foreground">Trips synced from WeTravel that need a continent assignment</p>
          </div>
          <div className="divide-y divide-border">
            {unassignedTrips && unassignedTrips.length > 0 ? (
              unassignedTrips.map((trip) => (
                <div key={trip.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{trip.title}</h3>
                        {trip.wetravel_uuid && (
                          <span className="rounded bg-primary/10 px-2 py-0.5 text-xs text-primary">WeTravel</span>
                        )}
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span>{trip.location}</span>
                      </div>
                      {trip.booking_url && (
                        <div className="mt-2 flex items-center gap-4 text-sm">
                          <a
                            href={trip.booking_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-primary hover:underline"
                          >
                            <ExternalLink className="h-3 w-3" />
                            View on WeTravel
                          </a>
                        </div>
                      )}
                    </div>
                    <div className="ml-4 text-right">
                      <p className="font-bold">${Number(trip.price_regular).toFixed(2)}</p>
                      <Button asChild size="sm" className="mt-2">
                        <Link href={`/admin/trips/${trip.id}`}>Assign Continent</Link>
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center text-muted-foreground">
                No unassigned trips. All trips have been organized!
              </div>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card">
          <div className="border-b border-border p-6">
            <h2 className="text-lg font-semibold">Assigned Trips</h2>
            <p className="text-sm text-muted-foreground">Trips organized by continent and visible on the site</p>
          </div>
          <div className="divide-y divide-border">
            {assignedTrips && assignedTrips.length > 0 ? (
              assignedTrips.map((trip) => (
                <div key={trip.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{trip.title}</h3>
                        <span className="rounded bg-secondary px-2 py-0.5 text-xs font-medium">{trip.continent}</span>
                        {trip.wetravel_uuid && (
                          <span className="rounded bg-primary/10 px-2 py-0.5 text-xs text-primary">WeTravel</span>
                        )}
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span>{trip.location}</span>
                      </div>
                      {trip.booking_url && (
                        <div className="mt-2 flex items-center gap-4 text-sm">
                          <a
                            href={trip.booking_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-primary hover:underline"
                          >
                            <ExternalLink className="h-3 w-3" />
                            View on WeTravel
                          </a>
                        </div>
                      )}
                    </div>
                    <div className="ml-4 text-right">
                      <p className="font-bold">${Number(trip.price_regular).toFixed(2)}</p>
                      <Button asChild variant="outline" size="sm" className="mt-2 bg-transparent">
                        <Link href={`/admin/trips/${trip.id}`}>Edit</Link>
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center text-muted-foreground">
                No trips yet. Click "Sync from WeTravel" to import trips.
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
