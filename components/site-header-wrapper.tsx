import { createClient } from "@/lib/supabase/server"
import { SiteHeader } from "@/components/site-header"
import { differenceInCalendarDays, format } from "date-fns"
import { getServerLocale } from "@/lib/i18n/server"
import type { Locale } from "@/lib/i18n/config"
import en from "@/messages/en.json"
import ko from "@/messages/ko.json"
import de from "@/messages/de.json"

const messages: Record<string, typeof en> = { en, ko, de }

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

      // Fetch next trip data
      const customerEmail = profile?.email || user.email
      if (customerEmail) {
        const { data: inquiries } = await supabase
          .from("inquiries")
          .select("start_date, status")
          .eq("customer_email", customerEmail)

        if (inquiries && inquiries.length > 0) {
          const now = new Date()
          const upcoming = inquiries
            .filter((inq) => inq.start_date && inq.status !== "cancelled")
            .map((inq) => {
              const start = new Date(inq.start_date as string)
              return { start, daysUntil: differenceInCalendarDays(start, now) }
            })
            .filter((item) => item.daysUntil >= 0)

          if (upcoming.length > 0) {
            const nearest = upcoming.reduce(
              (min, item) => (item.daysUntil < min.daysUntil ? item : min),
              upcoming[0]
            )
            const navMessages = (messages[currentLocale] ?? en).nav
            if (nearest.daysUntil === 0) {
              tripMessage = navMessages.tripStartsToday
            } else if (nearest.daysUntil === 1) {
              tripMessage = navMessages.nextTripInOneDay
            } else {
              tripMessage = navMessages.nextTripInDays.replace("{days}", String(nearest.daysUntil))
            }
            tripDateLabel = format(nearest.start, "MMM d, yyyy")
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
