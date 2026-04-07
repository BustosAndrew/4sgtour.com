import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getUserType } from "@/lib/supabase/get-user-type"

export async function GET() {
  try {
    const supabase = await createClient()
    const userType = await getUserType()

    if (userType !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get all inquiries ordered by most recent first
    const { data: inquiries, error } = await supabase
      .from("inquiries")
      .select(`
        *,
        trip:trips(title, slug)
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
      .order("created_at", { ascending: false })

    if (stripeError) {
      console.error("[v0] Error fetching stripe bookings:", stripeError)
    }

    // Convert stripe bookings to inquiry format for display
    const stripeBookingsAsInquiries = (stripeBookings || []).map((booking) => {
      const bookingDetails = (booking.booking_details as Record<string, unknown>) || {}
      return {
        id: booking.id,
        trip_id: booking.trip_id,
        customer_name: booking.customer_name,
        customer_email: booking.customer_email,
        customer_phone: booking.customer_phone,
        trip_title: (bookingDetails.trip_title as string) || booking.trip?.title || "Unknown Trip",
        package_name: (bookingDetails.package_name as string) || null,
        start_date: booking.trip_start_date || (bookingDetails.start_date as string),
        end_date: (bookingDetails.end_date as string) || null,
        status: booking.status === "confirmed" ? "converted" : booking.status,
        inquiry_type: "stripe_booking",
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
        trip: booking.trip,
      }
    })

    // Combine and sort by created_at (most recent first)
    const allInquiries = [...(inquiries || []), ...stripeBookingsAsInquiries].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )

    return NextResponse.json({ inquiries: allInquiries })
  } catch (error) {
    console.error("[v0] Error fetching inquiries:", error)
    return NextResponse.json({ error: "Failed to fetch inquiries" }, { status: 500 })
  }
}
