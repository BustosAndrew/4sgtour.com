import { createClient } from "@/lib/supabase/server"
import { differenceInCalendarDays, format } from "date-fns"
import { CalendarClock } from "lucide-react"

// Toggle this to true during development to preview the banner with dummy data
const USE_DUMMY_DATA = false

export async function UserNextTripBanner() {
  if (USE_DUMMY_DATA) {
    const daysUntilNextTrip: number = 14
    const nextTripStart = new Date()

    return (
      <div className="mt-[70px] lg:mt-[87px] sticky top-[70px] lg:top-[87px] z-40 border-b border-border bg-white">
        <div className="container px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center">
            <div className="flex items-start gap-3 text-center sm:text-left">
              <div className="mt-0.5 rounded-full bg-primary/10 p-2">
                <CalendarClock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {daysUntilNextTrip === 0
                    ? "Your trip starts today!"
                    : `Your next trip starts in ${daysUntilNextTrip} day${
                        daysUntilNextTrip === 1 ? "" : "s"
                      }.`}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Start date: {format(nextTripStart, "MMM d, yyyy")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // Get email from profile if present, otherwise fall back to auth user email
  const { data: profile } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", user.id)
    .single()

  const customerEmail = profile?.email || user.email

  if (!customerEmail) {
    return null
  }

  const { data: inquiries } = await supabase
    .from("inquiries")
    .select("start_date, status")
    .eq("customer_email", customerEmail)

  if (!inquiries || inquiries.length === 0) {
    return null
  }

  const now = new Date()

  const upcoming = inquiries
    .filter((inq) => inq.start_date && inq.status !== "cancelled")
    .map((inq) => {
      const start = new Date(inq.start_date as string)
      return {
        start,
        daysUntil: differenceInCalendarDays(start, now),
      }
    })
    .filter((item) => item.daysUntil >= 0)

  if (upcoming.length === 0) {
    return null
  }

  const nearest = upcoming.reduce(
    (min, item) => (item.daysUntil < min.daysUntil ? item : min),
    upcoming[0],
  )

  const daysUntilNextTrip = nearest.daysUntil
  const nextTripStart = nearest.start

  return (
    <div className="mt-[70px] lg:mt-[87px] sticky top-[70px] lg:top-[87px] z-40 border-b border-border bg-white">
      <div className="container px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center">
          <div className="flex items-start gap-3 text-center sm:text-left">
            <div className="mt-0.5 rounded-full bg-primary/10 p-2">
              <CalendarClock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                {daysUntilNextTrip === 0
                  ? "Your trip starts today!"
                  : `Your next trip starts in ${daysUntilNextTrip} day${
                      daysUntilNextTrip === 1 ? "" : "s"
                    }.`}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Start date: {format(nextTripStart, "MMM d, yyyy")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
