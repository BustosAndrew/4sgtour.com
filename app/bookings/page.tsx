import { SiteHeaderWrapper } from "@/components/site-header-wrapper"
import { SiteFooter } from "@/components/site-footer"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { BookingsContent } from "@/components/bookings/bookings-content"

// Paid (or once-paid) bookings, plus bank payments still clearing. 'pending'
// rows are checkouts that were opened but not (yet) paid, and 'expired' /
// 'failed' ones never completed — none of those is a booking.
const VISIBLE_BOOKING_STATUSES = ["processing", "confirmed", "completed", "cancelled", "refunded"]

const BOOKING_COLUMNS = `
  id, created_at, status, trip_id, trip_title, booking_details,
  total_price, total_package_price, total_paid, remaining_balance,
  remaining_balance_charged, auto_charge_date, trip_start_date,
  stripe_checkout_session_id, inquiry_id,
  trip:trips(slug)
`

// Escape LIKE wildcards so an address such as first_last@x.com matches only
// itself. ilike (not eq) because guests type their email in any case.
function escapeLike(value: string) {
  return value.replace(/[\\%_]/g, (c) => `\\${c}`)
}

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

  const { data: profile } = await supabase
    .from("profiles")
    .select("email, display_name")
    .eq("id", user.id)
    .single()

  const { data: inquiries } = await supabase
    .from("inquiries")
    .select("*")
    .eq("customer_email", profile?.email || user.email)
    .order("created_at", { ascending: false })

  // Bookings live in stripe_bookings, not inquiries. Match both bookings made
  // while signed in (user_id) and guest checkouts under the account's email.
  // RLS decides what is actually readable; the explicit filters keep an
  // admin's own page from listing every customer's bookings.
  const [byUser, byEmail] = await Promise.all([
    supabase
      .from("stripe_bookings")
      .select(BOOKING_COLUMNS)
      .eq("user_id", user.id)
      .in("status", VISIBLE_BOOKING_STATUSES),
    user.email
      ? supabase
          .from("stripe_bookings")
          .select(BOOKING_COLUMNS)
          .ilike("customer_email", escapeLike(user.email))
          .in("status", VISIBLE_BOOKING_STATUSES)
      : Promise.resolve({ data: [], error: null }),
  ])

  if (byUser.error) {
    console.error("[bookings] Error fetching bookings by user:", byUser.error)
  }
  if (byEmail.error) {
    console.error("[bookings] Error fetching bookings by email:", byEmail.error)
  }

  const bookingsById = new Map<string, any>()
  for (const booking of [...(byUser.data || []), ...(byEmail.data || [])]) {
    bookingsById.set(booking.id, booking)
  }
  const bookings = [...bookingsById.values()].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  )

  return (
    <div className="bg-background">
      <SiteHeaderWrapper />
      <main className="container px-4 pt-28 pb-8 sm:px-6 lg:px-8 lg:pt-32 min-h-screen">
        <BookingsContent
          bookings={bookings}
          inquiries={inquiries || []}
          showSuccess={params.success === "true"}
          profile={profile}
          userEmail={user.email || ""}
        />
      </main>
      <SiteFooter />
    </div>
  )
}
