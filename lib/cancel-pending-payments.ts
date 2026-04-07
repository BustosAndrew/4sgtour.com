import { createClient as createServiceClient } from "@supabase/supabase-js"
import { Resend } from "resend"

// Helper function to cancel pending payments and notify customers when a trip is deleted/cancelled
export async function cancelPendingPaymentsForTrip(tripId: string, tripTitle?: string) {
  // Use service role to bypass RLS
  const serviceSupabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Find all bookings for this trip that have pending remaining balance charges
  const { data: bookings, error: fetchError } = await serviceSupabase
    .from("stripe_bookings")
    .select("*")
    .eq("trip_id", tripId)
    .eq("remaining_balance_charged", false)
    .gt("remaining_balance", 0)

  if (fetchError) {
    console.error("[v0] Error fetching bookings to cancel:", fetchError)
    return { cancelled: 0, errors: [fetchError.message] }
  }

  if (!bookings || bookings.length === 0) {
    console.log("[v0] No pending payments to cancel for trip:", tripId)
    return { cancelled: 0, errors: [] }
  }

  console.log(`[v0] Found ${bookings.length} bookings with pending payments to cancel`)

  const results = {
    cancelled: 0,
    errors: [] as string[],
  }

  const resend = new Resend(process.env.RESEND_API_KEY)

  for (const booking of bookings) {
    try {
      // Update the booking to mark it as cancelled and prevent future charges
      const { error: updateError } = await serviceSupabase
        .from("stripe_bookings")
        .update({
          status: "cancelled",
          remaining_balance_charged: true, // Prevent the cron from trying to charge
          updated_at: new Date().toISOString(),
        })
        .eq("id", booking.id)

      if (updateError) {
        console.error(`[v0] Error updating booking ${booking.id}:`, updateError)
        results.errors.push(`Failed to update booking ${booking.id}: ${updateError.message}`)
        continue
      }

      // Send cancellation email to customer
      const bookingDetails = (booking.booking_details || {}) as Record<string, unknown>
      const customerEmailContent = `
Dear ${booking.customer_name},

We regret to inform you that the following trip has been cancelled:

TRIP CANCELLATION NOTICE
========================

Trip: ${tripTitle || bookingDetails.trip_title || "Golf Trip"}
Package: ${bookingDetails.package_name || "Package"}
Originally Scheduled: ${bookingDetails.start_date || booking.trip_start_date} to ${bookingDetails.end_date || "N/A"}

Payment Status:
- Deposit Paid: $${Number(booking.deposit_amount || 0).toFixed(2)}
- Remaining Balance: $${Number(booking.remaining_balance || 0).toFixed(2)} (CANCELLED - will NOT be charged)

Your scheduled remaining balance payment has been cancelled and you will not be charged.

Regarding your deposit, please contact us to discuss refund options or transferring your deposit to another trip.

We sincerely apologize for any inconvenience this may cause. If you have any questions, please don't hesitate to contact us.

Best regards,
4 Seasons Golf Tour Team
      `.trim()

      try {
        await resend.emails.send({
          from: "4 Seasons Golf Tour <noreply@4sgtour.com>",
          to: booking.customer_email,
          subject: `Trip Cancelled: ${tripTitle || bookingDetails.trip_title || "Your Golf Trip"}`,
          text: customerEmailContent,
        })
        console.log(`[v0] Sent cancellation email to ${booking.customer_email}`)
      } catch (emailError) {
        console.error(`[v0] Error sending cancellation email to ${booking.customer_email}:`, emailError)
      }

      results.cancelled++
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      console.error(`[v0] Error cancelling booking ${booking.id}:`, error)
      results.errors.push(`Failed to cancel booking ${booking.id}: ${errorMessage}`)
    }
  }

  // Notify admin about cancelled payments
  if (results.cancelled > 0) {
    const adminEmail = process.env.ADMIN_EMAIL || "info@4sgtour.com"
    const adminEmailContent = `
TRIP CANCELLED - PAYMENTS CANCELLED

Trip: ${tripTitle || "Unknown Trip"}
Trip ID: ${tripId}

${results.cancelled} pending payment(s) have been automatically cancelled.

Affected Customers:
${bookings.map((b) => {
  return `- ${b.customer_name} (${b.customer_email}) - Remaining: $${Number(b.remaining_balance || 0).toFixed(2)}`
}).join("\n")}

${results.errors.length > 0 ? `\nErrors:\n${results.errors.join("\n")}` : ""}

Please follow up with customers regarding deposit refunds.
    `.trim()

    try {
      await resend.emails.send({
        from: "4 Seasons Golf Tour <noreply@4sgtour.com>",
        to: adminEmail,
        subject: `Trip Cancelled: ${results.cancelled} Payment(s) Cancelled`,
        text: adminEmailContent,
      })
    } catch (emailError) {
      console.error("[v0] Error sending admin notification:", emailError)
    }
  }

  return results
}
