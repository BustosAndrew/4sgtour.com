import 'server-only'

import type Stripe from 'stripe'
import type { CardFeeFacts } from '@/lib/booking-price'
import type {
  CardPaymentErrorCode,
  CardPaymentResponse,
  CardQuote,
} from '@/lib/card-payment'

// Server half of card payments (see lib/card-payment.ts for the flow).

export interface EnteredCard extends CardFeeFacts {
  brand: string | null
  last4: string | null
}

/**
 * The card inside a ConfirmationToken from the Payment Element, or null if it
 * isn't a card. Throws if Stripe doesn't know the token.
 */
export async function readConfirmationTokenCard(
  stripe: Stripe,
  confirmationTokenId: string,
): Promise<EnteredCard | null> {
  if (!/^ctoken_[A-Za-z0-9]+$/.test(confirmationTokenId)) return null
  const token = await stripe.confirmationTokens.retrieve(confirmationTokenId)
  const preview = token.payment_method_preview
  if (!preview || preview.type !== 'card' || !preview.card) return null
  const address = preview.billing_details?.address
  return {
    funding: preview.card.funding,
    country: preview.card.country,
    billingCountry: address?.country,
    billingState: address?.state,
    billingPostalCode: address?.postal_code,
    brand: preview.card.brand || null,
    last4: preview.card.last4 || null,
  }
}

/**
 * Where an earlier payment attempt stands. `id` is whatever a booking row
 * records in stripe_checkout_session_id: a Checkout Session (cs_… — bank
 * transfers, and card payments made before the card form), a PaymentIntent
 * (pi_… — card payments), or a placeholder such as an unopened SMS link's
 * 'paylink_…', which can't be paid.
 *
 *   'paid' — money was taken (or a bank payment is clearing)
 *   'open' — could still be paid
 *   'gone' — can never be paid (expired, cancelled, unknown to Stripe)
 */
export async function inspectPaymentAttempt(
  stripe: Stripe,
  id: string | null | undefined,
): Promise<'paid' | 'open' | 'gone'> {
  try {
    if (id?.startsWith('cs_')) {
      const session = await stripe.checkout.sessions.retrieve(id)
      return session.status === 'complete'
        ? 'paid'
        : session.status === 'open'
          ? 'open'
          : 'gone'
    }
    if (id?.startsWith('pi_')) {
      const intent = await stripe.paymentIntents.retrieve(id)
      if (['succeeded', 'processing', 'requires_capture'].includes(intent.status)) {
        return 'paid'
      }
      return intent.status === 'canceled' ? 'gone' : 'open'
    }
  } catch (error: any) {
    // Not in this Stripe account (e.g. made with another key): it can never
    // be paid here.
    if (error?.code === 'resource_missing') return 'gone'
    throw error
  }
  return 'gone'
}

/**
 * Closes an earlier attempt so it can't be paid alongside a new one: expires
 * an open Checkout Session, cancels an unpaid PaymentIntent. Returns 'paid'
 * if it turns out to have been paid already (the caller must then stop).
 * Throws when Stripe can't be reached — the caller must not start a second
 * payment then either.
 */
export async function closePaymentAttempt(
  stripe: Stripe,
  id: string | null | undefined,
): Promise<'paid' | 'closed'> {
  const state = await inspectPaymentAttempt(stripe, id)
  if (state !== 'open') return state === 'paid' ? 'paid' : 'closed'
  try {
    if (id!.startsWith('cs_')) await stripe.checkout.sessions.expire(id!)
    else await stripe.paymentIntents.cancel(id!)
    return 'closed'
  } catch (error) {
    // Paid in the moment between looking and closing?
    if ((await inspectPaymentAttempt(stripe, id)) === 'paid') return 'paid'
    throw error
  }
}

/** A card error from Stripe, as one of our codes. */
export function cardErrorCode(error: any): CardPaymentErrorCode {
  const code = error?.code
  const decline = error?.decline_code
  if (code === 'expired_card' || decline === 'expired_card') return 'expired_card'
  if (code === 'incorrect_cvc' || decline === 'incorrect_cvc') return 'incorrect_cvc'
  if (decline === 'insufficient_funds') return 'insufficient_funds'
  if (code === 'payment_intent_authentication_failure') return 'authentication_failed'
  if (error?.type === 'StripeCardError' || code === 'card_declined') return 'card_declined'
  return 'failed'
}

export interface StartCardPaymentOptions {
  confirmationTokenId: string
  /** The quote the customer accepted — what is charged */
  quote: CardQuote
  /** The booking's credit card fee, kept in metadata for the webhook */
  bookingFeePercent: number
  /** Keep the card for the balance auto-charge (setup_future_usage) */
  saveForLater: boolean
  description: string
  /**
   * Everything the webhook needs to record the payment — the same keys a
   * Checkout Session for this payment would carry.
   */
  metadata: Record<string, string>
  /**
   * Runs after the PaymentIntent exists and before it is confirmed: point
   * the booking row at it, so the webhook (which can arrive within a second
   * of confirming) always finds the row. Return an error code to abandon the
   * payment instead; the intent is then cancelled, never charged.
   */
  beforeConfirm?: (paymentIntentId: string) => Promise<CardPaymentErrorCode | null>
}

/**
 * Creates the PaymentIntent for exactly the quoted total and confirms it
 * with the customer's card. The webhook's payment_intent.succeeded records
 * the payment (metadata.card_payment = 'true'), as checkout.session.completed
 * does for bank transfers — this function writes nothing itself.
 */
export async function startCardPayment(
  stripe: Stripe,
  options: StartCardPaymentOptions,
): Promise<CardPaymentResponse> {
  const { quote } = options
  let intent: Stripe.PaymentIntent
  try {
    intent = await stripe.paymentIntents.create({
      amount: quote.totalCents,
      currency: 'usd',
      payment_method_types: ['card'],
      ...(options.saveForLater ? { setup_future_usage: 'off_session' as const } : {}),
      description: options.description.slice(0, 1000),
      // No receipt_email: in live mode it makes Stripe send its own receipt
      // whatever the dashboard says; our confirmation emails cover it, as
      // they do for Checkout.
      metadata: {
        ...options.metadata,
        card_payment: 'true',
        payment_method: 'card',
        // The fee charged, exact for this card — the webhook never adjusts it.
        processing_fee: String(quote.feeCents / 100),
        card_fee_percent: String(options.bookingFeePercent),
        card_fee_applied_percent: String(quote.feePercent),
        card_funding: quote.funding,
      },
    })
  } catch (error) {
    console.error('[card-payment] Could not create the payment:', error)
    return { ok: false, code: 'failed' }
  }

  const cancel = async () => {
    try {
      await stripe.paymentIntents.cancel(intent.id)
    } catch (error) {
      console.error(`[card-payment] Could not cancel ${intent.id}:`, error)
    }
  }

  if (options.beforeConfirm) {
    let refusal: CardPaymentErrorCode | null
    try {
      refusal = await options.beforeConfirm(intent.id)
    } catch (error) {
      console.error('[card-payment] Could not record the payment attempt:', error)
      refusal = 'failed'
    }
    if (refusal) {
      await cancel()
      return { ok: false, code: refusal }
    }
  }

  let confirmed: Stripe.PaymentIntent
  try {
    confirmed = await stripe.paymentIntents.confirm(intent.id, {
      confirmation_token: options.confirmationTokenId,
    })
  } catch (error: any) {
    const code = cardErrorCode(error)
    if (code === 'failed') console.error('[card-payment] Confirm failed:', error)
    else console.warn(`[card-payment] ${intent.id} declined:`, error?.decline_code || error?.code)
    // Nothing was charged. Close it so it can't be completed later; the
    // customer tries again with a new attempt.
    await cancel()
    return { ok: false, code, paymentIntentId: intent.id }
  }

  if (confirmed.status === 'succeeded' || confirmed.status === 'processing') {
    return { ok: true, status: confirmed.status, paymentIntentId: confirmed.id }
  }
  if (confirmed.status === 'requires_action' && confirmed.client_secret) {
    return {
      ok: true,
      status: 'requires_action',
      clientSecret: confirmed.client_secret,
      paymentIntentId: confirmed.id,
    }
  }
  console.warn(`[card-payment] ${confirmed.id} ended as ${confirmed.status}`)
  await cancel()
  return { ok: false, code: 'card_declined', paymentIntentId: confirmed.id }
}
