// Single source of truth for what a standard trip booking costs.
//
// Used by the booking form (to show the price) AND by the checkout / SMS
// payment-link server actions (to decide what to charge). The server must
// never trust a total sent from the browser — server actions are public POST
// endpoints, so a caller could otherwise name their own price.

// Single-room surcharge, charged on each person who books a single room.
// Each trip sets its own (trips.single_occupancy_surcharge, a percentage,
// migration 061); this is the default for trips that don't.
export const SINGLE_OCCUPANCY_SURCHARGE = 0.12
export const DEFAULT_SINGLE_OCCUPANCY_SURCHARGE_PERCENT = 12
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
  /** Percent added per single-room person; null → the 12% default. */
  single_occupancy_surcharge?: number | string | null
}

export function getMinNights(trip: PricedTrip): number {
  return trip.min_nights || trip.min_days || 1
}

export function getDepositPercentage(trip: PricedTrip): number {
  return trip.deposit_percentage || DEFAULT_DEPOSIT_PERCENTAGE
}

/**
 * The trip's single-room surcharge as a percentage (0–100). 0 is a real
 * value — "no surcharge" — so only a missing or unreadable one defaults.
 */
export function getSingleSurchargePercent(trip: PricedTrip): number {
  const raw = trip.single_occupancy_surcharge
  if (raw === null || raw === undefined || raw === '') {
    return DEFAULT_SINGLE_OCCUPANCY_SURCHARGE_PERCENT
  }
  const value = Number(raw)
  if (!Number.isFinite(value)) return DEFAULT_SINGLE_OCCUPANCY_SURCHARGE_PERCENT
  return Math.min(100, Math.max(0, value))
}

/**
 * A surcharge percentage from an admin form, made safe to store: 0–100,
 * two decimals. Anything unreadable becomes the 12% default.
 */
export function toSurchargePercent(value: unknown): number {
  if (value === null || value === undefined || value === '') {
    return DEFAULT_SINGLE_OCCUPANCY_SURCHARGE_PERCENT
  }
  const n = Number(value)
  if (!Number.isFinite(n)) return DEFAULT_SINGLE_OCCUPANCY_SURCHARGE_PERCENT
  return Math.round(Math.min(100, Math.max(0, n)) * 100) / 100
}

/** The surcharge as a rate, e.g. 0.12. */
export function getSingleSurchargeRate(trip: PricedTrip): number {
  return getSingleSurchargePercent(trip) / 100
}

/** "12%", "7.5%" — for the badges beside "Single occupancy". */
export function formatSurchargePercent(trip: PricedTrip): string {
  return `${Number(getSingleSurchargePercent(trip).toFixed(2))}%`
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

export function priceForPerson(
  occupancy: Occupancy,
  perPersonBase: number,
  surchargeRate: number = SINGLE_OCCUPANCY_SURCHARGE,
) {
  return occupancy === 'single'
    ? perPersonBase * (1 + surchargeRate)
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
  const rate = getSingleSurchargeRate(trip)
  return occupancies.reduce(
    (sum, occ) => sum + priceForPerson(occ, base, rate),
    0,
  )
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

/**
 * An amount for a text message sent before the customer has chosen how to
 * pay: "$1500.00 by bank transfer, or $1560.00 by card incl. 4% card fee".
 * Any price a text quotes includes the card fee for card payers.
 */
export function bankOrCardAmountText(amountCents: number): string {
  const cardCents = amountCents + cardFeeCents(amountCents)
  return `$${formatCents(amountCents)} by bank transfer, or $${formatCents(cardCents)} by card incl. 4% card fee`
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
