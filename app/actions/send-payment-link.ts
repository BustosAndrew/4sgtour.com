'use server'

import { stripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'
import { getSiteUrl } from '@/lib/site-url'
import Twilio from 'twilio'

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

export async function sendPaymentLinkSms(params: SendPaymentLinkParams) {
  const {
    packageId,
    tripId,
    tripTitle,
    customerName,
    customerEmail,
    customerPhone,
    startDate,
    endDate,
    roomType,
    packageName,
    totalPrice,
    golfCourses,
    mealOption,
    transportOption,
    additionalRequests,
    guests,
  } = params

  if (!customerPhone.trim()) {
    throw new Error('Phone number is required to send a payment link')
  }

  const supabase = await createClient()

  // Get the package
  const { data: pkg, error: pkgError } = await supabase
    .from('packages')
    .select('id, name, price, stripe_product_id, stripe_price_id')
    .eq('id', packageId)
    .single()

  if (pkgError || !pkg) {
    throw new Error('Package not found')
  }

  // Calculate 30% deposit
  const depositPercentage = 30
  const depositAmount = Math.round(totalPrice * 0.3 * 100) // cents
  const remainingBalance = Math.round((totalPrice - depositAmount / 100) * 100) / 100

  // Calculate auto-charge date for the remaining 70% balance.
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

  // Build line items (no card fee for SMS — they choose method on hosted page)
  const lineItems: any[] = [
    {
      price_data: {
        currency: 'usd',
        product_data: {
          name: `${tripTitle} - ${packageName} (30% Deposit)`,
          description: `Travel dates: ${startDate} to ${endDate}. Room: ${roomType}.`,
        },
        unit_amount: depositAmount,
      },
      quantity: 1,
    },
  ]

  // Get current user if logged in
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const appUrl = getSiteUrl()

  // Create a HOSTED checkout session (produces a shareable URL)
  const session = await stripe.checkout.sessions.create({
    line_items: lineItems,
    mode: 'payment',
    success_url: `${appUrl}/bookings?success=true`,
    cancel_url: `${appUrl}/trips`,
    customer_email: customerEmail,
    // Allow both payment methods on the hosted page
    payment_method_types: ['card', 'us_bank_account'],
    // Save the payment method for off-session use so the cron job can
    // auto-charge the remaining 70% balance on the auto_charge_date.
    payment_intent_data: {
      setup_future_usage: 'off_session',
    },
    metadata: {
      site_url: appUrl,
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
      payment_method: 'sms_link',
      is_guest: user ? 'false' : 'true',
      total_price: String(totalPrice),
      deposit_percentage: String(depositPercentage),
      remaining_balance: String(remainingBalance),
      auto_charge_date: autoChargeDateIso,
    },
    // Expire after 24 hours
    expires_at: Math.floor(Date.now() / 1000) + 86400,
  })

  if (!session.url) {
    throw new Error('Failed to create payment link')
  }

  // Create a pending booking record in stripe_bookings
  const { error: bookingError } = await supabase
    .from('stripe_bookings')
    .insert({
      trip_id: tripId,
      package_id: packageId,
      user_id: user?.id || null,
      site_url: appUrl,
      stripe_checkout_session_id: session.id,
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: customerPhone,
      deposit_amount: depositAmount / 100,
      total_package_price: pkg.price,
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
      auto_charge_date: autoChargeDateOnly,
      remaining_balance_charged: false,
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
      },
    })

  if (bookingError) {
    console.error(
      '[v0] Error creating booking record for SMS link:',
      bookingError,
    )
  }

  // Save inquiry with payment link info
  const { error: inquiryError } = await supabase.from('inquiries').insert({
    site_url: appUrl,
    trip_id: tripId,
    trip_title: tripTitle,
    customer_name: customerName,
    customer_email: customerEmail,
    customer_phone: customerPhone,
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
    payment_link: session.url,
    stripe_session_id: session.id,
    payment_link_sent_at: new Date().toISOString(),
  })

  if (inquiryError) {
    console.error('[v0] Error saving inquiry for SMS link:', inquiryError)
  }

  // Send SMS via Twilio
  const twilioClient = Twilio(
    process.env.TWILIO_ACCOUNT_SID!,
    process.env.TWILIO_AUTH_TOKEN!,
  )

  await twilioClient.messages.create({
    to: customerPhone,
    from: process.env.TWILIO_PHONE_NUMBER!,
    body: `4 Seasons Golf Tour: Your payment link for ${tripTitle} is ready. Pay your 30% deposit ($${(depositAmount / 100).toFixed(2)}) here: ${session.url} The remaining balance of $${remainingBalance.toFixed(2)} will be automatically charged to the same payment method on ${autoChargeDateDisplay}. Reply STOP to opt out.`,
  })

  return { success: true }
}
