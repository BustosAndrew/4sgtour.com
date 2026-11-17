import { toCents } from '@/lib/booking-price'

// Custom packages (admin-built, per-customer trips) are paid on
// /package/[id]. What has been paid is read from stripe_bookings rows linked
// by inquiry_id (written by the Stripe webhook) — never from inquiry.status,
// which only says the admin's pipeline stage. The one exception is packages
// paid before rows were linked (see `legacy` below).

/** How the remaining balance is collected after a deposit. Chosen by the admin. */
export type BalanceFlow = 'auto_charge' | 'pay_link'

export type CustomPaymentType = 'deposit' | 'full' | 'remainder'

export interface CustomPackageInquiry {
  id: string
  total_price: number | string | null
  deposit_percentage: number | null
  balance_flow?: string | null
  remainder_due_date?: string | null
  status?: string | null
}

export interface CustomPackageBooking {
  status: string
  total_paid: number | string | null
  remaining_balance: number | string | null
  remaining_balance_charged: boolean | null
  remaining_balance_payment_intent_id?: string | null
  auto_charge_date: string | null
  stripe_customer_id: string | null
  stripe_payment_method_id: string | null
}

export type CustomPackageStage =
  | 'unpaid' // nothing paid yet
  | 'processing' // a bank payment is clearing; nothing confirmed yet
  | 'deposit_paid' // deposit paid, balance outstanding
  | 'paid' // fully paid
  | 'cancelled' // cancelled by the admin; no further payments

export interface CustomPackageState {
  stage: CustomPackageStage
  totalCents: number
  depositPercentage: number
  depositCents: number
  paidCents: number
  remainingCents: number
  balanceFlow: BalanceFlow
  /** Deposit paid and the saved card will be charged on this date */
  autoChargeDate: string | null
  /** A bank payment of the remaining balance is clearing */
  balanceProcessing: boolean
  /**
   * Paid through the old pre-created Stripe links, before payments were
   * recorded per package: amounts are inferred from the inquiry.
   */
  legacy: boolean
  /** Payment types the customer may start right now */
  allowed: CustomPaymentType[]
}

export function getBalanceFlow(value: string | null | undefined): BalanceFlow {
  return value === 'auto_charge' ? 'auto_charge' : 'pay_link'
}

export function getCustomPackageState(
  inquiry: CustomPackageInquiry,
  bookings: CustomPackageBooking[],
): CustomPackageState {
  const totalCents = toCents(Number(inquiry.total_price) || 0)
  const depositPercentage = inquiry.deposit_percentage || 100
  const depositCents = Math.round(totalCents * (depositPercentage / 100))
  const balanceFlow = getBalanceFlow(inquiry.balance_flow)
  const base = {
    totalCents,
    depositPercentage,
    depositCents,
    balanceFlow,
    autoChargeDate: null,
    balanceProcessing: false,
    legacy: false,
  }

  // Cancelled in Admin → Inquiries: show it, take no more payments.
  if (inquiry.status === 'cancelled') {
    const paidCents = bookings
      .filter((b) => b.status !== 'failed' && b.status !== 'expired' && b.status !== 'pending')
      .reduce((sum, b) => sum + toCents(Number(b.total_paid) || 0), 0)
    return { ...base, stage: 'cancelled', paidCents, remainingCents: 0, allowed: [] }
  }

  const live = bookings.filter(
    (b) => b.status === 'confirmed' || b.status === 'completed',
  )

  if (live.length === 0) {
    if (bookings.some((b) => b.status === 'processing')) {
      // Don't offer a second payment while the first is still clearing.
      return { ...base, stage: 'processing', paidCents: 0, remainingCents: totalCents, allowed: [] }
    }

    // Paid through the old pre-created links, before rows were linked. The
    // old webhook only marked an inquiry 'converted' when its deposit session
    // (or, at 100%, its only session) was paid — so a deposit < 100% means the
    // deposit is in and the rest is still owed. Never invite them to pay the
    // deposit again.
    if (['converted', 'paid', 'completed'].includes(inquiry.status || '')) {
      if (depositPercentage >= 100) {
        return { ...base, legacy: true, stage: 'paid', paidCents: totalCents, remainingCents: 0, allowed: [] }
      }
      return {
        ...base,
        legacy: true,
        stage: 'deposit_paid',
        paidCents: depositCents,
        remainingCents: totalCents - depositCents,
        allowed: ['remainder'],
      }
    }

    return {
      ...base,
      stage: 'unpaid',
      paidCents: 0,
      remainingCents: totalCents,
      allowed: depositPercentage < 100 ? ['deposit', 'full'] : ['full'],
    }
  }

  const paidCents = live.reduce((sum, b) => sum + toCents(Number(b.total_paid) || 0), 0)
  const outstanding = live.find(
    (b) => Number(b.remaining_balance) > 0 && !b.remaining_balance_charged,
  )

  if (!outstanding) {
    return { ...base, stage: 'paid', paidCents, remainingCents: 0, allowed: [] }
  }

  // A remainder bank payment is clearing (the webhook marks the row with its
  // payment intent until it settles or fails).
  const balanceProcessing = !!outstanding.remaining_balance_payment_intent_id

  // Auto-charge only counts if the webhook actually saved a card for it;
  // otherwise fall back to letting the customer pay the balance themselves.
  const autoChargeDate =
    outstanding.auto_charge_date &&
    outstanding.stripe_customer_id &&
    outstanding.stripe_payment_method_id
      ? outstanding.auto_charge_date
      : null

  return {
    ...base,
    stage: 'deposit_paid',
    paidCents,
    remainingCents: toCents(Number(outstanding.remaining_balance) || 0),
    autoChargeDate,
    balanceProcessing,
    allowed: autoChargeDate || balanceProcessing ? [] : ['remainder'],
  }
}
