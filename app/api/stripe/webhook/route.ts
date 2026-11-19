import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'
import { getSiteUrl } from '@/lib/site-url'
import Twilio from 'twilio'
import { getFromEmail, getAdminEmail } from '@/lib/site-email'
import { phoneForSms } from '@/lib/phone'
import { cardFeeCents } from '@/lib/booking-price'

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
    // US bank (ACH) payments: `completed` arrives while the money is still
    // clearing (payment_status 'unpaid'). The outcome comes days later.
    case 'checkout.session.async_payment_succeeded': {
      const session = event.data.object as Stripe.Checkout.Session
      await handleCheckoutComplete(session) // payment_status is now 'paid'
      break
    }
    case 'checkout.session.async_payment_failed': {
      const session = event.data.object as Stripe.Checkout.Session
      await handleCheckoutPaymentFailed(session)
      break
    }
    case 'checkout.session.expired': {
      const session = event.data.object as Stripe.Checkout.Session
      await handleCheckoutExpired(session)
      break
    }
    // Remaining-balance charges made by the cron. A bank account debit
    // returns 'processing' and settles here; card charges settle in the cron.
    case 'payment_intent.succeeded': {
      await handleBalanceChargeSucceeded(event.data.object as Stripe.PaymentIntent)
      break
    }
    case 'payment_intent.payment_failed': {
      await handleBalanceChargeFailed(event.data.object as Stripe.PaymentIntent)
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

  // 'unpaid' = a bank payment that is still clearing. Record it as
  // 'processing'; it is confirmed by async_payment_succeeded, which calls
  // this function again with payment_status 'paid'.
  const processing = session.payment_status === 'unpaid'

  console.log(
    `[v0] Processing ${processing ? 'pending bank payment for' : 'completed'} checkout:`,
    sessionId,
  )

  // Get payment intent to retrieve customer and payment method
  let stripeCustomerId: string | null = null
  let stripePaymentMethodId: string | null = null

  // A bank payment reaches this function twice (processing, then paid).
  // Reuse the Stripe customer saved the first time — creating a second one
  // would leave the saved payment method attached to the first, and the
  // balance auto-charge would fail.
  const { data: savedRow } = await supabase
    .from('stripe_bookings')
    .select('stripe_customer_id, stripe_payment_method_id')
    .eq('stripe_checkout_session_id', sessionId)
    .limit(1)
    .maybeSingle()
  if (savedRow?.stripe_customer_id) {
    stripeCustomerId = savedRow.stripe_customer_id
    stripePaymentMethodId = savedRow.stripe_payment_method_id
  } else if (session.payment_intent) {
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

  // Custom packages are paid from /package/[id]; no pending row exists for
  // them, so they get their own branch.
  if (metadata.is_custom_package === 'true') {
    await handleCustomPackagePayment(
      session,
      stripeCustomerId,
      stripePaymentMethodId,
      processing,
    )
    return
  }

  // Update booking status with customer and payment method info
  const { data: booking, error: updateError } = await supabase
    .from('stripe_bookings')
    .update({
      status: processing ? 'processing' : 'confirmed',
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
        // Recorded on the session when checkout started, so a booking made on
        // 4sgtour.de is still attributed to .de even though the webhook and
        // the cron jobs run on the .com deployment.
        site_url: metadata.site_url || null,
        stripe_checkout_session_id: sessionId,
        stripe_payment_intent_id: session.payment_intent as string,
        stripe_customer_id: stripeCustomerId,
        stripe_payment_method_id: stripePaymentMethodId,
        customer_name: metadata.customer_name,
        customer_email: metadata.customer_email,
        customer_phone: metadata.customer_phone,
        // There is no amount_cents column, and these three are NOT NULL —
        // the old insert named the former and omitted the latter, so this
        // reconciliation path could never succeed.
        deposit_amount: (session.amount_total || 0) / 100,
        total_paid: (session.amount_total || 0) / 100,
        total_package_price: metadata.total_price
          ? parseFloat(metadata.total_price)
          : (session.amount_total || 0) / 100,
        payment_method: metadata.payment_method,
        status: processing ? 'processing' : 'confirmed',
        trip_title: metadata.trip_title,
        total_price: metadata.total_price
          ? parseFloat(metadata.total_price)
          : null,
        deposit_percentage: metadata.deposit_percentage
          ? parseInt(metadata.deposit_percentage)
          : 30,
        // Auto-charge fields from metadata ('' is not a valid DATE)
        trip_start_date: metadata.start_date || null,
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

  // A bank payment still clearing: tell the customer it's on its way, but
  // don't confirm anything until Stripe says the money arrived.
  if (processing) {
    await sendPaymentProcessingEmails(metadata, session)
    return
  }

  // Send confirmation emails
  await sendBookingConfirmationEmails(metadata, session, booking)

  // If this was a SMS payment link, update the inquiry status to converted
  // and send an invoice email to the customer. Links paid from /pay/[id]
  // carry the method actually chosen (card / ach) plus via_sms_link;
  // sessions texted before that page existed say 'sms_link'.
  if (metadata.payment_method === 'sms_link' || metadata.via_sms_link === 'true') {
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

/**
 * A payment started from /package/[id] (see app/api/package/[id]/checkout).
 * Deposit / full payments create the stripe_bookings row; a remainder
 * payment settles the open balance on the existing row. The package page
 * reads what has been paid from these rows via inquiry_id.
 *
 * Bank (ACH) payments arrive twice: first with `processing` true (money
 * still clearing — the row is written as 'processing', or a remainder is
 * marked by its payment intent id), then again from async_payment_succeeded
 * with `processing` false, which confirms it.
 */
async function handleCustomPackagePayment(
  session: Stripe.Checkout.Session,
  stripeCustomerId: string | null,
  stripePaymentMethodId: string | null,
  processing: boolean,
) {
  const metadata = session.metadata || {}
  const paymentIntentId = (session.payment_intent as string) || null
  const amountPaid = (session.amount_total || 0) / 100
  // Card sessions carry a processing-fee line (amount_total includes it).
  const processingFee = Math.max(0, parseFloat(metadata.processing_fee || '0') || 0)
  // Sessions started before the page split card and bank say 'sms_link'.
  const paymentMethod =
    metadata.payment_method === 'card' || metadata.payment_method === 'ach'
      ? metadata.payment_method
      : 'sms_link'
  const paymentType = metadata.payment_type || 'deposit'
  const now = new Date().toISOString()

  const inquiryId = await findCustomInquiryId(metadata)

  const title = metadata.custom_package_name || metadata.trip_title || 'Custom Package'
  const totalPrice = parseFloat(metadata.total_price || '') || amountPaid
  let booking: any = null

  if (paymentType === 'remainder') {
    // Already settled by an earlier delivery of this event?
    if (paymentIntentId) {
      const { data: settled } = await supabase
        .from('stripe_bookings')
        .select('id')
        .eq('remaining_balance_payment_intent_id', paymentIntentId)
        .eq('remaining_balance_charged', true)
        .limit(1)
      if (settled && settled.length > 0) {
        console.log('[custom-package] Remainder already recorded:', session.id)
        return
      }
    }

    const { data: open } = await supabase
      .from('stripe_bookings')
      .select('*')
      .eq('inquiry_id', inquiryId)
      .in('status', ['confirmed', 'completed'])
      .eq('remaining_balance_charged', false)
      .gt('remaining_balance', 0)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()

    if (open && processing) {
      // Mark the balance as being paid (the package page shows it as
      // processing and offers no second payment) without settling it.
      const { error } = await supabase
        .from('stripe_bookings')
        .update({ remaining_balance_payment_intent_id: paymentIntentId, updated_at: now })
        .eq('id', open.id)
      if (error) console.error('[custom-package] Error marking balance processing:', error)
      await sendPaymentProcessingEmails(metadata, session)
      return
    }

    if (open) {
      const { data: updated, error } = await supabase
        .from('stripe_bookings')
        .update({
          remaining_balance_charged: true,
          remaining_balance_charged_at: now,
          remaining_balance_payment_intent_id: paymentIntentId,
          total_paid: Number(open.total_paid || 0) + amountPaid,
          processing_fee: Number(open.processing_fee || 0) + processingFee,
          updated_at: now,
        })
        .eq('id', open.id)
        .select()
        .single()
      if (error) {
        console.error('[custom-package] Error settling balance:', error)
      }
      booking = updated || open
    } else {
      console.error(
        '[custom-package] Remainder paid but no open balance found for inquiry',
        inquiryId,
      )
    }
  }

  if (!booking) {
    // Deposit / full payment (or an unmatched remainder, recorded so the
    // money is never invisible to the admin).
    const remaining =
      paymentType === 'deposit'
        ? Math.max(0, parseFloat(metadata.remaining_balance || '0') || 0)
        : 0
    const dueDate = metadata.remainder_due_date || null
    // Auto-charge only when a reusable card was actually saved.
    const autoChargeDate =
      metadata.balance_flow === 'auto_charge' &&
      remaining > 0 &&
      dueDate &&
      stripeCustomerId &&
      stripePaymentMethodId
        ? dueDate
        : null
    const status = processing ? 'processing' : 'confirmed'

    const { data: existing } = await supabase
      .from('stripe_bookings')
      .select('id, status')
      .eq('stripe_checkout_session_id', session.id)
      .limit(1)
      .maybeSingle()

    if (existing && (existing.status !== 'processing' || processing)) {
      // Stripe retried an event we already handled.
      console.log('[custom-package] Payment already recorded:', session.id)
      return
    }

    if (existing) {
      // A bank payment that was processing has now cleared.
      const { data: confirmed, error } = await supabase
        .from('stripe_bookings')
        .update({
          status: 'confirmed',
          stripe_payment_intent_id: paymentIntentId,
          stripe_customer_id: stripeCustomerId,
          stripe_payment_method_id: stripePaymentMethodId,
          auto_charge_date: autoChargeDate,
          updated_at: now,
        })
        .eq('id', existing.id)
        .select()
        .single()
      if (error) console.error('[custom-package] Error confirming payment:', error)
      booking = confirmed
    } else {
      const { data: inserted, error } = await supabase
        .from('stripe_bookings')
        .insert({
          trip_id: metadata.trip_id || null,
          inquiry_id: inquiryId,
          user_id: null,
          site_url: metadata.site_url || null,
          stripe_checkout_session_id: session.id,
          stripe_payment_intent_id: paymentIntentId,
          stripe_customer_id: stripeCustomerId,
          stripe_payment_method_id: stripePaymentMethodId,
          customer_name: metadata.customer_name || 'Customer',
          customer_email:
            metadata.customer_email || session.customer_details?.email || '',
          customer_phone: metadata.customer_phone || null,
          deposit_amount: amountPaid - processingFee,
          processing_fee: processingFee,
          total_paid: amountPaid,
          total_package_price: totalPrice,
          total_price: totalPrice,
          trip_title: title,
          deposit_percentage: parseInt(metadata.deposit_percentage || '100') || 100,
          payment_method: paymentMethod,
          status,
          trip_start_date: metadata.start_date || null,
          remaining_balance: remaining,
          remainder_due_date: remaining > 0 ? dueDate : null,
          auto_charge_date: autoChargeDate,
          remaining_balance_charged: remaining <= 0,
          booking_details: {
            trip_title: title,
            package_name: title,
            start_date: metadata.start_date || '',
            end_date: metadata.end_date || '',
            room_type: '',
            golf_courses: [],
            meal_option: '',
            transport_option: '',
            additional_requests: '',
          },
        })
        .select()
        .single()

      if (error) {
        console.error('[custom-package] Error recording payment:', error)
      }
      booking = inserted
    }

    if (metadata.balance_flow === 'auto_charge' && remaining > 0 && !autoChargeDate) {
      console.error(
        '[custom-package] Auto-charge requested but no reusable card/due date was saved; the customer can pay the balance from the package page.',
        session.id,
      )
    }

    if (processing) {
      await sendPaymentProcessingEmails(metadata, session)
      return
    }
  }

  if (inquiryId) {
    const { error } = await supabase
      .from('inquiries')
      .update({ status: 'converted', updated_at: now })
      .eq('id', inquiryId)
    if (error) {
      console.error('[custom-package] Error updating inquiry status:', error)
    }
  }

  await sendBookingConfirmationEmails(metadata, session, booking)
  await sendInvoiceEmail(metadata, session)
}

/** Sessions from the package page carry inquiry_id; older ones only the trip id. */
async function findCustomInquiryId(metadata: Record<string, string>) {
  if (metadata.inquiry_id) return metadata.inquiry_id
  if (!metadata.trip_id) return null
  const { data } = await supabase
    .from('inquiries')
    .select('id')
    .eq('trip_id', metadata.trip_id)
    .eq('is_custom_package', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  return data?.id || null
}

/** A bank (ACH) checkout payment was returned / failed after processing. */
async function handleCheckoutPaymentFailed(session: Stripe.Checkout.Session) {
  const metadata = session.metadata || {}
  const paymentIntentId = (session.payment_intent as string) || null
  const now = new Date().toISOString()

  if (metadata.is_custom_package === 'true' && metadata.payment_type === 'remainder') {
    // Un-mark the balance so the package page offers payment again.
    if (paymentIntentId) {
      const { error } = await supabase
        .from('stripe_bookings')
        .update({ remaining_balance_payment_intent_id: null, updated_at: now })
        .eq('remaining_balance_payment_intent_id', paymentIntentId)
        .eq('remaining_balance_charged', false)
      if (error) console.error('[v0] Error clearing failed balance payment:', error)
    }
  } else {
    const { error } = await supabase
      .from('stripe_bookings')
      .update({ status: 'failed', updated_at: now })
      .eq('stripe_checkout_session_id', session.id)
    if (error) console.error('[v0] Error marking bank payment failed:', error)
  }

  const inquiryId =
    metadata.is_custom_package === 'true' ? await findCustomInquiryId(metadata) : null
  const siteUrl = (metadata.site_url || getSiteUrl()).replace(/\/+$/, '')
  const retry = inquiryId
    ? `You can try again, with a card or another bank account, from your package page:\n${siteUrl}/package/${inquiryId}`
    : `Please reply to this email or contact us and we'll help you complete your booking.`

  await sendSimpleEmails(metadata.site_url, {
    customerEmail: metadata.customer_email,
    customerSubject: `Payment not completed: ${metadata.trip_title}`,
    customerText: `Dear ${metadata.customer_name},

Unfortunately your bank payment of $${((session.amount_total || 0) / 100).toFixed(2)} for ${metadata.trip_title} did not go through, so it has not been completed.

${retry}

Best regards,
4 Seasons Golf Tour Team`,
    adminSubject: `Bank payment FAILED: ${metadata.trip_title} - ${metadata.customer_name}`,
    adminText: `BANK PAYMENT FAILED - ACTION REQUIRED

The customer's bank (ACH) payment was returned after processing. Nothing was collected.

Customer: ${metadata.customer_name}
Email: ${metadata.customer_email}
Phone: ${metadata.customer_phone}
Trip: ${metadata.trip_title}
Payment: ${getPaymentLabel(metadata)} - $${((session.amount_total || 0) / 100).toFixed(2)}
Stripe Session: ${session.id}
Payment Intent: ${paymentIntentId || 'n/a'}`,
  })
}

/**
 * A remaining-balance charge made by the charge cron settled. Card charges
 * settle synchronously (the cron records them); a bank debit returns
 * 'processing', which the cron records without remaining_balance_charged_at —
 * this fills it in.
 */
async function handleBalanceChargeSucceeded(paymentIntent: Stripe.PaymentIntent) {
  if (paymentIntent.metadata?.type !== 'remaining_balance') return

  const { data: booking } = await supabase
    .from('stripe_bookings')
    .select('*')
    .eq('remaining_balance_payment_intent_id', paymentIntent.id)
    .limit(1)
    .maybeSingle()
  if (!booking || booking.remaining_balance_charged_at) return // card: already recorded

  const amount = paymentIntent.amount_received / 100
  const now = new Date().toISOString()
  const { error } = await supabase
    .from('stripe_bookings')
    .update({
      remaining_balance_charged: true,
      remaining_balance_charged_at: now,
      total_paid: Number(booking.total_paid || 0) + amount,
      updated_at: now,
    })
    .eq('id', booking.id)
  if (error) console.error('[v0] Error recording settled balance charge:', error)

  const trip = booking.booking_details?.trip_title || booking.trip_title || 'your golf trip'
  await sendSimpleEmails(booking.site_url, {
    customerEmail: booking.customer_email,
    customerSubject: `Payment Confirmed: Remaining Balance for ${trip}`,
    customerText: `Dear ${booking.customer_name},

Your remaining balance of $${amount.toFixed(2)} for ${trip} has been received. Your trip is now fully paid — we look forward to seeing you soon.

Best regards,
4 Seasons Golf Tour Team`,
    adminSubject: `Remaining Balance Received: ${booking.customer_name} - ${trip}`,
    adminText: `REMAINING BALANCE RECEIVED (bank payment cleared)

Customer: ${booking.customer_name}
Email: ${booking.customer_email}
Trip: ${trip}
Amount: $${amount.toFixed(2)}
Booking ID: ${booking.id}`,
  })
}

/**
 * A remaining-balance charge made by the charge cron failed after
 * processing (bank debit returned). Re-open the balance, stop automatic
 * retries, and tell the admin and the customer.
 */
async function handleBalanceChargeFailed(paymentIntent: Stripe.PaymentIntent) {
  if (paymentIntent.metadata?.type !== 'remaining_balance') return

  const { data: booking } = await supabase
    .from('stripe_bookings')
    .select('*')
    .eq('remaining_balance_payment_intent_id', paymentIntent.id)
    .limit(1)
    .maybeSingle()
  // Card declines fail inside the cron before the id is stored — the cron
  // handles those itself.
  if (!booking) return

  const { error } = await supabase
    .from('stripe_bookings')
    .update({
      remaining_balance_charged: false,
      remaining_balance_charged_at: null,
      remaining_balance_payment_intent_id: null,
      // Don't keep re-debiting a bank account that bounced; the customer
      // pays another way (package page for custom packages, or the admin).
      auto_charge_date: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', booking.id)
  if (error) console.error('[v0] Error reopening failed balance charge:', error)

  const trip = booking.booking_details?.trip_title || booking.trip_title || 'your golf trip'
  const siteUrl = (booking.site_url || getSiteUrl()).replace(/\/+$/, '')
  const amount = `$${Number(booking.remaining_balance || 0).toFixed(2)}`
  await sendSimpleEmails(booking.site_url, {
    customerEmail: booking.customer_email,
    customerSubject: `Action needed: remaining balance for ${trip}`,
    customerText: `Dear ${booking.customer_name},

The automatic payment of your remaining balance (${amount}) for ${trip} did not go through.

${
  booking.inquiry_id
    ? `You can pay it with a card or another bank account here:\n${siteUrl}/package/${booking.inquiry_id}`
    : `Please reply to this email or contact us so we can arrange payment.`
}

Best regards,
4 Seasons Golf Tour Team`,
    adminSubject: `Remaining balance FAILED: ${booking.customer_name} - ${trip}`,
    adminText: `REMAINING BALANCE PAYMENT FAILED - ACTION REQUIRED

The automatic bank debit for the remaining balance was returned. Automatic retries have been stopped for this booking.

Customer: ${booking.customer_name}
Email: ${booking.customer_email}
Phone: ${booking.customer_phone}
Trip: ${trip}
Remaining balance: ${amount}
Payment Intent: ${paymentIntent.id}
Reason: ${paymentIntent.last_payment_error?.message || 'n/a'}
Booking ID: ${booking.id}`,
  })
}

/** A bank (ACH) payment Stripe accepted but which has not cleared yet. */
async function sendPaymentProcessingEmails(
  metadata: Record<string, string>,
  session: Stripe.Checkout.Session,
) {
  const amount = `$${((session.amount_total || 0) / 100).toFixed(2)}`
  await sendSimpleEmails(metadata.site_url, {
    customerEmail: metadata.customer_email,
    customerSubject: `Payment received, now processing: ${metadata.trip_title}`,
    customerText: `Dear ${metadata.customer_name},

Thank you — we've received your bank payment of ${amount} (${getPaymentLabel(metadata)}) for ${metadata.trip_title}.

Bank transfers take up to 4 business days to clear. We'll email you as soon as it's confirmed; there's nothing else you need to do.

Best regards,
4 Seasons Golf Tour Team`,
    adminSubject: `Bank payment processing: ${metadata.trip_title} - ${metadata.customer_name}`,
    adminText: `BANK PAYMENT PROCESSING

A bank (ACH) payment was submitted and is clearing (up to 4 business days). The booking is held as "processing" and will be confirmed automatically when it clears, or marked failed if it is returned.

Customer: ${metadata.customer_name}
Email: ${metadata.customer_email}
Trip: ${metadata.trip_title}
Payment: ${getPaymentLabel(metadata)} - ${amount}
Stripe Session: ${session.id}`,
  })
}

async function sendSimpleEmails(
  siteUrl: string | null | undefined,
  email: {
    customerEmail?: string | null
    customerSubject: string
    customerText: string
    adminSubject: string
    adminText: string
  },
) {
  const resend = new Resend(process.env.RESEND_API_KEY)
  if (email.customerEmail) {
    try {
      await resend.emails.send({
        from: getFromEmail(siteUrl),
        to: email.customerEmail,
        subject: email.customerSubject,
        text: email.customerText,
      })
    } catch (error) {
      console.error('[v0] Error sending customer email:', error)
    }
  }
  try {
    await resend.emails.send({
      from: getFromEmail(siteUrl),
      to: getAdminEmail(siteUrl),
      replyTo: email.customerEmail || undefined,
      subject: email.adminSubject,
      text: email.adminText,
    })
  } catch (error) {
    console.error('[v0] Error sending admin email:', error)
  }
}

// Standard trip checkouts carry `package_name`; admin-created custom packages
// carry `custom_package_name` instead. Reading only the former printed
// "Package: undefined" on every custom-package confirmation.
function getPackageName(metadata: Record<string, string>) {
  return (
    metadata.package_name ||
    metadata.custom_package_name ||
    metadata.trip_title ||
    'Golf Package'
  )
}

// Label the amount by what was actually charged, instead of always claiming
// a 30% deposit (trips can set their own deposit %, and customers can pay in
// full).
function getPaymentLabel(metadata: Record<string, string>) {
  if (metadata.payment_type === 'remainder') return 'Remaining Balance'
  if (metadata.payment_type === 'full' || metadata.deposit_percentage === '100') {
    return 'Full Payment'
  }
  return `${metadata.deposit_percentage || '30'}% Deposit`
}

async function sendBookingConfirmationEmails(
  metadata: Record<string, string>,
  session: Stripe.Checkout.Session,
  booking: any,
) {
  const resend = new Resend(process.env.RESEND_API_KEY)
  const adminEmail = getAdminEmail(metadata.site_url)
  const isGuest = metadata.is_guest === 'true'
  const amountPaid = session.amount_total
    ? (session.amount_total / 100).toFixed(2)
    : '0.00'
  const packageName = getPackageName(metadata)
  const paymentLabel = getPaymentLabel(metadata)
  // Custom packages may have no dates or room type; don't print empty lines.
  const travelDates =
    metadata.start_date && metadata.end_date
      ? `${metadata.start_date} to ${metadata.end_date}`
      : metadata.start_date || ''
  const tripLines = [
    `Trip: ${metadata.trip_title}`,
    `Package: ${packageName}`,
    travelDates ? `Travel Dates: ${travelDates}` : '',
    metadata.room_type ? `Room Type: ${metadata.room_type}` : '',
  ]
    .filter(Boolean)
    .join('\n')
  const paymentMethodLabel =
    metadata.payment_method === 'ach'
      ? 'Bank Transfer (ACH)'
      : metadata.payment_method === 'card'
        ? 'Credit/Debit Card'
        : 'Online payment (card or bank)'
  const nextSteps =
    metadata.payment_type === 'remainder' || metadata.payment_type === 'full'
      ? 'Your trip is now fully paid. Our team will be in touch to confirm the final details of your trip.'
      : 'Our team will be in touch within 24-48 hours to confirm the details of your trip and discuss the remaining balance.'

  // Email to customer
  const customerEmailContent = `
Dear ${metadata.customer_name},

Thank you for booking your golf trip with 4 Seasons Golf Tour!

BOOKING CONFIRMATION
====================

${tripLines}

Payment Details:
- Amount Paid (${paymentLabel}): $${amountPaid}
- Payment Method: ${paymentMethodLabel}

${metadata.additional_requests ? `Additional Requests:\n${metadata.additional_requests}\n` : ''}

NEXT STEPS
==========
${nextSteps}

${
  isGuest
    ? `
CREATE AN ACCOUNT
=================
We noticed you booked as a guest. Create an account to:
- Track your booking status
- Communicate directly with our team
- Access exclusive member benefits

Sign up here: ${metadata.site_url || getSiteUrl()}/auth/sign-up
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
      from: getFromEmail(metadata.site_url),
      to: metadata.customer_email,
      subject: `Booking Confirmed: ${metadata.trip_title}`,
      text: customerEmailContent,
    })
    console.log('[v0] Customer confirmation email sent')
  } catch (error) {
    console.error('[v0] Error sending customer email:', error)
  }

  // Send booking confirmation SMS
  const smsTo = phoneForSms(metadata.customer_phone)
  if (
    smsTo &&
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_PHONE_NUMBER
  ) {
    try {
      const twilioClient = Twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN,
      )
      const smsDates =
        metadata.start_date && metadata.end_date
          ? ` (${metadata.start_date} – ${metadata.end_date})`
          : ''
      const smsWhat =
        metadata.payment_type === 'remainder'
          ? `Your remaining balance for ${metadata.trip_title} has been received — your trip is fully paid!`
          : `Your booking for ${metadata.trip_title}${smsDates} has been confirmed!`
      await twilioClient.messages.create({
        to: smsTo,
        from: process.env.TWILIO_PHONE_NUMBER,
        body: `4 Seasons Golf Tour: ${smsWhat} A confirmation email has been sent to ${metadata.customer_email}. Reply STOP to opt out.`,
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
${tripLines.replace(/^/gm, '- ')}

Payment:
- Amount Paid (${paymentLabel}): $${amountPaid}
- Payment Method: ${paymentMethodLabel}
- Stripe Session ID: ${session.id}
- Payment Intent: ${session.payment_intent}

${metadata.additional_requests ? `Additional Requests:\n${metadata.additional_requests}\n` : ''}

---
Booking ID: ${booking?.id || 'N/A'}
  `.trim()

  // Send admin email
  try {
    await resend.emails.send({
      from: getFromEmail(metadata.site_url),
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

  // Parse auto-charge details from metadata so we can clearly notify the
  // customer when (and how much) their remaining balance will be charged.
  const remainingBalanceRaw = metadata.remaining_balance
  const remainingBalance = remainingBalanceRaw
    ? parseFloat(remainingBalanceRaw)
    : 0
  const autoChargeDateRaw = metadata.auto_charge_date
  const autoChargeDateDisplay = autoChargeDateRaw
    ? new Date(autoChargeDateRaw).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null

  const paidByCard = metadata.payment_method === 'card'
  const processingFee = parseFloat(metadata.processing_fee || '0') || 0
  const balanceFeeCents = paidByCard ? cardFeeCents(Math.round(remainingBalance * 100)) : 0

  const autoChargeSection =
    remainingBalance > 0 && autoChargeDateDisplay
      ? `

REMAINING BALANCE - AUTOMATIC CHARGE
------------------------------------
Remaining Balance: $${remainingBalance.toFixed(2)}${
          balanceFeeCents > 0
            ? `\nCard Processing Fee (4%): $${(balanceFeeCents / 100).toFixed(2)}\nTo Be Charged: $${(remainingBalance + balanceFeeCents / 100).toFixed(2)}`
            : ''
        }
Scheduled Charge Date: ${autoChargeDateDisplay}

The remaining balance will be automatically charged to the same payment
method used for your deposit on the date above. No action is required from
you. If you need to update your payment method or have any questions,
please contact us before that date.`
      : ''

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
Package: ${getPackageName(metadata)}
${metadata.start_date ? `Travel Dates: ${metadata.start_date}${metadata.end_date ? ` to ${metadata.end_date}` : ''}` : ''}
${metadata.room_type ? `Room Type: ${metadata.room_type}` : ''}
${golfCourses.length > 0 ? `Golf Courses: ${golfCourses.join(', ')}` : ''}
${metadata.meal_option ? `Meals: ${metadata.meal_option}` : ''}
${metadata.transport_option ? `Transportation: ${metadata.transport_option}` : ''}

PAYMENT SUMMARY
---------------
${getPaymentLabel(metadata)} Paid: $${amountPaid}${
    processingFee > 0
      ? ` (includes 4% card processing fee of $${processingFee.toFixed(2)})`
      : ''
  }
Payment Method: ${
    paidByCard
      ? 'Card (Text Message Payment Link)'
      : metadata.payment_method === 'ach'
        ? 'US Bank Account (Text Message Payment Link)'
        : 'Text Message Payment Link'
  }
Status: PAID
${autoChargeSection}

${metadata.additional_requests ? `\nADDITIONAL REQUESTS\n-------------------\n${metadata.additional_requests}\n` : ''}

NEXT STEPS
----------
Our team will be in touch within 24-48 hours to confirm the details of your trip.${remainingBalance > 0 && autoChargeDateDisplay ? ` Your remaining balance of $${remainingBalance.toFixed(2)} will be charged automatically on ${autoChargeDateDisplay}.` : ''}

Thank you for choosing 4 Seasons Golf Tour!

---
4 Seasons Golf Tour
Website: ${metadata.site_url || getSiteUrl()}
Email: ${getAdminEmail(metadata.site_url)}
  `.trim()

  try {
    await resend.emails.send({
      from: getFromEmail(metadata.site_url),
      to: metadata.customer_email,
      subject: `Invoice: ${metadata.trip_title} - Payment Confirmed`,
      text: invoiceContent,
    })
    console.log('[v0] Invoice email sent to customer via SMS link payment')
  } catch (error) {
    console.error('[v0] Error sending invoice email:', error)
  }
}
