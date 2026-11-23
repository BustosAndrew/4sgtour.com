// Admin → Payments: one stripe_bookings row → what the admin sees.
//
// Pure (no server imports) so the API route and the client list share the
// same types. Money is in dollars, rounded to cents.
//
// Reading a row needs care, because the columns mean different things at
// different stages:
//  - A 'pending' row is a checkout that was opened, or an SMS link that was
//    texted, but not paid. Its `total_paid` is what it *would* charge, so
//    nothing on it counts as paid.
//  - A 'processing' row is a bank (ACH) deposit that is still clearing:
//    accepted by the bank, not yet settled.
//  - On a confirmed row, `total_paid` includes card processing fees and
//    `remaining_balance` is still owed until `remaining_balance_charged`.
//    The charge cron sets `remaining_balance_charged` as soon as it submits a
//    bank debit; `remaining_balance_charged_at` stays empty until it settles.

import { paidTowardTrip, bookingTripTotal } from '@/lib/cancellation-policy'
import { CHECKOUT_TTL_MS } from '@/lib/checkout-expiry'

/** How long a pending checkout / texted link can still be paid. */
export const PENDING_PAYABLE_MS = CHECKOUT_TTL_MS

export type PaymentStage =
  /**
   * Still 'pending' here, but Stripe says the checkout was completed: the
   * webhook never recorded the payment. Flagged by the abandoned-checkout
   * cleanup or a Cancel attempt; the admin must check it in Stripe.
   */
  | 'unrecorded_payment'
  /** Checkout opened or link texted in the last 24h; can still be paid */
  | 'awaiting_payment'
  /** Pending for more than 24h: the link / checkout has almost certainly lapsed */
  | 'stale'
  /** Bank deposit (or full payment) submitted, still clearing */
  | 'clearing'
  /** Deposit paid; the balance bank debit is still clearing */
  | 'balance_clearing'
  /** Deposit paid, balance still owed */
  | 'balance_due'
  | 'paid_in_full'

/** Columns the Payments view reads. */
export const PAYMENT_COLUMNS = `
  id, created_at, updated_at, status, site_url, trip_id, inquiry_id,
  customer_name, customer_email, customer_phone, trip_title, booking_details,
  payment_method, deposit_amount, deposit_percentage, processing_fee,
  total_paid, total_price, total_package_price, trip_start_date,
  remaining_balance, remaining_balance_charged, remaining_balance_charged_at,
  remaining_balance_payment_intent_id, auto_charge_date, remainder_due_date,
  stripe_customer_id, stripe_payment_method_id, stripe_checkout_session_id,
  charge_attempts, last_charge_error, payment_reminder_sent_at
`

export interface AdminPayment {
  id: string
  createdAt: string
  status: string
  stage: PaymentStage
  siteUrl: string | null
  tripId: string | null
  /** Custom packages: the inquiry (its page is /package/[inquiryId]) */
  inquiryId: string | null
  isSmsLink: boolean
  customerName: string
  customerEmail: string
  customerPhone: string | null
  tripTitle: string
  packageName: string | null
  startDate: string | null
  endDate: string | null
  paymentMethod: string | null
  depositPercentage: number | null
  /** The trip price */
  tripTotal: number
  /** Received toward the trip price, excluding card fees (0 while pending) */
  paidTowardTrip: number
  /** Card processing fees received on top (0 while pending) */
  cardFeesPaid: number
  /** Everything received: paidTowardTrip + cardFeesPaid */
  totalReceived: number
  /** Submitted by bank but not settled yet (deposit or balance) */
  clearingAmount: number
  /** Still owed toward the trip price */
  remaining: number
  /** Pending rows: what the open checkout / link would charge now */
  amountDueNow: number
  /** Date the charge cron bills the saved payment method, if it will */
  autoChargeDate: string | null
  /** Date the balance is due when it is paid from a link instead */
  dueDate: string | null
  /** A reusable payment method was saved with the deposit */
  hasSavedPaymentMethod: boolean
  chargeAttempts: number
  lastChargeError: string | null
  reminderSentAt: string | null
}

function money(value: unknown): number {
  const n = Number(value)
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : 0
}

export function paymentStage(row: any, now = Date.now()): PaymentStage {
  if (row.status === 'pending') {
    if (row.booking_details?.stripe_session_completed_at) return 'unrecorded_payment'
    return now - new Date(row.created_at).getTime() > PENDING_PAYABLE_MS
      ? 'stale'
      : 'awaiting_payment'
  }
  if (row.status === 'processing') return 'clearing'
  // A balance bank debit in flight: the cron's (remaining_balance_charged
  // already true) or a custom package's "Pay remaining balance" (still
  // false). Either way the intent id is set and the settle time is not; a
  // bounced debit clears the intent id again.
  if (row.remaining_balance_payment_intent_id && !row.remaining_balance_charged_at) {
    return 'balance_clearing'
  }
  if (!row.remaining_balance_charged && money(row.remaining_balance) > 0) {
    return 'balance_due'
  }
  return 'paid_in_full'
}

export function toAdminPayment(row: any, now = Date.now()): AdminPayment {
  const stage = paymentStage(row, now)
  const details = (row.booking_details || {}) as Record<string, any>
  const tripTotal = money(bookingTripTotal(row))
  const pending =
    stage === 'awaiting_payment' || stage === 'stale' || stage === 'unrecorded_payment'

  let paid = 0
  let fees = 0
  let clearing = 0
  if (stage === 'clearing') {
    // Nothing has settled yet; the whole submitted amount is clearing.
    clearing = money(row.total_paid)
  } else if (!pending) {
    paid = money(paidTowardTrip(row))
    fees = money(row.processing_fee)
    if (stage === 'balance_clearing') {
      // The cron marks the balance charged when it submits a bank debit,
      // but total_paid only grows once it settles (webhook).
      clearing = money(row.remaining_balance)
      paid = money(Math.min(paid, tripTotal - clearing))
    }
  }

  const remaining = pending
    ? tripTotal
    : stage === 'balance_due'
      ? money(row.remaining_balance)
      : stage === 'clearing'
        ? money(Math.max(0, tripTotal - money(row.deposit_amount)))
        : 0

  return {
    id: row.id,
    createdAt: row.created_at,
    status: row.status,
    stage,
    siteUrl: row.site_url ?? null,
    tripId: row.trip_id ?? null,
    inquiryId: row.inquiry_id ?? null,
    isSmsLink: details.sms_payment_link === true,
    customerName: row.customer_name || '',
    customerEmail: row.customer_email || '',
    customerPhone: row.customer_phone ?? null,
    tripTitle: details.trip_title || row.trip_title || 'Golf trip',
    packageName: details.package_name || null,
    startDate: details.start_date || row.trip_start_date || null,
    endDate: details.end_date || null,
    paymentMethod: row.payment_method ?? null,
    depositPercentage: row.deposit_percentage ?? null,
    tripTotal,
    paidTowardTrip: paid,
    cardFeesPaid: fees,
    totalReceived: money(paid + fees),
    clearingAmount: clearing,
    remaining,
    amountDueNow: pending ? money(row.total_paid) : 0,
    autoChargeDate: row.auto_charge_date ?? null,
    dueDate: row.remainder_due_date ?? null,
    hasSavedPaymentMethod: !!(row.stripe_customer_id && row.stripe_payment_method_id),
    chargeAttempts: Number(row.charge_attempts || 0),
    lastChargeError: row.last_charge_error ?? null,
    reminderSentAt: row.payment_reminder_sent_at ?? null,
  }
}

/** Today as "yyyy-MM-dd" in UTC — the calendar the charge cron uses. */
export function todayUtc(now = new Date()): string {
  return now.toISOString().split('T')[0]
}
