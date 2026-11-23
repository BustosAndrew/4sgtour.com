import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { getSiteUrl } from '@/lib/site-url'
import type { CustomPaymentType } from '@/lib/custom-package'
import {
  CUSTOM_PAYMENT_TYPES,
  prepareCustomPackagePayment,
} from '@/lib/custom-package-checkout'

// Starts a US bank (ACH) payment for a custom package. The package page posts
// here when the customer presses a bank Pay button; we work out what is owed
// *now* from the database, create a fresh Stripe Checkout Session and
// redirect to it. Card payments are made in the card form on the package
// page itself (/api/package/[id]/card).
//
// Creating the session on demand (instead of when the admin builds the
// package) means links never expire — Stripe caps a session at 24 hours —
// and an admin's price edit always reaches the customer.

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const form = await request.formData().catch(() => null)
  const type = String(form?.get('type') || '') as CustomPaymentType
  const method = String(form?.get('method') || '')

  const backTo = (siteUrl: string, error: string) =>
    NextResponse.redirect(`${siteUrl}/package/${id}?error=${error}`, 303)

  if (!CUSTOM_PAYMENT_TYPES.includes(type) || method !== 'ach') {
    return backTo(getSiteUrl(), 'invalid_request')
  }
  const payment = await prepareCustomPackagePayment(id, type)
  if (!payment.ok) {
    if (payment.refusal === 'not_found') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    return backTo(payment.siteUrl, payment.refusal)
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: { name: payment.description, description: payment.lineDescription },
            unit_amount: payment.amountCents,
          },
          quantity: 1,
        },
      ],
      success_url: `${payment.siteUrl}/checkout/custom/success?package=${id}`,
      cancel_url: `${payment.siteUrl}/package/${id}`,
      customer_email: payment.inquiry.customer_email || undefined,
      payment_method_types: ['us_bank_account'],
      payment_method_options: {
        us_bank_account: {
          financial_connections: { permissions: ['payment_method' as const] },
        },
      },
      ...(payment.saveForLater
        ? {
            customer_creation: 'always' as const,
            payment_intent_data: { setup_future_usage: 'off_session' as const },
          }
        : {}),
      metadata: {
        ...payment.metadata,
        payment_method: 'ach',
        processing_fee: '0',
        card_fee_percent: String(payment.feePercent),
      },
    })

    if (!session.url) throw new Error(`Session ${session.id} has no url`)
    return NextResponse.redirect(session.url, 303)
  } catch (error) {
    console.error('[custom-package] Failed to create checkout session:', error)
    return backTo(payment.siteUrl, 'checkout_failed')
  }
}
