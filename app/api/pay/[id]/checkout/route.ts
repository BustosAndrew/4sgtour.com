import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { getSiteUrl } from '@/lib/site-url'
import { createServiceClient } from '@/lib/supabase/service'
import { cardFeeCents, toCents } from '@/lib/booking-price'
import {
  getPaymentLinkStage,
  loadPaymentLink,
  paymentLinkSessionKey,
} from '@/lib/payment-link-server'

// Starts payment for an SMS payment link. /pay/[id] posts here with the
// method the customer chose; we create a Stripe session for that method only
// — card with the card processing fee, bank without — and redirect to it.
//
// The amount was fixed when the link was texted (it's in the text), and is
// read from the pending stripe_bookings row, never from the request.

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const form = await request.formData().catch(() => null)
  const method = String(form?.get('method') || '')

  const row = await loadPaymentLink(id)
  if (!row) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  const siteUrl = (row.site_url || getSiteUrl()).replace(/\/+$/, '')
  const payUrl = `${siteUrl}/pay/${id}`
  const backWith = (error: string) =>
    NextResponse.redirect(`${payUrl}?error=${error}`, 303)

  if (method !== 'card' && method !== 'ach') return backWith('invalid_request')
  const stage = getPaymentLinkStage(row)
  if (stage !== 'payable') return backWith(stage === 'paid' ? 'already_paid' : 'expired')

  const paymentCents = toCents(Number(row.deposit_amount) || 0)
  if (paymentCents <= 0) return backWith('expired')
  const feeCents = method === 'card' ? cardFeeCents(paymentCents) : 0
  const isFullPayment = !!row.remaining_balance_charged
  const details = row.booking_details || {}
  const packageName = details.package_name || 'Golf Package'
  const tripTitle = row.trip_title || details.trip_title || 'Golf Trip'
  const label = isFullPayment
    ? 'Full Payment'
    : `${row.deposit_percentage || 30}% Deposit`

  // A previous press made a session the customer may still have open in
  // another tab. Close it first so the link can't be paid twice — and if it
  // was already paid (webhook not in yet), stop here.
  const previous = row.stripe_checkout_session_id
  if (previous && previous.startsWith('cs_')) {
    try {
      const old = await stripe.checkout.sessions.retrieve(previous)
      if (old.status === 'complete') return backWith('already_paid')
      if (old.status === 'open') await stripe.checkout.sessions.expire(previous)
    } catch (error) {
      console.error('[pay-link] Could not close the previous session:', error)
      return backWith('checkout_failed')
    }
  }

  const lineItems = [
    {
      price_data: {
        currency: 'usd',
        product_data: {
          name: `${tripTitle} - ${packageName} (${label})`,
          description: `Travel dates: ${details.start_date || ''} to ${details.end_date || ''}. Room: ${details.room_type || ''}.`,
        },
        unit_amount: paymentCents,
      },
      quantity: 1,
    },
  ]
  if (feeCents > 0) {
    lineItems.push({
      price_data: {
        currency: 'usd',
        product_data: {
          name: 'Card Processing Fee (4%)',
          description: 'Processing fee for card payments',
        },
        unit_amount: feeCents,
      },
      quantity: 1,
    })
  }

  let session
  try {
    session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: lineItems,
      // Public page — /bookings requires signing in, and most customers paying
      // from a text are guests.
      success_url: `${siteUrl}/checkout/custom/success`,
      cancel_url: payUrl,
      customer_email: row.customer_email || undefined,
      payment_method_types: method === 'card' ? ['card'] : ['us_bank_account'],
      ...(method === 'ach'
        ? {
            payment_method_options: {
              us_bank_account: {
                financial_connections: { permissions: ['payment_method' as const] },
              },
            },
          }
        : {}),
      // Save the payment method so the cron can charge the remaining balance
      // on auto_charge_date. Not needed (and it triggers stricter issuer
      // checks) when paying in full.
      ...(isFullPayment
        ? {}
        : { payment_intent_data: { setup_future_usage: 'off_session' as const } }),
      metadata: {
        site_url: siteUrl,
        trip_id: row.trip_id || '',
        trip_title: tripTitle,
        package_id: row.package_id || '',
        package_name: packageName,
        user_id: row.user_id || '',
        customer_name: row.customer_name || '',
        customer_email: row.customer_email || '',
        customer_phone: row.customer_phone || '',
        start_date: details.start_date || '',
        end_date: details.end_date || '',
        room_type: details.room_type || '',
        golf_courses: JSON.stringify(details.golf_courses || []),
        meal_option: details.meal_option || '',
        transport_option: details.transport_option || '',
        additional_requests: String(details.additional_requests || '').slice(0, 450),
        payment_method: method,
        processing_fee: String(feeCents / 100),
        via_sms_link: 'true',
        payment_type: isFullPayment ? 'full' : 'deposit',
        is_guest: row.user_id ? 'false' : 'true',
        total_price: String(row.total_price ?? ''),
        deposit_percentage: String(row.deposit_percentage || 30),
        remaining_balance: String(row.remaining_balance ?? 0),
        auto_charge_date: isFullPayment ? '' : row.auto_charge_date || '',
      },
    })
  } catch (error) {
    console.error('[pay-link] Failed to create checkout session:', error)
    return backWith('checkout_failed')
  }
  if (!session.url) {
    console.error('[pay-link] Session has no url:', session.id)
    return backWith('checkout_failed')
  }

  // Point the booking and its inquiry at the new session: the webhook
  // confirms the booking, and converts the inquiry, by session id.
  const supabase = createServiceClient()
  const { data: updatedRows, error: bookingError } = await supabase
    .from('stripe_bookings')
    .update({
      stripe_checkout_session_id: session.id,
      payment_method: method,
      processing_fee: feeCents / 100,
      total_paid: (paymentCents + feeCents) / 100,
      // checkout.session.expired for the session closed above may already
      // have marked this row expired.
      status: 'pending',
      updated_at: new Date().toISOString(),
    })
    .eq('id', row.id)
    // Unless an admin cancelled the link meanwhile (Admin → Payments): then
    // close the session just made instead of sending the customer to it.
    .is('booking_details->>admin_cancelled_at', null)
    .select('id')
  if (bookingError) {
    console.error('[pay-link] Error updating booking for new session:', bookingError)
  } else if (!updatedRows || updatedRows.length === 0) {
    try {
      await stripe.checkout.sessions.expire(session.id)
    } catch (error) {
      console.error('[pay-link] Could not close session for cancelled link:', error)
    }
    return backWith('expired')
  }

  const { error: inquiryError } = await supabase
    .from('inquiries')
    .update({ stripe_session_id: session.id, updated_at: new Date().toISOString() })
    .in('stripe_session_id', [previous || '', paymentLinkSessionKey(row.id)].filter(Boolean))
  if (inquiryError) {
    console.error('[pay-link] Error updating inquiry for new session:', inquiryError)
  }

  return NextResponse.redirect(session.url, 303)
}
