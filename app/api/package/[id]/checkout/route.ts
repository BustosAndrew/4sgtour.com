import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { getSiteUrl } from '@/lib/site-url'
import { loadCustomPackage } from '@/lib/custom-package-server'
import { cardFeeCents } from '@/lib/booking-price'
import {
  getCustomPackageState,
  type CustomPaymentType,
} from '@/lib/custom-package'

// Starts payment for a custom package. The package page posts here when the
// customer presses a Pay button; we work out what is owed *now* from the
// database, create a fresh Stripe Checkout Session and redirect to it.
//
// Creating the session on demand (instead of when the admin builds the
// package) means links never expire — Stripe caps a session at 24 hours —
// and an admin's price edit always reaches the customer.

const PAYMENT_TYPES: CustomPaymentType[] = ['deposit', 'full', 'remainder']

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const form = await request.formData().catch(() => null)
  const type = String(form?.get('type') || '') as CustomPaymentType
  // Each Pay button names its method, so a card session can carry the card
  // processing fee and a bank session can't be paid by card without it.
  const method = String(form?.get('method') || '')

  const data = await loadCustomPackage(id)
  if (!data) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  const { inquiry, bookings } = data
  const siteUrl = (inquiry.site_url || getSiteUrl()).replace(/\/+$/, '')
  const packageUrl = `${siteUrl}/package/${id}`
  const backWith = (error: string) =>
    NextResponse.redirect(`${packageUrl}?error=${error}`, 303)

  if (!PAYMENT_TYPES.includes(type)) return backWith('invalid_request')
  if (method !== 'card' && method !== 'ach') return backWith('invalid_request')

  const state = getCustomPackageState(inquiry, bookings)
  if (!state.allowed.includes(type)) {
    // Already paid, auto-charge pending, or a stale page offering an option
    // that no longer applies.
    return backWith(state.stage === 'paid' ? 'already_paid' : 'not_available')
  }
  if (state.totalCents <= 0) return backWith('not_available')

  const amountCents =
    type === 'deposit'
      ? state.depositCents
      : type === 'full'
        ? state.totalCents
        : state.remainingCents
  if (amountCents <= 0) return backWith('not_available')
  const feeCents = method === 'card' ? cardFeeCents(amountCents) : 0

  const remainingAfterCents =
    type === 'deposit' ? state.totalCents - state.depositCents : 0
  const title = inquiry.trip_title || 'Custom Package'
  const label =
    type === 'deposit'
      ? `${state.depositPercentage}% Deposit`
      : type === 'full'
        ? 'Full Payment'
        : 'Remaining Balance'

  // Save the payment method for the cron to charge the balance — only when
  // the admin chose auto-charge and there will be a balance left.
  const saveCardForBalance =
    type === 'deposit' &&
    state.balanceFlow === 'auto_charge' &&
    remainingAfterCents > 0

  const lineItems = [
    {
      price_data: {
        currency: 'usd',
        product_data: {
          name: `${title} (${label})`,
          description:
            inquiry.custom_package_description?.slice(0, 500) ||
            `Custom package for ${inquiry.customer_name || 'you'}`,
        },
        unit_amount: amountCents,
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

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: lineItems,
      success_url: `${siteUrl}/checkout/custom/success?package=${id}`,
      cancel_url: packageUrl,
      customer_email: inquiry.customer_email || undefined,
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
      ...(saveCardForBalance
        ? {
            customer_creation: 'always' as const,
            payment_intent_data: {
              setup_future_usage: 'off_session' as const,
            },
          }
        : {}),
      metadata: {
        is_custom_package: 'true',
        inquiry_id: id,
        trip_id: inquiry.trip_id || '',
        trip_title: title,
        custom_package_name: title,
        site_url: siteUrl,
        payment_type: type,
        payment_method: method,
        processing_fee: String(feeCents / 100),
        balance_flow: state.balanceFlow,
        total_price: String(state.totalCents / 100),
        deposit_percentage: String(
          type === 'deposit' ? state.depositPercentage : 100,
        ),
        remaining_balance: String(remainingAfterCents / 100),
        remainder_due_date: inquiry.remainder_due_date || '',
        auto_charge_date:
          saveCardForBalance && inquiry.remainder_due_date
            ? inquiry.remainder_due_date
            : '',
        customer_name: inquiry.customer_name || '',
        customer_email: inquiry.customer_email || '',
        customer_phone: inquiry.customer_phone || '',
        start_date: inquiry.start_date || '',
        end_date: inquiry.end_date || '',
      },
    })

    if (!session.url) throw new Error(`Session ${session.id} has no url`)
    return NextResponse.redirect(session.url, 303)
  } catch (error) {
    console.error('[custom-package] Failed to create checkout session:', error)
    return backWith('checkout_failed')
  }
}
