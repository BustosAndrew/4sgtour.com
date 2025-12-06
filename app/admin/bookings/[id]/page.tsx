import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/server"
import { getUserType } from "@/lib/supabase/get-user-type"
import { redirect, notFound } from "next/navigation"
import { UpdateBookingStatus } from "@/components/update-booking-status"
import { format } from "date-fns"

interface AdminBookingPageProps {
  params: Promise<{ id: string }>
}

export default async function AdminBookingPage({
  params,
}: AdminBookingPageProps) {
  const { id } = await params
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

  const { data: booking } = await supabase
    .from("bookings")
    .select(
      `
      *,
      trip:trips(title, location, slug),
      user:profiles(email, display_name)
    `,
    )
    .eq("id", id)
    .single()

  if (!booking) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container px-4 py-4 sm:px-6 sm:py-8">
        <div className="mb-4 sm:mb-8">
          <Button variant="ghost" asChild className="text-sm sm:text-base">
            <a href="/admin">← Back to Dashboard</a>
          </Button>
        </div>

        <div className="grid gap-4 sm:gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="rounded-lg border border-border bg-card p-4 sm:p-6">
              <h1 className="mb-4 text-xl font-semibold sm:mb-6 sm:text-2xl">
                Booking Details
              </h1>

              <div className="space-y-4 sm:space-y-6">
                <div>
                  <h3 className="mb-2 font-semibold">Trip Information</h3>
                  <p className="text-lg">{booking.trip?.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {booking.trip?.location}
                  </p>
                </div>

                <div>
                  <h3 className="mb-2 font-semibold">Customer Information</h3>
                  <p>{booking.user?.display_name || "N/A"}</p>
                  <p className="text-sm text-muted-foreground">
                    {booking.user?.email}
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <h3 className="mb-2 font-semibold">Check-in</h3>
                    <p>
                      {format(new Date(booking.start_date), "MMMM d, yyyy")}
                    </p>
                  </div>
                  <div>
                    <h3 className="mb-2 font-semibold">Check-out</h3>
                    <p>{format(new Date(booking.end_date), "MMMM d, yyyy")}</p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <h3 className="mb-2 font-semibold">Room Type</h3>
                    <p className="capitalize">{booking.room_type} Occupancy</p>
                  </div>
                  <div>
                    <h3 className="mb-2 font-semibold">Number of Guests</h3>
                    <p>{booking.num_guests}</p>
                  </div>
                </div>

                <div>
                  <h3 className="mb-2 font-semibold">Golf Courses</h3>
                  {Array.isArray(booking.selected_courses) &&
                  booking.selected_courses.length > 0 ? (
                    <ul className="list-inside list-disc space-y-1">
                      {booking.selected_courses.map(
                        (
                          course: { name: string; price: number },
                          idx: number,
                        ) => (
                          <li key={idx}>
                            {course.name} - ${course.price.toFixed(2)}
                          </li>
                        ),
                      )}
                    </ul>
                  ) : (
                    <p className="text-muted-foreground">No courses selected</p>
                  )}
                </div>

                <div>
                  <h3 className="mb-2 font-semibold">Number of Rounds</h3>
                  <p>{booking.num_rounds}</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <h3 className="mb-2 font-semibold">Breakfast</h3>
                    <p>
                      {booking.includes_breakfast ? "Included" : "Not included"}
                    </p>
                  </div>
                  <div>
                    <h3 className="mb-2 font-semibold">Transportation</h3>
                    <p>
                      {booking.includes_transport
                        ? "Private car with driver"
                        : "Self-drive"}
                    </p>
                  </div>
                </div>

                {booking.additional_requests && (
                  <div>
                    <h3 className="mb-2 font-semibold">Additional Requests</h3>
                    <p className="text-muted-foreground">
                      {booking.additional_requests}
                    </p>
                  </div>
                )}

                <div>
                  <h3 className="mb-2 font-semibold">Booking Date</h3>
                  <p className="text-sm text-muted-foreground">
                    {format(
                      new Date(booking.created_at),
                      "MMMM d, yyyy 'at' h:mm a",
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="rounded-lg border border-border bg-card p-6">
              <h3 className="mb-4 font-semibold">Booking Status</h3>
              <UpdateBookingStatus
                bookingId={booking.id}
                currentStatus={booking.status}
              />

              <div className="mt-6 border-t border-border pt-6">
                <h3 className="mb-4 font-semibold">Payment Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Amount</span>
                    <span className="font-semibold">
                      ${Number(booking.total_price).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
