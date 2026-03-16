'use server'

import { stripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'

interface CheckoutSessionParams {
  packageId: string
  tripId: string
  tripTitle: string
  paymentMethod: 'card' | 'ach'
  // Customer info - required for guests, prefilled for logged-in users
  customerName: string
  customerEmail: string
  customerPhone: string
  // Booking details
  startDate: string
  endDate: string
  roomType: string
  packageName: string
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
    customerName,
    customerEmail,
    customerPhone,
    startDate,
    endDate,
    roomType,
    packageName,
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

  // Calculate 30% deposit
  const depositAmount = Math.round(pkg.price * 0.3 * 100) // Convert to cents

  // Build line items
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

  // Add 4% processing fee for card payments
  if (paymentMethod === 'card') {
    const processingFee = Math.round(depositAmount * 0.04)
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
  const { data: { user } } = await supabase.auth.getUser()

  // Create checkout session with appropriate payment methods
  // Explicitly set payment_method_types to restrict to only the selected method
  const session = await stripe.checkout.sessions.create({
    ui_mode: 'embedded',
    redirect_on_completion: 'never',
    line_items: lineItems,
    mode: 'payment',
    // This explicitly restricts to only the selected payment method
    // 'card' = only card fields shown, 'us_bank_account' = only ACH shown
    payment_method_types: paymentMethod === 'ach' ? ['us_bank_account'] : ['card'],
    // Disable automatic payment methods to prevent Stripe from adding others
    payment_method_options: paymentMethod === 'card' 
      ? { card: { request_three_d_secure: 'automatic' } }
      : { us_bank_account: { financial_connections: { permissions: ['payment_method'] } } },
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
      is_guest: user ? 'false' : 'true',
    },
  })

  // Calculate amounts for the booking record
  const totalAmountCents = lineItems.reduce((sum, item) => sum + item.price_data.unit_amount, 0)
  const processingFeeCents = paymentMethod === 'card' ? Math.round(depositAmount * 0.04) : 0

  // Create a pending booking record
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
      deposit_amount: depositAmount / 100, // Store in dollars
      total_package_price: pkg.price,
      processing_fee: processingFeeCents / 100, // Store in dollars
      total_paid: totalAmountCents / 100, // Store in dollars
      payment_method: paymentMethod,
      status: 'pending',
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
