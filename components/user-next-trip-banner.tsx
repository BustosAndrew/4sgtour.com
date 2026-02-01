import { createClient } from '@/lib/supabase/server'
import { differenceInCalendarDays, format } from 'date-fns'
import { CalendarClock } from 'lucide-react'
import { UserNextTripBannerClient } from '@/components/user-next-trip-banner-client'

// Toggle this to true during development to preview the banner with dummy data
const USE_DUMMY_DATA = false

export async function UserNextTripBanner() {
  if (USE_DUMMY_DATA) {
    const daysUntilNextTrip: number = 14
    const nextTripStart = new Date()

    const message =
      daysUntilNextTrip === 0
        ? 'Your trip starts today!'
        : `Your next trip starts in ${daysUntilNextTrip} day${
            daysUntilNextTrip === 1 ? '' : 's'
          }.`
    const startDateLabel = `Start date: ${format(nextTripStart, 'MMM d, yyyy')}`

    return (
      <UserNextTripBannerClient
        message={message}
        startDateLabel={startDateLabel}
      />
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
    .from('profiles')
    .select('email')
    .eq('id', user.id)
    .single()

  const customerEmail = profile?.email || user.email

  if (!customerEmail) {
    return null
  }

  const { data: inquiries } = await supabase
    .from('inquiries')
    .select('start_date, status')
    .eq('customer_email', customerEmail)

  if (!inquiries || inquiries.length === 0) {
    return null
  }

  const now = new Date()

  const upcoming = inquiries
    .filter((inq) => inq.start_date && inq.status !== 'cancelled')
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

  const message =
    daysUntilNextTrip === 0
      ? 'Your trip starts today!'
      : `Your next trip starts in ${daysUntilNextTrip} day${
          daysUntilNextTrip === 1 ? '' : 's'
        }.`
  const startDateLabel = `Start date: ${format(nextTripStart, 'MMM d, yyyy')}`

  return (
    <UserNextTripBannerClient
      message={message}
      startDateLabel={startDateLabel}
    />
  )
}
