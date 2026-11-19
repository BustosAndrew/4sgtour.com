import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getUserType } from "@/lib/supabase/get-user-type"

/** What an item in Admin → Inquiries is about — drives the type filter. */
type InquiryKind = "trip" | "tournament" | "custom"

// stripe_bookings rows that are real bookings: money received, clearing, or
// once received (cancelled / refunded). The same list My Bookings uses.
//
// A 'pending' row is written every time a customer presses "Continue to
// payment" — before they enter a card — and also for every SMS payment link
// sent. Abandoned ones become 'expired' a day later; bank payments that
// bounce become 'failed'. Listing those rows labelled "Paid Booking" made
// trips look booked by people who never paid (a customer who opened checkout
// on two trips and paid for one showed as having booked both).
const BOOKED_STATUSES = ["processing", "confirmed", "completed", "cancelled", "refunded"]

export async function GET() {
  try {
    const supabase = await createClient()
    const userType = await getUserType()

    if (userType !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get all inquiries ordered by most recent first. Tournament ticket
    // requests link to their event (migration 059) for the "View" button.
    const { data: inquiries, error } = await supabase
      .from("inquiries")
      .select(`
        *,
        trip:trips(title, slug),
        tournament_event:tournament_events(slug, tournament:tournaments(slug))
      `)
      .order("created_at", { ascending: false })

    if (error) throw error

    // Also get stripe bookings (paid trips) and convert to inquiry format
    const { data: stripeBookings, error: stripeError } = await supabase
      .from("stripe_bookings")
      .select(`
        *,
        trip:trips(title, slug)
      `)
      .in("status", BOOKED_STATUSES)
      .order("created_at", { ascending: false })

    if (stripeError) {
      console.error("[v0] Error fetching stripe bookings:", stripeError)
    }

    const inquiriesWithKind = (inquiries || []).map((inquiry: any) => ({
      ...inquiry,
      kind: (inquiry.inquiry_type === "tournament"
        ? "tournament"
        : inquiry.is_custom_package
          ? "custom"
          : "trip") as InquiryKind,
    }))

    // Convert stripe bookings to inquiry format for display
    const stripeBookingsAsInquiries = (stripeBookings || []).map((booking) => {
      const bookingDetails = (booking.booking_details as Record<string, unknown>) || {}
      return {
        id: booking.id,
        trip_id: booking.trip_id,
        inquiry_id: booking.inquiry_id,
        customer_name: booking.customer_name,
        customer_email: booking.customer_email,
        customer_phone: booking.customer_phone,
        trip_title: (bookingDetails.trip_title as string) || booking.trip?.title || "Unknown Trip",
        package_name: (bookingDetails.package_name as string) || null,
        start_date: booking.trip_start_date || (bookingDetails.start_date as string),
        end_date: (bookingDetails.end_date as string) || null,
        status: booking.status === "confirmed" ? "converted" : booking.status,
        inquiry_type: "stripe_booking",
        // Payments for a custom package carry its inquiry id (migration 058)
        kind: (booking.inquiry_id ? "custom" : "trip") as InquiryKind,
        total_price: booking.total_package_price || booking.total_paid,
        additional_requests: (bookingDetails.additional_requests as string) || null,
        created_at: booking.created_at,
        updated_at: booking.updated_at,
        payment_status: booking.status,
        amount_paid: booking.total_paid,
        is_fully_paid: booking.remaining_balance_charged || booking.remaining_balance === 0,
        stripe_checkout_session_id: booking.stripe_checkout_session_id,
        remaining_balance: booking.remaining_balance,
        deposit_amount: booking.deposit_amount,
        // Cancellation and refund (migration 060)
        cancelled_at: booking.cancelled_at,
        cancelled_by: booking.cancelled_by,
        cancellation_reason: booking.cancellation_reason,
        cancellation_fee_percent: booking.cancellation_fee_percent,
        cancellation_fee: booking.cancellation_fee,
        cancellation_refund_due: booking.cancellation_refund_due,
        refund_amount: booking.refund_amount,
        refunded_at: booking.refunded_at,
        trip: booking.trip,
      }
    })

    // The SMS payment link (and a booking's message thread) write an inquiry
    // with the same Stripe session as the booking. Show the booking once:
    // its "View in Inbox" reaches that inquiry's messages through
    // lib/booking-conversation.ts. Custom-package inquiries always stay —
    // they are the package itself. Only paid bookings are fetched above, so
    // an SMS link that was never paid stays listed as its unpaid inquiry.
    const bookingSessions = new Set(
      (stripeBookings || [])
        .map((booking) => booking.stripe_checkout_session_id)
        .filter(Boolean),
    )
    const visibleInquiries = inquiriesWithKind.filter(
      (inquiry: any) =>
        inquiry.is_custom_package ||
        !inquiry.stripe_session_id ||
        !bookingSessions.has(inquiry.stripe_session_id),
    )

    // Combine and sort by created_at (most recent first)
    const allInquiries = [...visibleInquiries, ...stripeBookingsAsInquiries].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )

    return NextResponse.json({ inquiries: allInquiries })
  } catch (error) {
    console.error("[v0] Error fetching inquiries:", error)
    return NextResponse.json({ error: "Failed to fetch inquiries" }, { status: 500 })
  }
}
