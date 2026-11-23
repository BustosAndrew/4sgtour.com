// How long a checkout can be paid, and when an unpaid one counts as
// abandoned. Pure — used by the checkout actions, the SMS payment link route,
// the abandoned-checkout cleanup and the Admin → Payments view.

/** A checkout (or texted payment link) can be paid for 24 hours — Stripe's maximum. */
export const CHECKOUT_TTL_MS = 24 * 60 * 60 * 1000

/**
 * A pending row older than this is checked against Stripe and expired by the
 * daily cleanup (/api/cron/expire-abandoned-checkouts). The extra hour covers
 * a customer who submits a payment in the last minutes of the 24.
 */
export const ABANDONED_AFTER_MS = CHECKOUT_TTL_MS + 60 * 60 * 1000

// Stripe accepts an expires_at from 30 minutes to 24 hours after the session
// is created. Stay a minute inside each end so request latency can't push us out.
const STRIPE_MIN_MS = 31 * 60 * 1000
const STRIPE_MAX_MS = CHECKOUT_TTL_MS - 60 * 1000

/** `expires_at` (unix seconds) for a new checkout session: 24 hours from now. */
export function checkoutExpiresAt(now = Date.now()): number {
  return Math.floor((now + STRIPE_MAX_MS) / 1000)
}

/**
 * `expires_at` for a session opened from an SMS payment link: when the link
 * itself lapses (24 hours after it was texted), so a Pay press late in the
 * day can't keep it payable into the next one — but never under Stripe's
 * 30-minute minimum.
 */
export function linkSessionExpiresAt(linkCreatedAt: string | number, now = Date.now()): number {
  const linkEnds = new Date(linkCreatedAt).getTime() + CHECKOUT_TTL_MS
  const target = Number.isFinite(linkEnds) ? linkEnds : now + STRIPE_MAX_MS
  const clamped = Math.min(now + STRIPE_MAX_MS, Math.max(now + STRIPE_MIN_MS, target))
  return Math.floor(clamped / 1000)
}
