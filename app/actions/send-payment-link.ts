'use server'

import { randomUUID } from 'node:crypto'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { paymentLinkSessionKey } from '@/lib/payment-link-server'
import { getSiteUrl } from '@/lib/site-url'
import Twilio from 'twilio'
import { normalizeE164 } from '@/lib/phone'
import {
  BookingPriceError,
  resolveBookingPrice,
} from '@/lib/resolve-booking-price'
import {
  bankOrCardAmountText,
  calculatePaymentAmounts,
  type PaymentLinkResult,
} from '@/lib/booking-price'

interface SendPaymentLinkParams {
  packageId: string
  tripId: string
  tripTitle: string
  customerName: string
  customerEmail: string
  customerPhone: string
  startDate: string
  endDate: string
  roomType: string
  packageName: string
  totalPrice: number
  depositPercentage?: number
  paymentType?: 'deposit' | 'full'
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
 * Returns a result instead of throwing: Next.js replaces thrown server-action
 * errors with a generic message in production, and the payment screen needs
 * the reason (e.g. the price changed) to tell the customer what to do.
 */
export async function sendPaymentLinkSms(
  params: SendPaymentLinkParams,
): Promise<PaymentLinkResult> {
  try {
    return await sendPaymentLinkSmsInner(params)
  } catch (error) {
    if (error instanceof BookingPriceError) {
      console.warn('[sms-link] Refused payment link:', error.code, error.message)
      return { ok: false, code: error.code }
    }
    console.error('[sms-link] Failed to send payment link:', error)
    return { ok: false, code: 'CHECKOUT_FAILED' }
  }
}

async function sendPaymentLinkSmsInner(
  params: SendPaymentLinkParams,
): Promise<PaymentLinkResult> {
  const {
    packageId,
    tripId,
    tripTitle,
    customerName,
    customerEmail,

    startDate,
    endDate,
    roomType,
    golfCourses,
    mealOption,
    transportOption,
    additionalRequests,
    guests,
  } = params

  // Twilio needs E.164. The payment screen builds it from the country picker;
  // anything else is refused before a Stripe session or any row is created.
  const toPhone = normalizeE164(params.customerPhone)
  if (!toPhone) {
    return { ok: false, code: 'INVALID_PHONE' }
  }
  if (
    !process.env.TWILIO_ACCOUNT_SID ||
    !process.env.TWILIO_AUTH_TOKEN ||
    !process.env.TWILIO_PHONE_NUMBER
  ) {
    throw new Error('Twilio is not configured')
  }

  const supabase = await createClient()

  // Recompute the price from the database — never charge what the browser
  // sends. Also pins the package name to the package actually charged.
  const { totalPrice, depositPercentage, packageName, cardFeePercent } =
    await resolveBookingPrice(supabase, params)

  const isFullPayment = params.paymentType === 'full'
  // Same helper the payment screen uses, so the amount on screen, in the
  // text message and on Stripe's page are identical to the cent.
  const amounts = calculatePaymentAmounts(
    totalPrice,
    depositPercentage,
    isFullPayment ? 'full' : 'deposit',
    'sms',
    cardFeePercent,
  )
  const depositAmount = amounts.chargeCents // cents charged by this link
  const remainingBalance = amounts.remainingCents / 100

  // Calculate auto-charge date for the remaining balance.
  // Mirrors the logic in app/actions/stripe.ts so the cron picks these up.
  // - Trip > 60 days away: charge 60 days before the trip
  // - Trip 31-60 days away: charge 30 days before the trip
  // - Trip < 30 days away: charge immediately (cron will run next pass)
  const tripStartDate = new Date(startDate)
  const now = new Date()
  const daysUntilTrip = Math.floor(
    (tripStartDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
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
  const autoChargeDateIso = autoChargeDate.toISOString()
  const autoChargeDateOnly = autoChargeDateIso.split('T')[0]
  const autoChargeDateDisplay = autoChargeDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  // Get current user if logged in
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const appUrl = getSiteUrl()

  // The text links to /pay/[id] on this site, not straight to Stripe: there
  // the customer picks bank transfer or card, and a card payment carries the
  // card processing fee. One Stripe page can't take both methods and add the
  // fee only for cards, so the Stripe session is created when they choose
  // (app/api/pay/[id]/checkout). The id is the pending booking row's, chosen
  // here so it can go in the text before the row is written.
  const bookingId = randomUUID()
  const payUrl = `${appUrl}/pay/${bookingId}`
  const sessionKey = paymentLinkSessionKey(bookingId)
  // Every price in the text includes the card fee for card payers.
  const amountText = bankOrCardAmountText(depositAmount, cardFeePercent)
  const balanceText = bankOrCardAmountText(amounts.remainingCents, cardFeePercent)

  // The pending booking row IS the link: /pay/[id] reads it and fills in the
  // Stripe session, payment method and card fee when a method is chosen. So
  // it is written before the text goes out (a text pointing at a missing row
  // would be a dead link), and removed again if Twilio refuses.
  const { error: bookingError } = await supabase
    .from('stripe_bookings')
    .insert({
      id: bookingId,
      trip_id: tripId,
      package_id: packageId,
      user_id: user?.id || null,
      site_url: appUrl,
      stripe_checkout_session_id: sessionKey,
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: toPhone,
      deposit_amount: depositAmount / 100,
      total_package_price: totalPrice,
      total_price: totalPrice,
      trip_title: tripTitle,
      deposit_percentage: depositPercentage,
      processing_fee: 0,
      total_paid: depositAmount / 100,
      payment_method: 'sms_link',
      status: 'pending',
      // Auto-charge fields so the cron can collect the remaining balance
      trip_start_date: startDate,
      remaining_balance: remainingBalance,
      auto_charge_date: isFullPayment ? null : autoChargeDateOnly,
      remaining_balance_charged: isFullPayment, // nothing left to charge
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
        // Marks the row as an SMS link that /pay/[id] may open.
        sms_payment_link: true,
        // The trip's credit card fee when the link was texted: the price in
        // the text, the /pay page and the balance auto-charge all use it.
        card_fee_percent: cardFeePercent,
      },
    })

  if (bookingError) {
    console.error(
      '[sms-link] Error creating booking record for SMS link:',
      bookingError,
    )
    return { ok: false, code: 'CHECKOUT_FAILED' }
  }

  // If Twilio refuses (bad number, the customer previously replied STOP,
  // carrier block), nothing is left behind: the row is deleted and the
  // customer can fix the number and retry without duplicate bookings and
  // inquiries. Deleted with the service role — a guest can't delete under
  // RLS — scoped to the id generated above.
  const twilioClient = Twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN,
  )
  try {
    await twilioClient.messages.create({
      to: toPhone,
      from: process.env.TWILIO_PHONE_NUMBER,
      body: isFullPayment
        ? `4 Seasons Golf Tour: Your payment link for ${tripTitle} is ready. Pay in full (${amountText}) here: ${payUrl} Reply STOP to opt out.`
        : `4 Seasons Golf Tour: Your payment link for ${tripTitle} is ready. Pay your ${depositPercentage}% deposit (${amountText}) here: ${payUrl} The remaining balance (${balanceText}) will be automatically charged to the same payment method on ${autoChargeDateDisplay}. Reply STOP to opt out.`,
    })
  } catch (smsError) {
    console.error('[sms-link] Twilio refused the message:', smsError)
    const { error: deleteError } = await createServiceClient()
      .from('stripe_bookings')
      .delete()
      .eq('id', bookingId)
      .eq('status', 'pending')
    if (deleteError) {
      console.error('[sms-link] Could not remove unsent link row:', deleteError)
    }
    return { ok: false, code: 'SMS_FAILED' }
  }

  // Save inquiry with payment link info
  const { error: inquiryError } = await supabase.from('inquiries').insert({
    site_url: appUrl,
    trip_id: tripId,
    trip_title: tripTitle,
    customer_name: customerName,
    customer_email: customerEmail,
    customer_phone: toPhone,
    package_name: packageName,
    start_date: startDate,
    end_date: endDate,
    add_ons: [
      ...(golfCourses || []),
      mealOption ? `Meals: ${mealOption}` : null,
      transportOption ? `Transport: ${transportOption}` : null,
      roomType ? `Room: ${roomType}` : null,
    ].filter(Boolean),
    rounds: golfCourses?.length || 0,
    additional_requests: additionalRequests || '',
    total_price: totalPrice,
    guests: guests || [],
    status: 'contacted',
    payment_link: payUrl,
    stripe_session_id: sessionKey,
    payment_link_sent_at: new Date().toISOString(),
  })

  if (inquiryError) {
    console.error('[v0] Error saving inquiry for SMS link:', inquiryError)
  }

  return { ok: true, amounts, depositPercentage, cardFeePercent }
}
