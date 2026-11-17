/**
 * Cancellation policy — the fee schedule on the Terms page, as code.
 *
 * Pure and dependency-free so the same numbers are shown to the customer in
 * the browser and recomputed by the server before anything is written. The
 * server never trusts a fee the browser sends (same rule as pricing).
 *
 * Rules (Terms → Cancellation Policy):
 *   - Fee = tier % × the trip total, by calendar days before departure.
 *   - Refund = what was paid toward the trip − the fee, never below $0. An
 *     unpaid balance is never charged after a cancellation.
 *   - A booking made the day before departure (or later) is non-refundable.
 *   - Card payments refunded after the day of payment (US Eastern time) have
 *     an 8% card fee deducted from the refund. No fee on the day of payment.
 *   - Card processing fees paid at checkout are not part of the trip price,
 *     so they are not refunded.
 *
 * "Day" means a calendar day in US Eastern time, which is the clock the
 * policy quotes ("after 12:00 AM Eastern Time").
 */

export const CANCELLATION_SCHEDULES = ['standard', 'western_us'] as const
export type CancellationSchedule = (typeof CANCELLATION_SCHEDULES)[number]

export const DEFAULT_CANCELLATION_SCHEDULE: CancellationSchedule = 'standard'

/** Admin-facing labels. Customer-facing copy lives in messages/*.json. */
export const CANCELLATION_SCHEDULE_LABELS: Record<CancellationSchedule, string> = {
  standard: 'Standard (HQ / Los Angeles) — 50% / 60% / 80% / 100%',
  western_us: 'Western US tour (LA branch) — 20% / 50% / 80% / 100%',
}

/** Deducted from a card refund issued after the day of payment. */
export const CARD_REFUND_FEE_PERCENT = 8

export const POLICY_TIME_ZONE = 'America/New_York'

export function isCancellationSchedule(value: unknown): value is CancellationSchedule {
  return (
    typeof value === 'string' &&
    (CANCELLATION_SCHEDULES as readonly string[]).includes(value)
  )
}

export function toCancellationSchedule(value: unknown): CancellationSchedule {
  return isCancellationSchedule(value) ? value : DEFAULT_CANCELLATION_SCHEDULE
}

/** `yyyy-MM-dd` for an instant, as a calendar date in US Eastern time. */
export function policyDate(instant: Date | string = new Date()): string {
  const date = typeof instant === 'string' ? new Date(instant) : instant
  // en-CA formats as yyyy-MM-dd.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: POLICY_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

/** The `yyyy-MM-dd` prefix of a stored date, or null. */
export function toCalendarDate(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value)
  return match ? `${match[1]}-${match[2]}-${match[3]}` : null
}

/** Whole calendar days from `from` to `to` (both `yyyy-MM-dd`). */
export function calendarDaysBetween(from: string, to: string): number {
  const [fy, fm, fd] = from.split('-').map(Number)
  const [ty, tm, td] = to.split('-').map(Number)
  return Math.round((Date.UTC(ty, tm - 1, td) - Date.UTC(fy, fm - 1, fd)) / 86_400_000)
}

/**
 * Fee % for cancelling `daysBefore` calendar days before departure.
 *
 * Standard: 7+ days 50%, 5–6 days 60%, 2–4 days 80%, 1 day 100%,
 *           day of departure / no-show: no refund.
 * Western US: 7+ days 20%, 3–6 days 50%, 1–2 days 80%,
 *           day of departure: no refund.
 */
export function cancellationFeePercent(
  schedule: CancellationSchedule,
  daysBefore: number,
): number {
  if (schedule === 'western_us') {
    if (daysBefore >= 7) return 20
    if (daysBefore >= 3) return 50
    if (daysBefore >= 1) return 80
    return 100
  }
  if (daysBefore >= 7) return 50
  if (daysBefore >= 5) return 60
  if (daysBefore >= 2) return 80
  return 100
}

function roundMoney(amount: number): number {
  return Math.round(amount * 100) / 100
}

/** The stripe_bookings fields the policy reads. */
export interface CancellableBooking {
  status: string
  created_at: string
  total_price: number | string | null
  total_package_price?: number | string | null
  total_paid: number | string | null
  remaining_balance: number | string | null
  remaining_balance_charged: boolean | null
  remaining_balance_charged_at?: string | null
  remaining_balance_payment_intent_id?: string | null
  trip_start_date?: string | null
  booking_details?: Record<string, unknown> | null
  cancelled_at?: string | null
}

export function bookingTripTotal(booking: CancellableBooking): number {
  return Number(booking.total_price || booking.total_package_price || 0)
}

/**
 * What the customer has paid toward the trip price itself — excluding card
 * processing fees, which `total_paid` includes. Must be read before the row
 * is cancelled: cancelling sets `remaining_balance_charged` to stop the cron.
 */
export function paidTowardTrip(booking: CancellableBooking): number {
  const paid = Number(booking.total_paid || 0)
  const total = bookingTripTotal(booking)
  if (!total) return roundMoney(Math.max(0, paid))
  const unpaid = booking.remaining_balance_charged
    ? 0
    : Math.max(0, Number(booking.remaining_balance || 0))
  return roundMoney(Math.max(0, Math.min(paid, total - unpaid)))
}

export function bookingDepartureDate(booking: CancellableBooking): string | null {
  return (
    toCalendarDate(booking.booking_details?.start_date) ||
    toCalendarDate(booking.trip_start_date)
  )
}

/** A bank debit for the balance has been submitted but has not settled. */
export function hasPaymentClearing(booking: CancellableBooking): boolean {
  return (
    booking.status === 'processing' ||
    (!!booking.remaining_balance_payment_intent_id &&
      !booking.remaining_balance_charged_at)
  )
}

export interface CancellationQuote {
  schedule: CancellationSchedule
  departureDate: string
  /** Calendar days from the cancellation date to departure (US Eastern). */
  daysBeforeDeparture: number
  /** Booked the day before departure or later: no refund. */
  lastMinuteBooking: boolean
  feePercent: number
  tripTotal: number
  paidTowardTrip: number
  fee: number
  /** paidTowardTrip − fee, floored at 0, before any card fee. */
  refundDue: number
}

/**
 * The fee and refund for cancelling on `cancelledAt`. Null if there is no
 * departure date or the trip has already departed.
 */
export function quoteCancellation(
  booking: CancellableBooking,
  schedule: CancellationSchedule,
  cancelledAt: Date | string = new Date(),
): CancellationQuote | null {
  const departureDate = bookingDepartureDate(booking)
  if (!departureDate) return null

  const daysBeforeDeparture = calendarDaysBetween(policyDate(cancelledAt), departureDate)
  if (daysBeforeDeparture < 0) return null

  const lastMinuteBooking =
    calendarDaysBetween(policyDate(booking.created_at), departureDate) <= 1
  const feePercent = lastMinuteBooking
    ? 100
    : cancellationFeePercent(schedule, daysBeforeDeparture)

  const tripTotal = bookingTripTotal(booking)
  const paid = paidTowardTrip(booking)
  // Rows without a recorded total (very old ones) fall back to what was paid.
  const fee = roundMoney((tripTotal || paid) * (feePercent / 100))
  const refundDue = roundMoney(Math.max(0, paid - fee))

  return {
    schedule,
    departureDate,
    daysBeforeDeparture,
    lastMinuteBooking,
    feePercent,
    tripTotal,
    paidTowardTrip: paid,
    fee,
    refundDue,
  }
}

export type SelfCancelBlock =
  | 'already_cancelled'
  | 'not_paid'
  | 'payment_clearing'
  | 'no_departure_date'
  | 'departed'

/** Why a customer can't cancel this booking themselves, or null if they can. */
export function selfCancelBlock(
  booking: CancellableBooking,
  now: Date = new Date(),
): SelfCancelBlock | null {
  if (booking.cancelled_at || booking.status === 'cancelled' || booking.status === 'refunded') {
    return 'already_cancelled'
  }
  if (hasPaymentClearing(booking)) return 'payment_clearing'
  if (booking.status !== 'confirmed' && booking.status !== 'completed') return 'not_paid'
  const departureDate = bookingDepartureDate(booking)
  if (!departureDate) return 'no_departure_date'
  if (calendarDaysBetween(policyDate(now), departureDate) < 0) return 'departed'
  return null
}

/**
 * The card fee deducted from a refund of `refundDue` issued at `refundAt`
 * for a payment made at `paidAt`. Zero for bank payments and for refunds
 * on the day of payment.
 */
export function cardRefundFee(
  refundDue: number,
  { paidByCard, paidAt, refundAt = new Date() }: {
    paidByCard: boolean
    paidAt: Date | string
    refundAt?: Date | string
  },
): number {
  if (!paidByCard || refundDue <= 0) return 0
  if (policyDate(paidAt) === policyDate(refundAt)) return 0
  return roundMoney(refundDue * (CARD_REFUND_FEE_PERCENT / 100))
}
