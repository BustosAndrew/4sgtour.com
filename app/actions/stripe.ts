'use server'

import { stripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'

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
}

export async function createTripCheckoutSession(params: CheckoutSessionParams) {
  const {
    packageId,
    tripId,
    tripTitle,
    paymentMethod,
    paymentType,
    depositPercentage,
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
  } = params

  const supabase = await createClient()

  // Get the package with Stripe price info
  const { data: pkg, error: pkgError } = await supabase
    .from('packages')
    .select('id, name, price, stripe_product_id, stripe_price_id')
    .eq('id', packageId)
    .single()

  if (pkgError || !pkg) {
    throw new Error('Package not found')
  }

  // Calculate payment amount based on payment type (deposit or full)
  const isFullPayment = paymentType === 'full'
  const depositOnlyAmount = Math.round(totalPrice * (depositPercentage / 100) * 100) // Convert to cents
  const paymentAmountCents = isFullPayment ? Math.round(totalPrice * 100) : depositOnlyAmount

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

  // Add 4% processing fee for card payments
  if (paymentMethod === 'card') {
    const processingFee = Math.round(paymentAmountCents * 0.04)
    lineItems.push({
      price_data: {
        currency: 'usd',
        product_data: {
          name: 'Card Processing Fee (4%)',
          description: 'Processing fee for card payments',
        },
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
  const remainingBalance = isFullPayment ? 0 : totalPrice - paymentAmountCents / 100
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
    },
  })

  // Calculate amounts for the booking record
  const totalAmountCents = lineItems.reduce(
    (sum, item) => sum + item.price_data.unit_amount,
    0,
  )
  const processingFeeCents =
    paymentMethod === 'card' ? Math.round(paymentAmountCents * 0.04) : 0

  // Create a pending booking record with auto-charge info
  const { data: booking, error: bookingError } = await supabase
    .from('stripe_bookings')
    .insert({
      trip_id: tripId,
      package_id: packageId,
      user_id: user?.id || null,
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
      },
    })
    .select()
    .single()

  if (bookingError) {
    console.error('[v0] Error creating booking record:', bookingError)
    // Don't fail - we can reconcile from webhook
  }

  return session.client_secret
}
