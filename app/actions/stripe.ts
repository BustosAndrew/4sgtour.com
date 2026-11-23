'use server'

import { stripe } from '@/lib/stripe'
import { checkoutExpiresAt } from '@/lib/checkout-expiry'
import { createClient } from '@/lib/supabase/server'
import { getSiteUrl } from '@/lib/site-url'
import { normalizeE164 } from '@/lib/phone'
import {
  BookingPriceError,
  resolveBookingPrice,
} from '@/lib/resolve-booking-price'
import {
  calculatePaymentAmounts,
  cardFeeLineItem,
  type TripCheckoutResult,
} from '@/lib/booking-price'

interface CheckoutSessionParams {
  packageId: string
  tripId: string
  tripTitle: string
  paymentMethod: 'card' | 'ach'
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

/**
 * Creates the embedded Checkout Session. Returns a result instead of
 * throwing: Next.js replaces thrown server-action errors with a generic
 * message in production, and the payment screen needs to know *why* it
 * failed (e.g. the price changed) to tell the customer what to do.
 */
export async function createTripCheckoutSession(
  params: CheckoutSessionParams,
): Promise<TripCheckoutResult> {
  try {
    return await createTripCheckoutSessionInner(params)
  } catch (error) {
    if (error instanceof BookingPriceError) {
      console.warn('[checkout] Refused checkout:', error.code, error.message)
      return { ok: false, code: error.code }
    }
    console.error('[checkout] Failed to create checkout session:', error)
    return { ok: false, code: 'CHECKOUT_FAILED' }
  }
}

async function createTripCheckoutSessionInner(
  params: CheckoutSessionParams,
): Promise<TripCheckoutResult> {
  const {
    packageId,
    tripId,
    tripTitle,
    paymentMethod,
    paymentType,
    customerName,
    customerEmail,
    startDate,
    endDate,
    roomType,
    golfCourses,
    mealOption,
    transportOption,
    additionalRequests,
  } = params

  // Stored for the booking-confirmation text (sent by the webhook via
  // Twilio), so it must be E.164 — the payment screen builds it from the
  // country picker.
  const customerPhone = normalizeE164(params.customerPhone)
  if (!customerPhone) {
    return { ok: false, code: 'INVALID_PHONE' }
  }

  const supabase = await createClient()

  // The price is recomputed here from the database. `totalPrice` and
  // `depositPercentage` from the browser are only what the customer was
  // shown — if they disagree (stale page, edited trip, or a tampered
  // request) we refuse rather than charge an amount the customer never saw.
  // The package name is taken from the same row, so the receipt, email and
  // booking record always name the package actually being charged.
  const { totalPrice, depositPercentage, packageName, cardFeePercent } =
    await resolveBookingPrice(supabase, params)

  // Every amount comes from the same helper the payment screen uses, so what
  // the customer saw and what Stripe charges are identical to the cent.
  const isFullPayment = paymentType === 'full'
  const amounts = calculatePaymentAmounts(
    totalPrice,
    depositPercentage,
    isFullPayment ? 'full' : 'deposit',
    paymentMethod === 'ach' ? 'ach' : 'card',
    cardFeePercent,
  )
  const paymentAmountCents = amounts.paymentCents

  // Determine the line item description
  const paymentDescription = isFullPayment
    ? `${tripTitle} - ${packageName} (Full Payment)`
    : `${tripTitle} - ${packageName} (${depositPercentage}% Deposit)`

  // Build line items
  const lineItems: any[] = [
    {
      price_data: {
        currency: 'usd',
        product_data: {
          name: paymentDescription,
          description: `Travel dates: ${startDate} to ${endDate}. Room: ${roomType}.`,
        },
        unit_amount: paymentAmountCents,
      },
      quantity: 1,
    },
  ]

  // The trip's credit card fee. The webhook refunds it, in whole or part,
  // once Stripe reports a debit, prepaid, Canadian or Québec card.
  if (amounts.feeCents > 0) {
    const processingFee = amounts.feeCents
    lineItems.push({
      price_data: {
        currency: 'usd',
        product_data: cardFeeLineItem(cardFeePercent),
        unit_amount: processingFee,
      },
      quantity: 1,
    })
  }

  // Get current user if logged in
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Calculate remaining balance and auto-charge date
  // For full payments, remaining balance is 0
  const remainingBalance = amounts.remainingCents / 100
  const tripStartDate = new Date(startDate)
  const today = new Date()
  const daysUntilTrip = Math.ceil(
    (tripStartDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  )

  // Determine auto-charge date based on days until trip
  // If trip is more than 60 days away, charge 60 days before trip
  // If trip is less than 60 days away, charge 30 days from now (or before trip if less than 30 days)
  let autoChargeDate: Date
  if (daysUntilTrip > 60) {
    // Trip is more than 60 days away - charge 60 days before trip
    autoChargeDate = new Date(tripStartDate)
    autoChargeDate.setDate(autoChargeDate.getDate() - 60)
  } else if (daysUntilTrip > 30) {
    // Trip is 31-60 days away - charge 30 days before trip
    autoChargeDate = new Date(tripStartDate)
    autoChargeDate.setDate(autoChargeDate.getDate() - 30)
  } else {
    // Trip is less than 30 days away - charge immediately (will be handled at payment)
    autoChargeDate = new Date()
  }

  // Create checkout session with appropriate payment methods
  // Use payment_intent_data.setup_future_usage to save the payment method for future charges
  // Explicitly set payment_method_types to restrict to only the selected method
  const session = await stripe.checkout.sessions.create({
    ui_mode: 'embedded',
    redirect_on_completion: 'never',
    // Payable for 24 hours; the pending row is expired after that (webhook,
    // or the daily abandoned-checkout cleanup).
    expires_at: checkoutExpiresAt(),
    line_items: lineItems,
    mode: 'payment',
    // This explicitly restricts to only the selected payment method
    // 'card' = only card fields shown, 'us_bank_account' = only ACH shown
    payment_method_types:
      paymentMethod === 'ach' ? ['us_bank_account'] : ['card'],
    // Disable automatic payment methods to prevent Stripe from adding others
    // Also set up future usage to save the payment method for remaining balance charge
    payment_method_options:
      paymentMethod === 'card'
        ? { card: { request_three_d_secure: 'automatic' } }
        : {
            us_bank_account: {
              financial_connections: { permissions: ['payment_method'] },
            },
          },
    // Only save the payment method for off-session use when we'll need to
    // charge the remaining balance later (deposit payments). Applying
    // `setup_future_usage: 'off_session'` to full payments is unnecessary and
    // triggers stricter issuer scrutiny, which causes many cards to be
    // declined with a generic "contact the merchant / card issuer" message.
    ...(isFullPayment
      ? {}
      : {
          payment_intent_data: {
            setup_future_usage: 'off_session' as const, // Save payment method for future charges
          },
        }),
    customer_email: customerEmail,
    metadata: {
      site_url: getSiteUrl(),
      trip_id: tripId,
      trip_title: tripTitle,
      package_id: packageId,
      package_name: packageName,
      user_id: user?.id || '',
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: customerPhone,
      start_date: startDate,
      end_date: endDate,
      room_type: roomType,
      golf_courses: JSON.stringify(golfCourses || []),
      meal_option: mealOption || '',
      transport_option: transportOption || '',
      additional_requests: additionalRequests || '',
      payment_method: paymentMethod,
      payment_type: paymentType,
      deposit_percentage: String(depositPercentage),
      is_guest: user ? 'false' : 'true',
      total_price: String(totalPrice),
      remaining_balance: String(remainingBalance),
      auto_charge_date: autoChargeDate.toISOString(),
      // Read by the webhook to settle the fee to the card actually used.
      processing_fee: String(amounts.feeCents / 100),
      card_fee_percent: String(cardFeePercent),
    },
  })

  // Amounts for the booking record
  const totalAmountCents = amounts.chargeCents
  const processingFeeCents = amounts.feeCents

  // Create a pending booking record with auto-charge info
  // No .select() on this insert: reading the row back needs a SELECT policy
  // a guest doesn't have (and must not have — the old public SELECT policy
  // exposed every customer's booking to the anon key).
  const { error: bookingError } = await supabase
    .from('stripe_bookings')
    .insert({
      trip_id: tripId,
      package_id: packageId,
      user_id: user?.id || null,
      site_url: getSiteUrl(),
      stripe_checkout_session_id: session.id,
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: customerPhone,
      deposit_amount: paymentAmountCents / 100, // Store in dollars (could be deposit or full)
      total_package_price: totalPrice, // Use actual total price including extras
      total_price: totalPrice,
      trip_title: tripTitle,
      deposit_percentage: depositPercentage,
      processing_fee: processingFeeCents / 100, // Store in dollars
      total_paid: totalAmountCents / 100, // Store in dollars
      payment_method: paymentMethod,
      status: 'pending',
      // Auto-charge fields - for full payments, mark as already charged
      trip_start_date: startDate,
      remaining_balance: remainingBalance,
      auto_charge_date: isFullPayment ? null : autoChargeDate.toISOString().split('T')[0],
      remaining_balance_charged: isFullPayment, // True for full payments (no remaining balance)
      booking_details: {
        trip_title: tripTitle,
        package_name: packageName,
        start_date: startDate,
        end_date: endDate,
        room_type: roomType,
        golf_courses: golfCourses || [],
        meal_option: mealOption || '',
        transport_option: transportOption || '',
        additional_requests: additionalRequests || '',
        // The fee this booking was made with; the balance auto-charge uses
        // it even if the trip's fee changes later.
        card_fee_percent: cardFeePercent,
      },
    })

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
    amounts,
    depositPercentage,
    cardFeePercent,
  }
}
