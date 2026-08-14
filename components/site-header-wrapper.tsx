import { createClient } from "@/lib/supabase/server"
import { SiteHeader } from "@/components/site-header"
import { differenceInCalendarDays, format } from "date-fns"
import { getServerLocale, getServerMessages } from "@/lib/i18n/server"

// This component renders on every page. It used to statically import all
// three message files (~149 KB of JSON) just to read a few `nav` strings,
// which had to be parsed on every cold start; `getServerMessages` loads
// only the visitor's locale.

async function SiteHeaderAsync() {
  const supabase = await createClient()
  const currentLocale = await getServerLocale()

  let user = null
  let userType = "regular"
  let tripMessage: string | null = null
  let tripDateLabel: string | null = null

  try {
    const { data, error } = await supabase.auth.getUser()

    if (!error && data.user) {
      user = data.user
      const { data: profile } = await supabase
        .from("profiles")
        .select("user_type, email")
        .eq("id", user.id)
        .single()
      if (profile) {
        userType = profile.user_type
      }

      // Fetch next trip data. Previously this pulled every inquiry ever
      // filed under the customer's email and picked the nearest one in
      // JS; the database can do that with an index and hand back a
      // single row.
      const customerEmail = profile?.email || user.email
      if (customerEmail) {
        const today = new Date().toISOString().split("T")[0]
        const { data: inquiries } = await supabase
          .from("inquiries")
          .select("start_date, status")
          .eq("customer_email", customerEmail)
          .gte("start_date", today)
          // A null status is not a cancellation — `.neq()` alone would
          // drop those rows, since NULL <> 'cancelled' is NULL in SQL.
          .or("status.is.null,status.neq.cancelled")
          .order("start_date", { ascending: true })
          .limit(1)

        const nearestInquiry = inquiries?.[0]
        if (nearestInquiry?.start_date) {
          const start = new Date(nearestInquiry.start_date as string)
          const daysUntil = differenceInCalendarDays(start, new Date())

          if (daysUntil >= 0) {
            const messages = await getServerMessages(currentLocale)
            const navMessages = messages.nav
            if (daysUntil === 0) {
              tripMessage = navMessages.tripStartsToday
            } else if (daysUntil === 1) {
              tripMessage = navMessages.nextTripInOneDay
            } else {
              tripMessage = navMessages.nextTripInDays.replace("{days}", String(daysUntil))
            }
            tripDateLabel = format(start, "MMM d, yyyy")
          }
        }
      }
    }
  } catch (error) {
    console.error("[v0] Auth error in header:", error)
  }

  return (
    <SiteHeader
      user={user}
      userType={userType}
      tripMessage={tripMessage}
      tripDateLabel={tripDateLabel}
      currentLocale={currentLocale}
    />
  )
}

// Wrapper to fix TypeScript async component error
export function SiteHeaderWrapper() {
  // @ts-expect-error Async Server Component
  return <SiteHeaderAsync />
}
