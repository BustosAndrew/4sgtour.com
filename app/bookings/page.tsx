import { SiteHeaderWrapper } from "@/components/site-header-wrapper"
import { SiteFooter } from "@/components/site-footer"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/server"
import { redirect } from 'next/navigation'
import { format } from "date-fns"
import { CheckCircle2 } from 'lucide-react'
import Link from "next/link"

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: bookings } = await supabase
    .from("bookings")
    .select(`
      *,
      trip:trips(title, location, slug)
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  return (
    <div className="min-h-screen">
      <SiteHeaderWrapper />
      <main className="container px-4 py-8 sm:px-6 lg:px-8">
        {params.success === "true" && (
          <div className="mb-8 rounded-lg border border-primary/20 bg-primary/10 p-4 sm:p-6">
            <div className="flex items-start gap-4">
              <CheckCircle2 className="h-6 w-6 flex-shrink-0 text-primary" />
              <div>
                <h2 className="font-semibold text-foreground">Booking Confirmed!</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Your reservation has been successfully submitted. We&apos;ll send you a confirmation email shortly.
                </p>
              </div>
            </div>
          </div>
        )}

        <h1 className="mb-8 text-2xl font-semibold sm:text-3xl">My Bookings</h1>

        {bookings && bookings.length > 0 ? (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <div key={booking.id} className="rounded-lg border border-border bg-card p-4 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{booking.trip?.title}</h3>
                    <p className="text-sm text-muted-foreground">{booking.trip?.location}</p>
                    <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                      <div>
                        <span className="text-muted-foreground">Check-in:</span>{" "}
                        <span className="font-medium">{format(new Date(booking.start_date), "MMM d, yyyy")}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Check-out:</span>{" "}
                        <span className="font-medium">{format(new Date(booking.end_date), "MMM d, yyyy")}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Room:</span>{" "}
                        <span className="font-medium capitalize">{booking.room_type} Occupancy</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Rounds:</span>{" "}
                        <span className="font-medium">{booking.num_rounds}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:ml-4 sm:flex-col sm:items-end sm:text-right">
                    <div className="mb-0 sm:mb-2">
                      <span
                        className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
                          booking.status === "confirmed"
                            ? "bg-primary/10 text-primary"
                            : booking.status === "cancelled"
                              ? "bg-destructive/10 text-destructive"
                              : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                      </span>
                    </div>
                    <p className="text-lg font-bold sm:text-xl">${booking.total_price.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-card p-8 text-center sm:p-12">
            <p className="text-muted-foreground">You don&apos;t have any bookings yet.</p>
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
