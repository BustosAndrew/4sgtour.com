import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'
import Twilio from 'twilio'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-02-25.clover',
})

// Use service role for webhook (bypasses RLS)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

export async function POST(request: Request) {
  const body = await request.text()
  const headersList = await headers()
  const signature = headersList.get('stripe-signature')

  if (!signature || !webhookSecret) {
    console.error('[v0] Missing stripe signature or webhook secret')
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err: any) {
    console.error('[v0] Webhook signature verification failed:', err.message)
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 },
    )
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      await handleCheckoutComplete(session)
      break
    }
    case 'checkout.session.expired': {
      const session = event.data.object as Stripe.Checkout.Session
      await handleCheckoutExpired(session)
      break
    }
    default:
      console.log(`[v0] Unhandled event type: ${event.type}`)
  }

  return NextResponse.json({ received: true })
}

async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  const metadata = session.metadata || {}
  const sessionId = session.id

  console.log('[v0] Processing completed checkout:', sessionId)

  // Get payment intent to retrieve customer and payment method
  let stripeCustomerId: string | null = null
  let stripePaymentMethodId: string | null = null

  if (session.payment_intent) {
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(
        session.payment_intent as string,
      )
      stripeCustomerId = paymentIntent.customer as string | null
      stripePaymentMethodId = paymentIntent.payment_method as string | null

      // If no customer exists, create one and attach the payment method
      if (!stripeCustomerId && stripePaymentMethodId) {
        const customer = await stripe.customers.create({
          email: metadata.customer_email,
          name: metadata.customer_name,
          phone: metadata.customer_phone,
          metadata: {
            trip_id: metadata.trip_id,
            user_id: metadata.user_id || '',
          },
        })
        stripeCustomerId = customer.id

        // Attach the payment method to the customer
        await stripe.paymentMethods.attach(stripePaymentMethodId, {
          customer: stripeCustomerId,
        })

        // Set as default payment method
        await stripe.customers.update(stripeCustomerId, {
          invoice_settings: {
            default_payment_method: stripePaymentMethodId,
          },
        })
      }
    } catch (error) {
      console.error('[v0] Error retrieving payment intent details:', error)
    }
  }

  // Update booking status with customer and payment method info
  const { data: booking, error: updateError } = await supabase
    .from('stripe_bookings')
    .update({
      status: 'confirmed',
      stripe_payment_intent_id: session.payment_intent as string,
      stripe_customer_id: stripeCustomerId,
      stripe_payment_method_id: stripePaymentMethodId,
    })
    .eq('stripe_checkout_session_id', sessionId)
    .select()
    .single()

  if (updateError) {
    console.error('[v0] Error updating booking:', updateError)
    // Try to create the booking if it doesn't exist (reconciliation)
    const { error: insertError } = await supabase
      .from('stripe_bookings')
      .insert({
        trip_id: metadata.trip_id,
        package_id: metadata.package_id,
        user_id: metadata.user_id || null,
        stripe_checkout_session_id: sessionId,
        stripe_payment_intent_id: session.payment_intent as string,
        stripe_customer_id: stripeCustomerId,
        stripe_payment_method_id: stripePaymentMethodId,
        customer_name: metadata.customer_name,
        customer_email: metadata.customer_email,
        customer_phone: metadata.customer_phone,
        amount_cents: session.amount_total || 0,
        payment_method: metadata.payment_method,
        status: 'confirmed',
        // Auto-charge fields from metadata
        trip_start_date: metadata.start_date,
        remaining_balance: metadata.remaining_balance
          ? parseFloat(metadata.remaining_balance)
          : null,
        auto_charge_date: metadata.auto_charge_date
          ? metadata.auto_charge_date.split('T')[0]
          : null,
        remaining_balance_charged: false,
        booking_details: {
          trip_title: metadata.trip_title,
          package_name: metadata.package_name,
          start_date: metadata.start_date,
          end_date: metadata.end_date,
          room_type: metadata.room_type,
          golf_courses: JSON.parse(metadata.golf_courses || '[]'),
          meal_option: metadata.meal_option,
          transport_option: metadata.transport_option,
          additional_requests: metadata.additional_requests,
        },
      })

    if (insertError) {
      console.error('[v0] Error creating booking record:', insertError)
    }
  }

  // Send confirmation emails
  await sendBookingConfirmationEmails(metadata, session, booking)

  // If this was a SMS payment link, update the inquiry status to converted
  // and send an invoice email to the customer
  if (metadata.payment_method === 'sms_link') {
    const { error: inquiryError } = await supabase
      .from('inquiries')
      .update({
        status: 'converted',
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_session_id', sessionId)

    if (inquiryError) {
      console.error('[v0] Error updating inquiry status:', inquiryError)
    }

    // Send invoice email for SMS link payments
    await sendInvoiceEmail(metadata, session)
  }
}

async function handleCheckoutExpired(session: Stripe.Checkout.Session) {
  const sessionId = session.id

  // Update booking status to expired
  const { error } = await supabase
    .from('stripe_bookings')
    .update({ status: 'expired' })
    .eq('stripe_checkout_session_id', sessionId)

  if (error) {
    console.error('[v0] Error updating expired booking:', error)
  }
}

async function sendBookingConfirmationEmails(
  metadata: Record<string, string>,
  session: Stripe.Checkout.Session,
  booking: any,
) {
  const resend = new Resend(process.env.RESEND_API_KEY)
  const adminEmail = process.env.ADMIN_EMAIL || 'info@4sgtour.com'
  const isGuest = metadata.is_guest === 'true'
  const amountPaid = session.amount_total
    ? (session.amount_total / 100).toFixed(2)
    : '0.00'

  // Email to customer
  const customerEmailContent = `
Dear ${metadata.customer_name},

Thank you for booking your golf trip with 4 Seasons Golf Tour!

BOOKING CONFIRMATION
====================

Trip: ${metadata.trip_title}
Package: ${metadata.package_name}
Travel Dates: ${metadata.start_date} to ${metadata.end_date}
Room Type: ${metadata.room_type}

Payment Details:
- Amount Paid (30% Deposit): $${amountPaid}
- Payment Method: ${metadata.payment_method === 'ach' ? 'Bank Transfer (ACH)' : 'Credit/Debit Card'}

${metadata.additional_requests ? `Additional Requests:\n${metadata.additional_requests}\n` : ''}

NEXT STEPS
==========
Our team will be in touch within 24-48 hours to confirm the details of your trip and discuss the remaining balance.

${
  isGuest
    ? `
CREATE AN ACCOUNT
=================
We noticed you booked as a guest. Create an account to:
- Track your booking status
- Communicate directly with our team
- Access exclusive member benefits

Sign up here: ${process.env.NEXT_PUBLIC_APP_URL || 'https://4sgtour.com'}/auth/sign-up
`
    : ''
}

If you have any questions, please don't hesitate to contact us.

Best regards,
4 Seasons Golf Tour Team
  `.trim()

  // Send customer email
  try {
    await resend.emails.send({
      from: '4 Seasons Golf Tour <noreply@4sgtour.com>',
      to: metadata.customer_email,
      subject: `Booking Confirmed: ${metadata.trip_title}`,
      text: customerEmailContent,
    })
    console.log('[v0] Customer confirmation email sent')
  } catch (error) {
    console.error('[v0] Error sending customer email:', error)
  }

  // Send booking confirmation SMS
  if (
    metadata.customer_phone &&
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN
  ) {
    try {
      const twilioClient = Twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN,
      )
      await twilioClient.messages.create({
        to: metadata.customer_phone,
        from: process.env.TWILIO_PHONE_NUMBER!,
        body: `4 Seasons Golf Tour: Your booking for ${metadata.trip_title} (${metadata.start_date} – ${metadata.end_date}) has been confirmed! A confirmation email has been sent to ${metadata.customer_email}. Reply STOP to opt out.`,
      })
      console.log('[v0] Booking confirmation SMS sent')
    } catch (error) {
      console.error('[v0] Error sending booking confirmation SMS:', error)
    }
  }

  // Email to admin
  const adminEmailContent = `
NEW BOOKING RECEIVED

Customer Information:
- Name: ${metadata.customer_name}
- Email: ${metadata.customer_email}
- Phone: ${metadata.customer_phone}
- Account Type: ${isGuest ? 'Guest (no account)' : 'Registered User'}
${metadata.user_id ? `- User ID: ${metadata.user_id}` : ''}

Booking Details:
- Trip: ${metadata.trip_title}
- Package: ${metadata.package_name}
- Travel Dates: ${metadata.start_date} to ${metadata.end_date}
- Room Type: ${metadata.room_type}

Payment:
- Amount Paid: $${amountPaid}
- Payment Method: ${metadata.payment_method === 'ach' ? 'ACH' : 'Card'}
- Stripe Session ID: ${session.id}
- Payment Intent: ${session.payment_intent}

${metadata.additional_requests ? `Additional Requests:\n${metadata.additional_requests}\n` : ''}

---
Booking ID: ${booking?.id || 'N/A'}
  `.trim()

  // Send admin email
  try {
    await resend.emails.send({
      from: '4 Seasons Golf Tour <noreply@4sgtour.com>',
      replyTo: metadata.customer_email,
      to: adminEmail,
      subject: `New Booking: ${metadata.trip_title} - ${metadata.customer_name}`,
      text: adminEmailContent,
    })
    console.log('[v0] Admin notification email sent')
  } catch (error) {
    console.error('[v0] Error sending admin email:', error)
  }
}

async function sendInvoiceEmail(
  metadata: Record<string, string>,
  session: Stripe.Checkout.Session,
) {
  const resend = new Resend(process.env.RESEND_API_KEY)
  const amountPaid = session.amount_total
    ? (session.amount_total / 100).toFixed(2)
    : '0.00'
  const invoiceDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const golfCourses = (() => {
    try {
      return JSON.parse(metadata.golf_courses || '[]')
    } catch {
      return []
    }
  })()

  const invoiceContent = `
INVOICE - 4 Seasons Golf Tour
==============================

Invoice Date: ${invoiceDate}
Payment Reference: ${session.payment_intent || session.id}

BILL TO
-------
${metadata.customer_name}
${metadata.customer_email}
${metadata.customer_phone}

BOOKING DETAILS
--------------
Trip: ${metadata.trip_title}
Package: ${metadata.package_name}
Travel Dates: ${metadata.start_date} to ${metadata.end_date}
Room Type: ${metadata.room_type}
${golfCourses.length > 0 ? `Golf Courses: ${golfCourses.join(', ')}` : ''}
${metadata.meal_option ? `Meals: ${metadata.meal_option}` : ''}
${metadata.transport_option ? `Transportation: ${metadata.transport_option}` : ''}

PAYMENT SUMMARY
---------------
30% Deposit Paid: $${amountPaid}
Payment Method: Text Message Payment Link
Status: PAID

${metadata.additional_requests ? `\nADDITIONAL REQUESTS\n-------------------\n${metadata.additional_requests}\n` : ''}

NEXT STEPS
----------
Our team will be in touch within 24-48 hours to confirm the details of your trip and discuss the remaining balance.

Thank you for choosing 4 Seasons Golf Tour!

---
4 Seasons Golf Tour
Website: ${process.env.NEXT_PUBLIC_APP_URL || 'https://4sgtour.com'}
Email: ${process.env.ADMIN_EMAIL || 'info@4sgtour.com'}
  `.trim()

  try {
    await resend.emails.send({
      from: '4 Seasons Golf Tour <noreply@4sgtour.com>',
      to: metadata.customer_email,
      subject: `Invoice: ${metadata.trip_title} - Payment Confirmed`,
      text: invoiceContent,
    })
    console.log('[v0] Invoice email sent to customer via SMS link payment')
  } catch (error) {
    console.error('[v0] Error sending invoice email:', error)
  }
}
