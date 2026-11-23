'use server'

import { stripe } from '@/lib/stripe'
import { checkoutExpiresAt } from '@/lib/checkout-expiry'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getSiteUrl } from '@/lib/site-url'
import { normalizeE164 } from '@/lib/phone'
import {
  BookingPriceError,
  resolveBookingPrice,
} from '@/lib/resolve-booking-price'
import {
  calculatePaymentAmounts,
  type CheckoutErrorCode,
  type TripCheckoutResult,
  type TripPriceResult,
} from '@/lib/booking-price'
import {
  quoteCardPayment,
  type CardPaymentRequest,
  type CardPaymentResponse,
} from '@/lib/card-payment'
import {
  closePaymentAttempt,
  readConfirmationTokenCard,
  startCardPayment,
} from '@/lib/card-payment-server'

interface CheckoutSessionParams {
  packageId: string
  tripId: string
  tripTitle: string
  paymentType: 'deposit' | 'full' // Payment type: deposit or full payment
  depositPercentage: number // Configurable deposit percentage
  // Customer info - required for guests, prefilled for logged-in users
  customerName: string
  customerEmail: string
  customerPhone: string
  // Booking details
  startDate: string
  endDate: string
  roomType: string
  packageName: string
  totalPrice: number // Total price including extra nights
  golfCourses?: string[]
  mealOption?: string
  transportOption?: string
  additionalRequests?: string
  guests?: Array<{
    name: string
    phone: string
    occupancy: 'single' | 'double'
  }>
}

/** A refusal decided before any payment exists (bad phone, price changed…). */
class CheckoutRefusal extends Error {
  constructor(public code: CheckoutErrorCode) {
    super(code)
  }
}

/**
 * Everything a trip payment needs, recomputed from the database. `totalPrice`
 * and `depositPercentage` from the browser are only what the customer was
 * shown — if they disagree (stale page, edited trip, or a tampered request)
 * resolveBookingPrice refuses rather than charge an amount the customer never
 * saw. The package name comes from the same row, so the receipt, email and
 * booking record always name the package actually being charged.
 */
async function prepareTripPayment(params: CheckoutSessionParams) {
  // Stored for the booking-confirmation text (sent by the webhook via
  // Twilio), so it must be E.164 — the payment screen builds it from the
  // country picker.
  const customerPhone = normalizeE164(params.customerPhone)
  if (!customerPhone) throw new CheckoutRefusal('INVALID_PHONE')

  const supabase = await createClient()
  const { totalPrice, depositPercentage, packageName, cardFeePercent } =
    await resolveBookingPrice(supabase, params)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isFullPayment = params.paymentType === 'full'
  // Without the card fee: a bank payment pays exactly this, and a card pays
  // this plus whatever fee its own card carries (quoted once it's entered).
  const amounts = calculatePaymentAmounts(
    totalPrice,
    depositPercentage,
    isFullPayment ? 'full' : 'deposit',
    'ach',
    cardFeePercent,
  )
  const remainingBalance = amounts.remainingCents / 100

  // When the remaining balance is charged automatically:
  // more than 60 days away → 60 days before the trip; 31–60 days → 30 days
  // before; otherwise now (handled at payment).
  const tripStartDate = new Date(params.startDate)
  const daysUntilTrip = Math.ceil(
    (tripStartDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  )
  let autoChargeDate: Date
  if (daysUntilTrip > 60) {
    autoChargeDate = new Date(tripStartDate)
    autoChargeDate.setDate(autoChargeDate.getDate() - 60)
  } else if (daysUntilTrip > 30) {
    autoChargeDate = new Date(tripStartDate)
    autoChargeDate.setDate(autoChargeDate.getDate() - 30)
  } else {
    autoChargeDate = new Date()
  }

  const description = isFullPayment
    ? `${params.tripTitle} - ${packageName} (Full Payment)`
    : `${params.tripTitle} - ${packageName} (${depositPercentage}% Deposit)`

  // Read by the webhook to record the booking (Checkout Session metadata for
  // bank transfers, PaymentIntent metadata for cards).
  const metadata: Record<string, string> = {
    site_url: getSiteUrl(),
    trip_id: params.tripId,
    trip_title: params.tripTitle,
    package_id: params.packageId,
    package_name: packageName,
    user_id: user?.id || '',
    customer_name: params.customerName,
    customer_email: params.customerEmail,
    customer_phone: customerPhone,
    start_date: params.startDate,
    end_date: params.endDate,
    room_type: params.roomType,
    golf_courses: JSON.stringify(params.golfCourses || []),
    meal_option: params.mealOption || '',
    transport_option: params.transportOption || '',
    additional_requests: (params.additionalRequests || '').slice(0, 450),
    payment_type: params.paymentType,
    deposit_percentage: String(depositPercentage),
    is_guest: user ? 'false' : 'true',
    total_price: String(totalPrice),
    remaining_balance: String(remainingBalance),
    auto_charge_date: autoChargeDate.toISOString(),
  }

  /** The pending stripe_bookings row; the webhook confirms it. */
  const bookingRow = (
    method: 'card' | 'ach',
    attemptId: string,
    feeCents: number,
  ) => ({
    trip_id: params.tripId,
    package_id: params.packageId,
    user_id: user?.id || null,
    site_url: getSiteUrl(),
    // A Checkout Session id for bank transfers; the PaymentIntent id for
    // cards. The webhook finds the row by it either way.
    stripe_checkout_session_id: attemptId,
    customer_name: params.customerName,
    customer_email: params.customerEmail,
    customer_phone: customerPhone,
    deposit_amount: amounts.paymentCents / 100, // deposit or full payment
    total_package_price: totalPrice,
    total_price: totalPrice,
    trip_title: params.tripTitle,
    deposit_percentage: depositPercentage,
    processing_fee: feeCents / 100,
    total_paid: (amounts.paymentCents + feeCents) / 100,
    payment_method: method,
    status: 'pending',
    trip_start_date: params.startDate,
    remaining_balance: remainingBalance,
    // For full payments there is no balance, so nothing to auto-charge
    auto_charge_date: isFullPayment ? null : autoChargeDate.toISOString().split('T')[0],
    remaining_balance_charged: isFullPayment,
    booking_details: {
      trip_title: params.tripTitle,
      package_name: packageName,
      start_date: params.startDate,
      end_date: params.endDate,
      room_type: params.roomType,
      golf_courses: params.golfCourses || [],
      meal_option: params.mealOption || '',
      transport_option: params.transportOption || '',
      additional_requests: params.additionalRequests || '',
      // The fee this booking was made with; the balance auto-charge uses
      // it even if the trip's fee changes later.
      card_fee_percent: cardFeePercent,
    },
  })

  return {
    supabase,
    amounts,
    depositPercentage,
    cardFeePercent,
    isFullPayment,
    description,
    metadata,
    bookingRow,
    lineDescription: `Travel dates: ${params.startDate} to ${params.endDate}. Room: ${params.roomType}.`,
  }
}

function refusalCode(error: unknown): CheckoutErrorCode | null {
  if (error instanceof BookingPriceError || error instanceof CheckoutRefusal) {
    console.warn('[checkout] Refused checkout:', error.code, error.message)
    return error.code
  }
  return null
}

/**
 * Creates the embedded Checkout Session for a US bank (ACH) payment. Returns
 * a result instead of throwing: Next.js replaces thrown server-action errors
 * with a generic message in production, and the payment screen needs to know
 * *why* it failed (e.g. the price changed) to tell the customer what to do.
 *
 * Card payments don't use Checkout — see payTripByCard.
 */
export async function createTripCheckoutSession(
  params: CheckoutSessionParams,
): Promise<TripCheckoutResult> {
  try {
    const trip = await prepareTripPayment(params)
    const session = await stripe.checkout.sessions.create({
      ui_mode: 'embedded',
      redirect_on_completion: 'never',
      // Payable for 24 hours; the pending row is expired after that (webhook,
      // or the daily abandoned-checkout cleanup).
      expires_at: checkoutExpiresAt(),
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: { name: trip.description, description: trip.lineDescription },
            unit_amount: trip.amounts.paymentCents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      payment_method_types: ['us_bank_account'],
      payment_method_options: {
        us_bank_account: {
          financial_connections: { permissions: ['payment_method'] },
        },
      },
      // Only save the payment method for off-session use when the remaining
      // balance will be charged later (deposit payments). Applying
      // `setup_future_usage: 'off_session'` to full payments is unnecessary
      // and triggers stricter scrutiny.
      ...(trip.isFullPayment
        ? {}
        : { payment_intent_data: { setup_future_usage: 'off_session' as const } }),
      customer_email: params.customerEmail,
      metadata: { ...trip.metadata, payment_method: 'ach', processing_fee: '0' },
    })

    // No .select() on this insert: reading the row back needs a SELECT policy
    // a guest doesn't have (and must not have — the old public SELECT policy
    // exposed every customer's booking to the anon key).
    const { error: bookingError } = await trip.supabase
      .from('stripe_bookings')
      .insert(trip.bookingRow('ach', session.id, 0))
    if (bookingError) {
      console.error('[v0] Error creating booking record:', bookingError)
      // Don't fail - we can reconcile from webhook
    }

    if (!session.client_secret) {
      throw new Error(`Checkout session ${session.id} has no client_secret`)
    }
    return {
      ok: true,
      clientSecret: session.client_secret,
      amounts: trip.amounts,
      depositPercentage: trip.depositPercentage,
      cardFeePercent: trip.cardFeePercent,
    }
  } catch (error) {
    const code = refusalCode(error)
    if (code) return { ok: false, code }
    console.error('[checkout] Failed to create checkout session:', error)
    return { ok: false, code: 'CHECKOUT_FAILED' }
  }
}

/**
 * Checks the price before the card form is shown, so a changed price is
 * explained on the booking screen (as for bank transfers) rather than after
 * the customer has typed in a card. Charges nothing and writes nothing.
 */
export async function checkTripCardPayment(
  params: CheckoutSessionParams,
): Promise<TripPriceResult> {
  try {
    const trip = await prepareTripPayment(params)
    return {
      ok: true,
      amounts: trip.amounts,
      depositPercentage: trip.depositPercentage,
      cardFeePercent: trip.cardFeePercent,
    }
  } catch (error) {
    const code = refusalCode(error)
    if (code) return { ok: false, code }
    console.error('[checkout] Failed to check the card payment:', error)
    return { ok: false, code: 'CHECKOUT_FAILED' }
  }
}

/**
 * The card form's server side (lib/card-payment.ts): without
 * `confirmTotalCents`, quotes the card entered — the trip's credit card fee
 * for a credit card, none for debit or prepaid; with it, charges exactly that
 * total. The pending row is written (or moved from an earlier, declined
 * attempt) before the card is charged; the webhook confirms it.
 */
export async function payTripByCard(
  params: CheckoutSessionParams,
  request: CardPaymentRequest,
): Promise<CardPaymentResponse> {
  let trip: Awaited<ReturnType<typeof prepareTripPayment>>
  try {
    trip = await prepareTripPayment(params)
  } catch (error) {
    const code = refusalCode(error)
    if (code) return { ok: false, code: 'price_changed', checkoutCode: code }
    console.error('[checkout] Failed to prepare the card payment:', error)
    return { ok: false, code: 'failed' }
  }

  try {
    const card = await readConfirmationTokenCard(stripe, request.confirmationTokenId)
    if (!card) return { ok: false, code: 'not_a_card' }
    const quote = quoteCardPayment(card, trip.amounts.paymentCents, trip.cardFeePercent)
    if (request.confirmTotalCents !== quote.totalCents) {
      return {
        ok: true,
        status: 'quote',
        quote,
        changed: request.confirmTotalCents !== undefined,
      }
    }

    // An earlier attempt from this screen (declined, or 3-D Secure not
    // finished): make sure it can't also be paid, then move its row.
    let previous: string | null = null
    if (request.previousPaymentIntentId?.startsWith('pi_')) {
      const earlier = await stripe.paymentIntents.retrieve(request.previousPaymentIntentId)
      if (
        earlier.metadata?.card_payment === 'true' &&
        earlier.metadata?.trip_id === params.tripId
      ) {
        if ((await closePaymentAttempt(stripe, earlier.id)) === 'paid') {
          return { ok: false, code: 'already_paid' }
        }
        previous = earlier.id
      }
    }

    return await startCardPayment(stripe, {
      confirmationTokenId: request.confirmationTokenId,
      quote,
      bookingFeePercent: trip.cardFeePercent,
      saveForLater: !trip.isFullPayment,
      description: trip.description,
      metadata: trip.metadata,
      beforeConfirm: async (paymentIntentId) => {
        // Service role: a guest may insert a booking row but not update one.
        const service = createServiceClient()
        const row = trip.bookingRow('card', paymentIntentId, quote.feeCents)
        if (previous) {
          const { data: moved, error } = await service
            .from('stripe_bookings')
            .update({ ...row, updated_at: new Date().toISOString() })
            .eq('stripe_checkout_session_id', previous)
            .eq('status', 'pending')
            .select('id')
          if (error) throw error
          if (moved && moved.length > 0) return null
        }
        const { error } = await service.from('stripe_bookings').insert(row)
        if (error) throw error
        return null
      },
    })
  } catch (error) {
    console.error('[checkout] Card payment failed:', error)
    return { ok: false, code: 'failed' }
  }
}
