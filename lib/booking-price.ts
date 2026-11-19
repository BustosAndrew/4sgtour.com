// Single source of truth for what a standard trip booking costs.
//
// Used by the booking form (to show the price) AND by the checkout / SMS
// payment-link server actions (to decide what to charge). The server must
// never trust a total sent from the browser — server actions are public POST
// endpoints, so a caller could otherwise name their own price.

export const SINGLE_OCCUPANCY_SURCHARGE = 0.12
export const DEFAULT_DEPOSIT_PERCENTAGE = 30

export type Occupancy = 'single' | 'double'

export interface PricedPackage {
  price: number | string
  price_per_extra_night?: number | string | null
}

export interface PricedTrip {
  min_nights?: number | null
  min_days?: number | null
  deposit_percentage?: number | null
}

export function getMinNights(trip: PricedTrip): number {
  return trip.min_nights || trip.min_days || 1
}

export function getDepositPercentage(trip: PricedTrip): number {
  return trip.deposit_percentage || DEFAULT_DEPOSIT_PERCENTAGE
}

/** Nights between two `yyyy-MM-dd` dates, or null if either is invalid. */
export function nightsBetween(startDate: string, endDate: string): number | null {
  const re = /^\d{4}-\d{2}-\d{2}$/
  if (!re.test(startDate) || !re.test(endDate)) return null
  const start = Date.parse(`${startDate}T00:00:00Z`)
  const end = Date.parse(`${endDate}T00:00:00Z`)
  if (Number.isNaN(start) || Number.isNaN(end)) return null
  return Math.round((end - start) / 86_400_000)
}

/** Per-person price: package price plus any nights beyond the trip minimum. */
export function getPerPersonBase(
  pkg: PricedPackage,
  trip: PricedTrip,
  nights: number | null,
): number {
  let base = Number(pkg.price) || 0
  const perExtraNight = Number(pkg.price_per_extra_night) || 0
  if (perExtraNight > 0 && nights !== null) {
    const extraNights = Math.max(0, nights - getMinNights(trip))
    base += extraNights * perExtraNight
  }
  return base
}

export function priceForPerson(occupancy: Occupancy, perPersonBase: number) {
  return occupancy === 'single'
    ? perPersonBase * (1 + SINGLE_OCCUPANCY_SURCHARGE)
    : perPersonBase
}

/** Total for the primary booker plus every additional guest. */
export function calculateBookingTotal(
  pkg: PricedPackage,
  trip: PricedTrip,
  nights: number | null,
  occupancies: Occupancy[],
): number {
  const base = getPerPersonBase(pkg, trip, nights)
  return occupancies.reduce((sum, occ) => sum + priceForPerson(occ, base), 0)
}

/** Rounds to cents so client and server compare the same number. */
export function toCents(amount: number): number {
  return Math.round(amount * 100)
}

// Every payment made by card carries this fee, on top of the amount paid
// toward the trip — deposits, full payments, balances, SMS links, custom
// packages and the balance auto-charge alike. Bank (ACH) payments have none.
export const CARD_PROCESSING_FEE_RATE = 0.04

/** The card processing fee on an amount, both in integer cents. */
export function cardFeeCents(amountCents: number): number {
  return Math.round(amountCents * CARD_PROCESSING_FEE_RATE)
}

export type PaymentType = 'deposit' | 'full'
export type PaymentMethodKind = 'card' | 'ach' | 'sms'

export interface PaymentAmounts {
  /** Full trip price */
  totalCents: number
  /** Deposit portion of the trip price */
  depositCents: number
  /** What is paid now toward the trip: the deposit, or the full price */
  paymentCents: number
  /** Card processing fee on top of paymentCents (card only) */
  feeCents: number
  /** What the customer is charged now: paymentCents + feeCents */
  chargeCents: number
  /** Left to auto-charge later (0 when paying in full) */
  remainingCents: number
}

/**
 * Every amount a checkout shows or charges, in integer cents. Shared by the
 * payment screen and the server actions so the numbers on screen and the
 * Stripe charge can't drift apart by even a cent of rounding.
 */
export function calculatePaymentAmounts(
  totalPrice: number,
  depositPercentage: number,
  paymentType: PaymentType,
  paymentMethod: PaymentMethodKind,
): PaymentAmounts {
  const totalCents = toCents(totalPrice)
  const depositCents = Math.round(totalCents * (depositPercentage / 100))
  const paymentCents = paymentType === 'full' ? totalCents : depositCents
  // 'sms' is the amount the text quotes before the customer picks a method:
  // the /pay/[id] page adds the card fee if they then choose card.
  const feeCents = paymentMethod === 'card' ? cardFeeCents(paymentCents) : 0
  return {
    totalCents,
    depositCents,
    paymentCents,
    feeCents,
    chargeCents: paymentCents + feeCents,
    remainingCents: totalCents - paymentCents,
  }
}

/** Integer cents → "1234.50" */
export function formatCents(cents: number): string {
  return (cents / 100).toFixed(2)
}

/**
 * Why a checkout couldn't be started. Returned (not thrown) by the server
 * actions, because Next.js strips thrown error messages in production. The
 * payment screen maps each code to translated copy.
 */
export type CheckoutErrorCode =
  | 'PRICE_CHANGED'
  | 'PACKAGE_UNAVAILABLE'
  | 'TRIP_UNAVAILABLE'
  | 'INVALID_DATES'
  /** Phone number isn't a valid international (E.164) number */
  | 'INVALID_PHONE'
  /** Twilio refused the text (bad number, opted out, carrier block) */
  | 'SMS_FAILED'
  | 'CHECKOUT_FAILED'

export type CheckoutFailure = { ok: false; code: CheckoutErrorCode }

/** Result of creating an embedded card / bank checkout. */
export type TripCheckoutResult =
  | {
      ok: true
      clientSecret: string
      /** The server's amounts — what Stripe will actually charge. */
      amounts: PaymentAmounts
      depositPercentage: number
    }
  | CheckoutFailure

/** Result of sending an SMS payment link. */
export type PaymentLinkResult =
  | { ok: true; amounts: PaymentAmounts; depositPercentage: number }
  | CheckoutFailure
