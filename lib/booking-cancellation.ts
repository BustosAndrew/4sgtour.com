import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import {
  CARD_REFUND_FEE_PERCENT,
  paidTowardTrip,
  type CancellableBooking,
  type CancellationQuote,
} from '@/lib/cancellation-policy'
import { getAdminEmail, getFromEmail, getSupportEmail } from '@/lib/site-email'
import { getSiteUrl } from '@/lib/site-url'

/**
 * Writes for cancelling a stripe_bookings row: stop every future charge
 * (the balance cron skips it, reminders stop) and freeze what the policy
 * said at that moment. Nothing is refunded here — an admin approves the
 * refund from Admin → Inquiries (/api/admin/bookings/[id]/refund).
 */
export function cancellationUpdate({
  booking,
  by,
  quote,
  reason,
  now = new Date(),
}: {
  booking: CancellableBooking
  by: 'customer' | 'admin'
  /** The policy quote (customer cancellations). Admins cancel without one. */
  quote?: CancellationQuote | null
  reason?: string | null
  now?: Date
}) {
  const iso = now.toISOString()
  return {
    status: 'cancelled',
    remaining_balance_charged: true,
    auto_charge_date: null,
    cancelled_at: iso,
    cancelled_by: by,
    cancellation_reason: reason?.trim().slice(0, 1000) || null,
    cancellation_schedule: quote?.schedule ?? null,
    cancellation_fee_percent: quote?.feePercent ?? null,
    cancellation_fee: quote?.fee ?? null,
    // Must come from the row as it was, before remaining_balance_charged
    // is forced to true above.
    cancellation_paid_amount: quote?.paidTowardTrip ?? paidTowardTrip(booking),
    cancellation_refund_due: quote?.refundDue ?? null,
    updated_at: iso,
  }
}

const PAID_STATUSES = ['processing', 'confirmed', 'completed']

/**
 * Cancel bookings as an admin, recording each row's paid amount so the
 * refund dialog can offer the policy refund or a full refund later.
 * Returns the ids cancelled.
 */
export async function cancelBookingsAsAdmin(
  service: SupabaseClient,
  rows: Array<CancellableBooking & { id: string }>,
): Promise<string[]> {
  const cancelled: string[] = []
  for (const row of rows) {
    // A 'pending' row is a checkout that was opened but never paid (its
    // total_paid is what it *would* have charged), so there is nothing to
    // record or refund — just close it.
    const wasPaid = PAID_STATUSES.includes(row.status)
    const update = wasPaid
      ? cancellationUpdate({ booking: row, by: 'admin' })
      : {
          status: 'cancelled',
          remaining_balance_charged: true,
          auto_charge_date: null,
          updated_at: new Date().toISOString(),
        }
    const { error } = await service
      .from('stripe_bookings')
      .update(update)
      .eq('id', row.id)
    if (error) {
      console.error('[cancellation] Error cancelling booking', row.id, error)
    } else {
      cancelled.push(row.id)
    }
  }
  return cancelled
}

function money(amount: number) {
  return `$${amount.toFixed(2)}`
}

interface BookingForEmail {
  id: string
  site_url: string | null
  customer_name: string
  customer_email: string
  trip_title: string | null
  booking_details: Record<string, unknown> | null
  payment_method: string | null
}

function tripName(booking: BookingForEmail) {
  return String(booking.booking_details?.trip_title || booking.trip_title || 'Golf Trip')
}

/** Customer confirmation + admin notice for a customer's own cancellation. */
export async function sendCancellationRequestedEmails(
  booking: BookingForEmail,
  quote: CancellationQuote,
  reason: string | null,
) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[cancellation] RESEND_API_KEY not set; skipping emails')
    return
  }
  const resend = new Resend(process.env.RESEND_API_KEY)
  const from = getFromEmail(booking.site_url)
  const trip = tripName(booking)
  const packageName = booking.booking_details?.package_name
    ? `\nPackage: ${booking.booking_details.package_name}`
    : ''
  const paidByBank =
    booking.payment_method === 'ach' || booking.payment_method === 'us_bank_account'

  const customerText = `
Dear ${booking.customer_name},

We have received your cancellation and your booking is now cancelled. No further payments will be taken.

Trip: ${trip}${packageName}
Departure: ${quote.departureDate}
Cancelled: ${quote.daysBeforeDeparture} day(s) before departure

Paid toward the trip: ${money(quote.paidTowardTrip)}
Cancellation fee (${quote.feePercent}% of ${money(quote.tripTotal)}): ${money(quote.fee)}
Refund due under our cancellation policy: ${money(quote.refundDue)}
${
  quote.refundDue > 0 && !paidByBank
    ? `\nCard payments refunded after the day of payment have an ${CARD_REFUND_FEE_PERCENT}% card fee deducted, so the amount returned to your card may be lower.\n`
    : ''
}
Our team will review the cancellation and issue any refund to your original payment method. You will receive a separate email when it has been sent.

Cancellation policy: ${booking.site_url || getSiteUrl()}/terms

If you have any questions, reply to this email or contact ${getSupportEmail(booking.site_url)}.

Best regards,
4 Seasons Golf Tour Team
  `.trim()

  const adminText = `
CUSTOMER CANCELLATION — REFUND TO REVIEW

Customer: ${booking.customer_name} (${booking.customer_email})
Trip: ${trip}${packageName}
Departure: ${quote.departureDate} (${quote.daysBeforeDeparture} day(s) away)
Schedule: ${quote.schedule === 'western_us' ? 'Western US' : 'Standard'}${quote.lastMinuteBooking ? ' — booked the day before departure: non-refundable' : ''}

Paid toward the trip: ${money(quote.paidTowardTrip)}
Fee: ${quote.feePercent}% of ${money(quote.tripTotal)} = ${money(quote.fee)}
Refund due (before any ${CARD_REFUND_FEE_PERCENT}% card fee): ${money(quote.refundDue)}
${reason ? `\nReason given:\n${reason}\n` : ''}
Remaining-balance charges and reminders have been stopped.
Issue or close the refund at Admin → Inquiries (booking ${booking.id}).
  `.trim()

  const results = await Promise.allSettled([
    resend.emails.send({
      from,
      to: booking.customer_email,
      subject: `Booking cancelled: ${trip}`,
      text: customerText,
    }),
    resend.emails.send({
      from,
      to: getAdminEmail(booking.site_url),
      replyTo: booking.customer_email,
      subject: `Cancellation to review: ${booking.customer_name} — ${trip}`,
      text: adminText,
    }),
  ])
  for (const result of results) {
    if (result.status === 'rejected') {
      console.error('[cancellation] Error sending email:', result.reason)
    }
  }
}

/** Tells the customer their refund has been issued. */
export async function sendRefundIssuedEmail(
  booking: BookingForEmail,
  refund: { amount: number; cardFee: number },
) {
  if (!process.env.RESEND_API_KEY || refund.amount <= 0) return
  const resend = new Resend(process.env.RESEND_API_KEY)
  const trip = tripName(booking)
  const text = `
Dear ${booking.customer_name},

A refund of ${money(refund.amount)} for your cancelled booking has been issued to your original payment method.

Trip: ${trip}${
    refund.cardFee > 0
      ? `\nCard refund fee deducted (${CARD_REFUND_FEE_PERCENT}%): ${money(refund.cardFee)}`
      : ''
  }

Refunds usually appear within 5–10 business days, depending on your bank.

If you have any questions, contact ${getSupportEmail(booking.site_url)}.

Best regards,
4 Seasons Golf Tour Team
  `.trim()

  try {
    await resend.emails.send({
      from: getFromEmail(booking.site_url),
      to: booking.customer_email,
      subject: `Refund issued: ${trip}`,
      text,
    })
  } catch (error) {
    console.error('[cancellation] Error sending refund email:', error)
  }
}
