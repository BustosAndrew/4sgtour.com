import { NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getUserType } from '@/lib/supabase/get-user-type'
import { stripe } from '@/lib/stripe'
import {
  bookingTripTotal,
  cancellationFeePercent,
  cardRefundFee,
  paidTowardTrip,
  quoteCancellation,
  toCancellationSchedule,
} from '@/lib/cancellation-policy'
import { sendRefundIssuedEmail } from '@/lib/booking-cancellation'

/**
 * Refunds for cancelled bookings — admin only.
 *
 * GET  → what can be refunded: the policy refund (fee frozen at the time of
 *        cancellation, minus the 8% card fee if refunding after the day of
 *        payment), a full refund (company cancellation, e.g. too few
 *        participants), and the most Stripe will still refund.
 * POST { option: 'policy' | 'full' | 'custom' | 'none', amount? }
 *      → refunds through Stripe and records it. 'policy' and 'full' are
 *        recomputed here; only 'custom' takes the amount from the body, and
 *        it is capped at what Stripe can refund. 'none' closes the
 *        cancellation with no refund.
 */

type RefundOption = 'policy' | 'full' | 'custom' | 'none'

const BOOKING_COLUMNS = `
  id, site_url, status, created_at, customer_name, customer_email,
  trip_title, booking_details, payment_method,
  stripe_payment_intent_id, remaining_balance_payment_intent_id,
  total_price, total_package_price, total_paid, remaining_balance,
  remaining_balance_charged, remaining_balance_charged_at, trip_start_date,
  cancelled_at, cancelled_by, cancellation_schedule, cancellation_fee_percent,
  cancellation_fee, cancellation_paid_amount, cancellation_refund_due,
  refund_amount, refunded_at, stripe_refund_ids,
  trip:trips(cancellation_schedule)
`

async function requireAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  if ((await getUserType()) !== 'admin') return null
  return supabase
}

interface RefundableCharge {
  paymentIntentId: string
  refundableCents: number
  paidByCard: boolean
}

/** Balance payment first, then the deposit — the order refunds are drawn in. */
async function refundableCharges(booking: any): Promise<RefundableCharge[]> {
  const ids = [
    booking.remaining_balance_payment_intent_id,
    booking.stripe_payment_intent_id,
  ].filter((id, index, all): id is string => !!id && all.indexOf(id) === index)

  const charges: RefundableCharge[] = []
  for (const id of ids) {
    const intent = await stripe.paymentIntents.retrieve(id, {
      expand: ['latest_charge'],
    })
    const charge = intent.latest_charge as Stripe.Charge | null
    if (!charge || typeof charge === 'string' || !charge.paid) continue
    charges.push({
      paymentIntentId: id,
      refundableCents: Math.max(0, charge.amount_captured - charge.amount_refunded),
      paidByCard: charge.payment_method_details?.type !== 'us_bank_account',
    })
  }
  return charges
}

function toCents(amount: number) {
  return Math.round(amount * 100)
}

/** Everything the dialog shows, recomputed from the row and Stripe. */
async function buildQuote(booking: any) {
  const charges = await refundableCharges(booking)
  const maxRefundableCents = charges.reduce((sum, c) => sum + c.refundableCents, 0)
  const paidByCard = charges.some((c) => c.paidByCard)

  const paid =
    booking.cancellation_paid_amount != null
      ? Number(booking.cancellation_paid_amount)
      : paidTowardTrip(booking)
  const tripTotal = bookingTripTotal(booking)

  // The fee is fixed by the day the booking was cancelled. Customer
  // cancellations froze it; admin cancellations (and older rows) are
  // worked out from the cancellation date and the trip's schedule.
  const trip = Array.isArray(booking.trip) ? booking.trip[0] : booking.trip
  const schedule = toCancellationSchedule(
    booking.cancellation_schedule || trip?.cancellation_schedule,
  )
  let feePercent = booking.cancellation_fee_percent
  if (feePercent == null) {
    const quote = quoteCancellation(booking, schedule, booking.cancelled_at || booking.created_at)
    feePercent = quote ? quote.feePercent : cancellationFeePercent(schedule, -1)
  }
  feePercent = Number(feePercent)
  const fee = Math.round((tripTotal || paid) * feePercent) / 100
  const policyRefundDue = Math.max(0, Math.round((paid - fee) * 100) / 100)
  const cardFee = cardRefundFee(policyRefundDue, {
    paidByCard,
    paidAt: booking.created_at,
  })

  const cap = (amount: number) => Math.min(toCents(amount), maxRefundableCents) / 100

  return {
    cancelledBy: booking.cancelled_by,
    cancelledAt: booking.cancelled_at,
    schedule,
    feePercent,
    tripTotal,
    paidTowardTrip: paid,
    fee,
    policyRefundDue,
    cardFee,
    paidByCard,
    policyRefund: cap(policyRefundDue - cardFee),
    fullRefund: cap(paid),
    maxRefundable: maxRefundableCents / 100,
    charges,
  }
}

async function loadCancelledBooking(supabase: any, id: string) {
  const { data: booking, error } = await supabase
    .from('stripe_bookings')
    .select(BOOKING_COLUMNS)
    .eq('id', id)
    .maybeSingle()
  if (error) {
    console.error('[refund] Error reading booking:', error)
    return { error: NextResponse.json({ error: 'Failed to load booking' }, { status: 500 }) }
  }
  if (!booking) {
    return { error: NextResponse.json({ error: 'Booking not found' }, { status: 404 }) }
  }
  if (booking.status !== 'cancelled') {
    return {
      error: NextResponse.json(
        { error: 'Only cancelled bookings can be refunded here' },
        { status: 409 },
      ),
    }
  }
  if (booking.refunded_at) {
    return {
      error: NextResponse.json(
        { error: 'This cancellation has already been refunded or closed' },
        { status: 409 },
      ),
    }
  }
  return { booking }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await requireAdmin()
  if (!supabase) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const { booking, error } = await loadCancelledBooking(supabase, id)
  if (error) return error

  try {
    return NextResponse.json({ quote: await buildQuote(booking) })
  } catch (stripeError: any) {
    console.error('[refund] Error reading payments from Stripe:', stripeError)
    return NextResponse.json(
      { error: `Couldn't read the payments from Stripe: ${stripeError?.message || 'unknown error'}` },
      { status: 502 },
    )
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await requireAdmin()
  if (!supabase) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const body = await request.json().catch(() => ({}))
  const option = body.option as RefundOption
  if (!['policy', 'full', 'custom', 'none'].includes(option)) {
    return NextResponse.json({ error: 'Choose a refund option' }, { status: 400 })
  }

  const { booking, error } = await loadCancelledBooking(supabase, id)
  if (error) return error

  let quote: Awaited<ReturnType<typeof buildQuote>>
  try {
    quote = await buildQuote(booking)
  } catch (stripeError: any) {
    console.error('[refund] Error reading payments from Stripe:', stripeError)
    return NextResponse.json(
      { error: `Couldn't read the payments from Stripe: ${stripeError?.message || 'unknown error'}` },
      { status: 502 },
    )
  }

  let amountCents = 0
  if (option === 'policy') amountCents = toCents(quote.policyRefund)
  if (option === 'full') amountCents = toCents(quote.fullRefund)
  if (option === 'custom') {
    const requested = Number(body.amount)
    if (!Number.isFinite(requested) || requested < 0) {
      return NextResponse.json({ error: 'Enter a valid amount' }, { status: 400 })
    }
    amountCents = toCents(requested)
  }
  if (amountCents > toCents(quote.maxRefundable)) {
    return NextResponse.json(
      { error: `Stripe can refund at most $${quote.maxRefundable.toFixed(2)} on this booking` },
      { status: 400 },
    )
  }

  // Draw the refund from the balance payment first, then the deposit.
  const refundIds: string[] = [...(booking.stripe_refund_ids || [])]
  let refundedCents = 0
  let stripeFailure: string | null = null
  for (const charge of quote.charges) {
    const portion = Math.min(charge.refundableCents, amountCents - refundedCents)
    if (portion <= 0) break
    try {
      const refund = await stripe.refunds.create(
        {
          payment_intent: charge.paymentIntentId,
          amount: portion,
          reason: 'requested_by_customer',
          metadata: { booking_id: booking.id, type: 'cancellation_refund' },
        },
        {
          // A double-click or retried request returns the same refund
          // instead of refunding twice.
          idempotencyKey: `cancellation-refund-${booking.id}-${charge.paymentIntentId}-${portion}`,
        },
      )
      refundIds.push(refund.id)
      refundedCents += portion
    } catch (refundError: any) {
      console.error('[refund] Stripe refund failed:', refundError)
      stripeFailure = refundError?.message || 'Stripe refused the refund'
      break
    }
  }

  if (stripeFailure && refundedCents === 0) {
    return NextResponse.json({ error: stripeFailure }, { status: 502 })
  }

  const now = new Date().toISOString()
  const service = createServiceClient()
  const { error: updateError } = await service
    .from('stripe_bookings')
    .update({
      status: refundedCents > 0 ? 'refunded' : 'cancelled',
      refund_amount: refundedCents / 100,
      refunded_at: now,
      stripe_refund_ids: refundIds,
      updated_at: now,
    })
    .eq('id', booking.id)
    .is('refunded_at', null)

  if (updateError) {
    // The money has moved; make sure this is visible in the logs.
    console.error(
      `[refund] Refunded $${(refundedCents / 100).toFixed(2)} on booking ${booking.id} (${refundIds.join(', ')}) but failed to record it:`,
      updateError,
    )
    return NextResponse.json(
      { error: 'The refund was issued in Stripe but could not be recorded. Check Stripe before trying again.' },
      { status: 500 },
    )
  }

  console.log(
    `[refund] Booking ${booking.id}: ${option} refund of $${(refundedCents / 100).toFixed(2)}`,
  )

  await sendRefundIssuedEmail(booking, {
    amount: refundedCents / 100,
    cardFee: option === 'policy' ? quote.cardFee : 0,
  })

  if (stripeFailure) {
    return NextResponse.json(
      {
        error: `Only $${(refundedCents / 100).toFixed(2)} of $${(amountCents / 100).toFixed(2)} was refunded: ${stripeFailure}. Refund the rest in the Stripe dashboard.`,
        refunded: refundedCents / 100,
      },
      { status: 502 },
    )
  }

  return NextResponse.json({ success: true, refunded: refundedCents / 100 })
}
