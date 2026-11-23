// Card payments priced for the card actually entered.
//
// The credit card fee applies to credit cards only (cardFeePercentFor() in
// lib/booking-price.ts), and a Stripe Checkout page has to be priced before
// the customer enters a card. So card payments don't use Checkout: the
// customer enters the card in Stripe's Payment Element on our page, the
// browser turns it into a ConfirmationToken, and the server reads the card
// from it (funding, issuing country, billing address) and quotes the exact
// total — no fee for a debit or prepaid card. The customer sees that total
// and presses Pay; only then does the server create and confirm the
// PaymentIntent, for that amount.
//
// The same request/response shape serves all three places a customer pays
// by card: the trip booking page (server action), SMS payment links
// (/api/pay/[id]/card) and custom packages (/api/package/[id]/card). The
// server side lives in lib/card-payment-server.ts.

import {
  cardFeeCents,
  cardFeePercentFor,
  isQuebecAddress,
  type CardFeeFacts,
} from '@/lib/booking-price'

export type CardFunding = 'credit' | 'debit' | 'prepaid' | 'unknown'

/** What one card would be charged. Nothing has been charged yet. */
export interface CardQuote {
  /** Paid toward the trip (deposit, full price or balance) */
  paymentCents: number
  /** The fee percentage that applies to this card (0 for debit / prepaid) */
  feePercent: number
  feeCents: number
  /** paymentCents + feeCents: what Pay will charge */
  totalCents: number
  funding: CardFunding
  /** Why this credit card pays less than the trip's fee, if it does */
  feeNote: 'canada_cap' | 'quebec' | null
  brand: string | null
  last4: string | null
}

export function quoteCardPayment(
  facts: CardFeeFacts & { brand?: string | null; last4?: string | null },
  paymentCents: number,
  /** The booking's credit card fee (getTripCardFeePercent / getBookingCardFeePercent) */
  bookingPercent: number,
): CardQuote {
  const funding: CardFunding =
    facts.funding === 'credit' || facts.funding === 'debit' || facts.funding === 'prepaid'
      ? facts.funding
      : 'unknown'
  const feePercent = cardFeePercentFor(facts, bookingPercent)
  const feeCents = cardFeeCents(paymentCents, feePercent)
  const feeNote =
    funding !== 'credit' || bookingPercent <= 0
      ? null
      : isQuebecAddress(facts)
        ? 'quebec'
        : feePercent < bookingPercent
          ? 'canada_cap'
          : null
  return {
    paymentCents,
    feePercent,
    feeCents,
    totalCents: paymentCents + feeCents,
    funding,
    feeNote,
    brand: facts.brand || null,
    last4: facts.last4 || null,
  }
}

export interface CardPaymentRequest {
  /** stripe.createConfirmationToken() in the browser */
  confirmationTokenId: string
  /**
   * The total the customer agreed to on the review step. Absent: only quote,
   * charge nothing. Present: charge, but only if the server's total for this
   * card is still exactly this — otherwise a fresh quote comes back instead.
   */
  confirmTotalCents?: number
  /**
   * The PaymentIntent of an earlier attempt on this screen (declined, or 3-D
   * Secure abandoned), so the server can close it and move the booking to
   * the new one.
   */
  previousPaymentIntentId?: string
}

export type CardPaymentErrorCode =
  | 'card_declined'
  | 'expired_card'
  | 'incorrect_cvc'
  | 'insufficient_funds'
  | 'authentication_failed'
  /** The Payment Element produced something other than a card */
  | 'not_a_card'
  | 'already_paid'
  /** The link or checkout closed (expired, cancelled by an admin) */
  | 'expired'
  /** The trip's price changed; the booking screen has to be refreshed */
  | 'price_changed'
  /** This payment is no longer offered (package state changed) */
  | 'not_available'
  | 'failed'

export type CardPaymentResponse =
  | {
      ok: true
      status: 'quote'
      quote: CardQuote
      /** The total differed from confirmTotalCents, so nothing was charged */
      changed?: boolean
    }
  | {
      ok: true
      status: 'requires_action'
      /** For stripe.handleNextAction() (3-D Secure) */
      clientSecret: string
      paymentIntentId: string
    }
  | { ok: true; status: 'succeeded' | 'processing'; paymentIntentId: string }
  | {
      ok: false
      code: CardPaymentErrorCode
      paymentIntentId?: string
      /**
       * Trip bookings only: the booking screen's own reason (price changed,
       * package removed…), so it can refresh prices as it does for bank
       * transfers.
       */
      checkoutCode?: string
    }
