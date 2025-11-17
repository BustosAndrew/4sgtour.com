import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/server"
import { getUserType } from "@/lib/supabase/get-user-type"
import { redirect } from 'next/navigation'
import Link from "next/link"
import { MapPin, Plus } from 'lucide-react'

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
    .order("created_at", { ascending: false })

  const { data: assignedTrips } = await supabase
    .from("trips")
    .select(`
      *,
      destination:destinations(name)
    `)
    .not("continent", "is", null)
    .order("continent", { ascending: true })
    .order("created_at", { ascending: false })

  return (
    <div className="min-h-screen bg-background">
      <main className="container px-4 py-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-semibold">Manage Trips</h1>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button asChild className="w-full sm:w-auto">
              <Link href="/admin/trips/new">
                <Plus className="mr-2 h-4 w-4" />
                Create New Trip
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full sm:w-auto">
              <Link href="/admin">Back to Dashboard</Link>
            </Button>
          </div>
        </div>

        <div className="mb-8 rounded-lg border border-border bg-card">
          <div className="border-b border-border p-4 sm:p-6">
            <h2 className="text-lg font-semibold">Unassigned Trips</h2>
            <p className="text-sm text-muted-foreground">Trips that need a continent assignment</p>
          </div>
          <div className="divide-y divide-border">
            {unassignedTrips && unassignedTrips.length > 0 ? (
              unassignedTrips.map((trip) => (
                <div key={trip.id} className="p-4 sm:p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{trip.title}</h3>
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span>{trip.location}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:ml-4 sm:flex-col sm:items-end sm:text-right">
                      <p className="font-bold">${Number(trip.price_regular).toFixed(2)}</p>
                      <Button asChild size="sm" className="mt-0 sm:mt-2">
                        <Link href={`/admin/trips/${trip.id}`}>Assign Continent</Link>
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-muted-foreground sm:p-12">
                No unassigned trips. All trips have been organized!
              </div>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card">
          <div className="border-b border-border p-4 sm:p-6">
            <h2 className="text-lg font-semibold">Assigned Trips</h2>
            <p className="text-sm text-muted-foreground">Trips organized by continent and visible on the site</p>
          </div>
          <div className="divide-y divide-border">
            {assignedTrips && assignedTrips.length > 0 ? (
              assignedTrips.map((trip) => (
                <div key={trip.id} className="p-4 sm:p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold">{trip.title}</h3>
                        <span className="rounded bg-secondary px-2 py-0.5 text-xs font-medium">{trip.continent}</span>
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span>{trip.location}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:ml-4 sm:flex-col sm:items-end sm:text-right">
                      <p className="font-bold">${Number(trip.price_regular).toFixed(2)}</p>
                      <Button asChild variant="outline" size="sm" className="mt-0 bg-transparent sm:mt-2">
                        <Link href={`/admin/trips/${trip.id}`}>Edit</Link>
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-muted-foreground sm:p-12">
                No trips yet. Click "Create New Trip" to add your first trip.
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
