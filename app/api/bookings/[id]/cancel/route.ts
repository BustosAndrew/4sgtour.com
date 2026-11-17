import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import {
  quoteCancellation,
  selfCancelBlock,
  toCancellationSchedule,
} from '@/lib/cancellation-policy'
import {
  cancellationUpdate,
  sendCancellationRequestedEmails,
} from '@/lib/booking-cancellation'

/**
 * POST /api/bookings/[id]/cancel — a customer cancels their own booking.
 *
 * Body: { expectedFeePercent: number, reason?: string }
 *
 * The fee is recomputed here from the database; the browser's figure is only
 * used to detect that the quote the customer agreed to has changed (e.g. the
 * date rolled over while the dialog was open). The booking is cancelled at
 * once — no further charges or reminders — and the refund waits for an admin
 * (Admin → Inquiries). Responds { ok: true, quote } or { ok: false, code }.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ ok: false, code: 'unauthorized' }, { status: 401 })
  }

  let body: { expectedFeePercent?: unknown; reason?: unknown } = {}
  try {
    body = await request.json()
  } catch {
    // An empty body is treated as no expectation; the quote check below
    // then refuses it.
  }

  // Read through the cookie-bound client: RLS lets a customer see only their
  // own bookings, so a row from another account is simply not found.
  const { data: booking, error } = await supabase
    .from('stripe_bookings')
    .select(
      `id, site_url, status, created_at, user_id, customer_name, customer_email,
       trip_title, booking_details, payment_method, inquiry_id,
       total_price, total_package_price, total_paid, remaining_balance,
       remaining_balance_charged, remaining_balance_charged_at,
       remaining_balance_payment_intent_id, trip_start_date, cancelled_at,
       trip:trips(cancellation_schedule)`,
    )
    .eq('id', id)
    .maybeSingle()

  if (error) {
    console.error('[cancellation] Error reading booking:', error)
    return NextResponse.json({ ok: false, code: 'error' }, { status: 500 })
  }

  // RLS also lets admins read every row; this route is only for the
  // customer's own booking. Admins cancel from Admin → Inquiries.
  const ownsBooking =
    !!booking &&
    (booking.user_id === user.id ||
      (!!user.email &&
        !!user.email_confirmed_at &&
        booking.customer_email?.toLowerCase() === user.email.toLowerCase()))
  if (!booking || !ownsBooking) {
    return NextResponse.json({ ok: false, code: 'not_found' }, { status: 404 })
  }

  const block = selfCancelBlock(booking)
  if (block) {
    return NextResponse.json({ ok: false, code: block }, { status: 409 })
  }

  const trip = Array.isArray(booking.trip) ? booking.trip[0] : booking.trip
  const schedule = toCancellationSchedule(trip?.cancellation_schedule)
  const now = new Date()
  const quote = quoteCancellation(booking, schedule, now)
  if (!quote) {
    return NextResponse.json({ ok: false, code: 'departed' }, { status: 409 })
  }

  if (Number(body.expectedFeePercent) !== quote.feePercent) {
    return NextResponse.json(
      { ok: false, code: 'quote_changed', quote },
      { status: 409 },
    )
  }

  const reason =
    typeof body.reason === 'string' ? body.reason.trim().slice(0, 1000) : null

  // Customers can't write stripe_bookings under RLS; ownership was checked
  // above. The status/cancelled_at guard makes a double-submit (or a race
  // with an admin cancelling) a no-op instead of a second cancellation.
  const service = createServiceClient()
  const { data: updated, error: updateError } = await service
    .from('stripe_bookings')
    .update(cancellationUpdate({ booking, by: 'customer', quote, reason, now }))
    .eq('id', booking.id)
    .in('status', ['confirmed', 'completed'])
    .is('cancelled_at', null)
    .select('id')

  if (updateError) {
    console.error('[cancellation] Error cancelling booking:', updateError)
    return NextResponse.json({ ok: false, code: 'error' }, { status: 500 })
  }
  if (!updated || updated.length === 0) {
    return NextResponse.json(
      { ok: false, code: 'already_cancelled' },
      { status: 409 },
    )
  }

  // A custom package's page must stop taking payments too.
  if (booking.inquiry_id) {
    const { error: inquiryError } = await service
      .from('inquiries')
      .update({ status: 'cancelled', updated_at: now.toISOString() })
      .eq('id', booking.inquiry_id)
    if (inquiryError) {
      console.error('[cancellation] Error cancelling custom package:', inquiryError)
    }
  }

  console.log(
    `[cancellation] Booking ${booking.id} cancelled by customer: ${quote.feePercent}% fee, refund due $${quote.refundDue.toFixed(2)}`,
  )

  await sendCancellationRequestedEmails(booking, quote, reason)

  return NextResponse.json({ ok: true, quote })
}
