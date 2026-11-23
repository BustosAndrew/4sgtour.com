import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { linkSessionExpiresAt } from '@/lib/checkout-expiry'
import { closePaymentAttempt } from '@/lib/card-payment-server'
import {
  getPaymentLinkStage,
  loadPaymentLink,
  paymentLinkCharge,
  pointPaymentLinkAt,
} from '@/lib/payment-link-server'

// Starts a US bank (ACH) payment for an SMS payment link: /pay/[id] posts
// here, we create a Stripe Checkout Session for a bank transfer (no fee) and
// redirect to it. Card payments are made in the card form on /pay/[id]
// itself (/api/pay/[id]/card), which reads the card before charging so a
// debit card pays no fee.

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
  const charge = paymentLinkCharge(row)
  const payUrl = `${charge.siteUrl}/pay/${id}`
  const backWith = (error: string) =>
    NextResponse.redirect(`${payUrl}?error=${error}`, 303)

  if (method !== 'ach') return backWith('invalid_request')
  const stage = getPaymentLinkStage(row)
  if (stage !== 'payable') return backWith(stage === 'paid' ? 'already_paid' : 'expired')
  if (charge.paymentCents <= 0) return backWith('expired')

  // An earlier press made a session (or a card payment) the customer may
  // still have open in another tab. Close it first so the link can't be paid
  // twice — and if it was already paid (webhook not in yet), stop here.
  try {
    if ((await closePaymentAttempt(stripe, row.stripe_checkout_session_id)) === 'paid') {
      return backWith('already_paid')
    }
  } catch (error) {
    console.error('[pay-link] Could not close the previous payment:', error)
    return backWith('checkout_failed')
  }

  let session
  try {
    session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: { name: charge.description, description: charge.lineDescription },
            unit_amount: charge.paymentCents,
          },
          quantity: 1,
        },
      ],
      // Closes when the texted link does (24h after it was sent).
      expires_at: linkSessionExpiresAt(row.created_at),
      // Public page — /bookings requires signing in, and most customers paying
      // from a text are guests.
      success_url: `${charge.siteUrl}/checkout/custom/success`,
      cancel_url: payUrl,
      customer_email: row.customer_email || undefined,
      payment_method_types: ['us_bank_account'],
      payment_method_options: {
        us_bank_account: {
          financial_connections: { permissions: ['payment_method' as const] },
        },
      },
      // Save the payment method so the cron can charge the remaining balance
      // on auto_charge_date. Not needed (and it triggers stricter checks)
      // when paying in full.
      ...(charge.isFullPayment
        ? {}
        : { payment_intent_data: { setup_future_usage: 'off_session' as const } }),
      metadata: { ...charge.metadata, payment_method: 'ach', processing_fee: '0' },
    })
  } catch (error) {
    console.error('[pay-link] Failed to create checkout session:', error)
    return backWith('checkout_failed')
  }
  if (!session.url) {
    console.error('[pay-link] Session has no url:', session.id)
    return backWith('checkout_failed')
  }

  let pointed = false
  try {
    pointed = await pointPaymentLinkAt(row, session.id, {
      payment_method: 'ach',
      processing_fee: 0,
      total_paid: charge.paymentCents / 100,
    })
  } catch (error) {
    // The webhook reconciles a session it can't find a row for.
    console.error('[pay-link] Error updating booking for new session:', error)
    pointed = true
  }
  if (!pointed) {
    // An admin cancelled the link meanwhile: close the session just made
    // instead of sending the customer to it.
    try {
      await stripe.checkout.sessions.expire(session.id)
    } catch (error) {
      console.error('[pay-link] Could not close session for cancelled link:', error)
    }
    return backWith('expired')
  }

  return NextResponse.redirect(session.url, 303)
}
