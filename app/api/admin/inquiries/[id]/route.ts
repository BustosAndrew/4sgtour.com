import { createClient } from "@/lib/supabase/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { getUserType } from "@/lib/supabase/get-user-type"
import { NextResponse } from "next/server"
import { cancelBookingsAsAdmin } from "@/lib/booking-cancellation"

/**
 * DELETE /api/admin/inquiries/[id]            — delete permanently
 * DELETE /api/admin/inquiries/[id]?mode=cancel — cancel, keep the record
 *
 * Cancelling a paid booking keeps its payment history and stops any further
 * charges (the balance cron skips it; reminders stop). Nothing is refunded
 * automatically — the admin issues the refund from Admin → Inquiries
 * (/api/admin/bookings/[id]/refund). Cancelling a custom package
 * also cancels its payments and closes its /package/[id] page to payment.
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient()
    const { id } = await params
    const mode = new URL(request.url).searchParams.get("mode")

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const userType = await getUserType()
    if (userType !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Use service role client for admin operations to bypass RLS
    const adminClient = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    if (mode === "cancel") {
      return cancelRecord(adminClient, id)
    }

    // First delete any associated messages
    const { error: messagesError } = await adminClient
      .from("messages")
      .delete()
      .eq("inquiry_id", id)

    if (messagesError) {
      console.error("Error deleting messages:", messagesError)
      // Continue anyway - messages may not exist
    }

    // Try to delete from inquiries table first
    const { data: inquiryData, error: inquiryError } = await adminClient
      .from("inquiries")
      .delete()
      .eq("id", id)
      .select()

    if (inquiryError) {
      console.error("Error deleting from inquiries:", inquiryError)
    }

    // If not found in inquiries, try stripe_bookings table
    if (!inquiryData || inquiryData.length === 0) {
      const { data: bookingData, error: bookingError } = await adminClient
        .from("stripe_bookings")
        .delete()
        .eq("id", id)
        .select()

      if (bookingError) {
        console.error("Error deleting from stripe_bookings:", bookingError)
        return NextResponse.json(
          { error: "Failed to delete booking" },
          { status: 500 },
        )
      }

      if (!bookingData || bookingData.length === 0) {
        console.error("No inquiry or booking found for id:", id)
        return NextResponse.json(
          { error: "Inquiry not found" },
          { status: 404 },
        )
      }

      return NextResponse.json({ success: true, deleted: bookingData.length, source: "stripe_bookings" })
    }

    return NextResponse.json({ success: true, deleted: inquiryData.length, source: "inquiries" })
  } catch (error) {
    console.error("Error in inquiry delete route:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    )
  }
}

// What cancelBookingsAsAdmin() needs to record the amount paid.
const CANCELLABLE_COLUMNS = `
  id, status, created_at, total_price, total_package_price, total_paid,
  remaining_balance, remaining_balance_charged, trip_start_date,
  booking_details, cancelled_at
`

async function cancelRecord(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  adminClient: any,
  id: string,
) {
  const now = new Date().toISOString()

  // A paid booking (listed in Admin → Inquiries with its stripe_bookings id).
  // Cancelling records what was paid first, so the refund can be issued
  // from the list afterwards.
  const { data: bookings, error: bookingError } = await adminClient
    .from("stripe_bookings")
    .select(CANCELLABLE_COLUMNS)
    .eq("id", id)
  if (bookingError) {
    console.error("[admin] Error reading booking:", bookingError)
    return NextResponse.json({ error: "Failed to cancel booking" }, { status: 500 })
  }
  if (bookings && bookings.length > 0) {
    const cancelled = await cancelBookingsAsAdmin(adminClient, bookings)
    if (cancelled.length === 0) {
      return NextResponse.json({ error: "Failed to cancel booking" }, { status: 500 })
    }
    return NextResponse.json({ success: true, cancelled: "booking" })
  }

  // An inquiry — for a custom package, also cancel the payments made on it
  const { data: inquiries, error: inquiryError } = await adminClient
    .from("inquiries")
    .update({ status: "cancelled", updated_at: now })
    .eq("id", id)
    .select("id, is_custom_package")
  if (inquiryError) {
    console.error("[admin] Error cancelling inquiry:", inquiryError)
    return NextResponse.json({ error: "Failed to cancel inquiry" }, { status: 500 })
  }
  if (!inquiries || inquiries.length === 0) {
    return NextResponse.json({ error: "Inquiry not found" }, { status: 404 })
  }

  if ((inquiries[0] as any).is_custom_package) {
    const { data: payments, error } = await adminClient
      .from("stripe_bookings")
      .select(CANCELLABLE_COLUMNS)
      .eq("inquiry_id", id)
      .in("status", ["pending", "processing", "confirmed", "completed"])
    if (error) console.error("[admin] Error reading custom package payments:", error)
    if (payments && payments.length > 0) {
      await cancelBookingsAsAdmin(adminClient, payments)
    }
  }

  return NextResponse.json({ success: true, cancelled: "inquiry" })
}
