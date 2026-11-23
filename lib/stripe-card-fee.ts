import 'server-only'

import type Stripe from 'stripe'
import { cardFeeCents, cardFeePercentFor } from '@/lib/booking-price'

/**
 * The card fee percentage for charging a saved payment method, given the
 * booking's (getBookingCardFeePercent): the booking's fee for a credit card,
 * capped at 2.4% for a Canadian one, and 0 for a debit / prepaid card, a
 * Québec billing address, a bank account, or Stripe Link (which doesn't say
 * how it is funded). See cardFeePercentFor() in lib/booking-price.ts.
 *
 * Asked of Stripe rather than read from stripe_bookings.payment_method:
 * bookings paid through an SMS link or a custom-package page were recorded
 * as 'sms_link' whichever method the customer actually used.
 */
export async function cardFeePercentForPaymentMethod(
  stripe: Stripe,
  paymentMethodId: string,
  bookingPercent: number,
): Promise<number> {
  const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId)
  if (paymentMethod.type !== 'card') return 0
  const address = paymentMethod.billing_details?.address
  return cardFeePercentFor(
    {
      funding: paymentMethod.card?.funding,
      country: paymentMethod.card?.country,
      billingCountry: address?.country,
      billingState: address?.state,
      billingPostalCode: address?.postal_code,
    },
    bookingPercent,
  )
}

export interface CardFeeSettlement {
  /** Fee that was charged with the session, in cents */
  chargedFeeCents: number
  /** Fee kept after the card was known, in cents */
  keptFeeCents: number
  /** Refunded to the customer (chargedFeeCents - keptFeeCents) */
  refundedCents: number
  /** The percentage that applies to the card used */
  percent: number
}

/**
 * Card sessions are priced with the booking's credit-card fee before the
 * customer enters a card. Once the payment has gone through, look at the
 * card actually used and refund the part of the fee that doesn't apply: all
 * of it for a debit or prepaid card or a Québec billing address, the part
 * above 2.4% for a Canadian credit card.
 *
 * Idempotent: a webhook delivered again finds the refund already on the
 * charge and doesn't refund twice.
 *
 * Returns null when the session carried no fee, or when the card can't be
 * read (the fee is then left as charged, and logged, rather than guessed).
 */
export async function settleCardFee(
  stripe: Stripe,
  session: Stripe.Checkout.Session,
): Promise<CardFeeSettlement | null> {
  const metadata = session.metadata || {}
  const chargedFeeCents = Math.round(
    Math.max(0, parseFloat(metadata.processing_fee || '0') || 0) * 100,
  )
  const paymentIntentId =
    typeof session.payment_intent === 'string'
      ? session.payment_intent
      : session.payment_intent?.id
  if (chargedFeeCents <= 0 || !paymentIntentId) return null

  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId, {
      expand: ['latest_charge'],
    })
    const charge = paymentIntent.latest_charge as Stripe.Charge | null
    if (!charge || typeof charge === 'string' || charge.status !== 'succeeded') {
      console.error(
        `[card-fee] No settled charge on ${paymentIntentId}; fee left as charged`,
      )
      return null
    }

    const baseCents = Math.max(0, charge.amount - chargedFeeCents)
    // The percentage the session was priced with. Sessions from before it
    // was recorded in metadata were all priced at 4%; derive it either way.
    const recorded = parseFloat(metadata.card_fee_percent ?? '')
    const bookingPercent = Number.isFinite(recorded)
      ? recorded
      : baseCents > 0
        ? Math.round((chargedFeeCents / baseCents) * 10000) / 100
        : 0

    const details = charge.payment_method_details
    const address = charge.billing_details?.address
    const percent =
      details?.type === 'card'
        ? cardFeePercentFor(
            {
              funding: details.card?.funding,
              country: details.card?.country,
              billingCountry: address?.country,
              billingState: address?.state,
              billingPostalCode: address?.postal_code,
            },
            bookingPercent,
          )
        : 0
    const keptFeeCents = Math.min(chargedFeeCents, cardFeeCents(baseCents, percent))
    const refundCents = chargedFeeCents - keptFeeCents

    if (refundCents > 0 && charge.amount_refunded < refundCents) {
      await stripe.refunds.create(
        {
          payment_intent: paymentIntentId,
          amount: refundCents - charge.amount_refunded,
          reason: 'requested_by_customer',
          metadata: {
            kind: 'card_fee_adjustment',
            card_funding: details?.card?.funding || details?.type || 'unknown',
            card_country: details?.card?.country || '',
          },
        },
        { idempotencyKey: `card-fee-adjustment-${paymentIntentId}` },
      )
      console.log(
        `[card-fee] Refunded $${(refundCents / 100).toFixed(2)} of the card fee on ${paymentIntentId} (${details?.card?.funding || details?.type}, ${details?.card?.country || '?'})`,
      )
    }

    return { chargedFeeCents, keptFeeCents, refundedCents: refundCents, percent }
  } catch (error) {
    console.error(`[card-fee] Could not settle the card fee on ${paymentIntentId}:`, error)
    return null
  }
}

/**
 * The session as it stands after settleCardFee(): amount_total and the
 * processing_fee metadata reduced by the refund, so the booking row and the
 * confirmation emails show what the customer actually paid.
 */
export function withSettledFee(
  session: Stripe.Checkout.Session,
  settlement: CardFeeSettlement | null,
): Stripe.Checkout.Session {
  if (!settlement) return session
  return {
    ...session,
    amount_total: Math.max(0, (session.amount_total || 0) - settlement.refundedCents),
    metadata: {
      ...(session.metadata || {}),
      processing_fee: String(settlement.keptFeeCents / 100),
      // What this card pays from now on (e.g. the balance auto-charge).
      card_fee_applied_percent: String(settlement.percent),
    },
  }
}
