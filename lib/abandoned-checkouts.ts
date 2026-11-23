import 'server-only'

import type Stripe from 'stripe'
import type { SupabaseClient } from '@supabase/supabase-js'
import { ABANDONED_AFTER_MS } from '@/lib/checkout-expiry'

/**
 * Closes checkouts that were started but never paid.
 *
 * Every "Continue to payment" press and every texted SMS payment link writes
 * a 'pending' stripe_bookings row. Stripe expires the session after 24 hours
 * and the webhook's checkout.session.expired marks the row 'expired' — but
 * when that event never arrives (an endpoint not subscribed to it, a
 * delivery that failed, a link that was never opened so has no session),
 * the row stays 'pending' forever and clutters Admin → Payments.
 *
 * This doesn't trust age alone. For each pending row older than
 * ABANDONED_AFTER_MS it asks Stripe:
 *   - session expired, or unknown to this Stripe account → row 'expired'
 *   - no session yet (an SMS link never opened)         → row 'expired'
 *   - session still open                                → left alone
 *   - session COMPLETE                                  → left 'pending' and
 *     flagged (`booking_details.stripe_session_completed_at`): the customer
 *     paid but the webhook never recorded it. Admin → Payments shows it as
 *     "Paid in Stripe — not recorded" for someone to check, rather than this
 *     job guessing at how to book it.
 *
 * Idempotent and safe to run any number of times. Scheduled daily from
 * vercel.json on 4sgtour.com only, like the other cron jobs; it covers all
 * three sites' rows because they share one database.
 */

const BATCH = 200

export interface AbandonedCheckoutResult {
  checked: number
  expired: number
  stillOpen: number
  /** Completed in Stripe but still pending here */
  unrecorded: string[]
  errors: Array<{ id: string; error: string }>
}

export async function expireAbandonedCheckouts(
  service: SupabaseClient,
  stripe: Stripe,
  now = Date.now(),
): Promise<AbandonedCheckoutResult> {
  const cutoff = new Date(now - ABANDONED_AFTER_MS).toISOString()
  const result: AbandonedCheckoutResult = {
    checked: 0,
    expired: 0,
    stillOpen: 0,
    unrecorded: [],
    errors: [],
  }

  const { data: rows, error } = await service
    .from('stripe_bookings')
    .select('id, created_at, stripe_checkout_session_id, booking_details')
    .eq('status', 'pending')
    .lt('created_at', cutoff)
    .order('created_at', { ascending: true })
    .limit(BATCH)
  if (error) throw new Error(`Failed to read pending checkouts: ${error.message}`)

  for (const row of rows || []) {
    result.checked++
    const details = (row.booking_details as Record<string, unknown>) || {}
    // Already flagged on an earlier run; an admin has to look at it.
    if (details.stripe_session_completed_at) {
      result.unrecorded.push(row.id)
      continue
    }

    const sessionId: string | null = row.stripe_checkout_session_id
    let outcome: 'expire' | 'open' | 'complete' = 'expire'
    if (sessionId && sessionId.startsWith('cs_')) {
      try {
        const session = await stripe.checkout.sessions.retrieve(sessionId)
        if (session.status === 'complete') outcome = 'complete'
        else if (session.status === 'open') outcome = 'open'
      } catch (e: any) {
        if (e?.code !== 'resource_missing') {
          result.errors.push({ id: row.id, error: String(e?.message || e).slice(0, 200) })
          continue
        }
        // Not in this Stripe account (e.g. made with another key): it can
        // never be paid here.
      }
    }

    if (outcome === 'open') {
      result.stillOpen++
      continue
    }

    const iso = new Date(now).toISOString()
    const update =
      outcome === 'complete'
        ? {
            booking_details: { ...details, stripe_session_completed_at: iso },
            updated_at: iso,
          }
        : {
            status: 'expired',
            booking_details: { ...details, expired_unpaid_at: iso },
            updated_at: iso,
          }

    const { error: updateError } = await service
      .from('stripe_bookings')
      .update(update)
      .eq('id', row.id)
      .eq('status', 'pending')
    if (updateError) {
      result.errors.push({ id: row.id, error: updateError.message })
      continue
    }
    if (outcome === 'complete') {
      console.error(
        `[abandoned-checkouts] Booking ${row.id}: Stripe session ${sessionId} is complete but the booking was never confirmed — check the webhook`,
      )
      result.unrecorded.push(row.id)
    } else {
      result.expired++
    }
  }

  return result
}
