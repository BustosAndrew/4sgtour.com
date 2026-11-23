import 'server-only'

import { cache } from 'react'
import { createServiceClient } from '@/lib/supabase/service'

// SMS payment links (app/actions/send-payment-link.ts). The text points at
// /pay/[id], id = the pending stripe_bookings row, where the customer picks
// bank transfer or card. Card carries the card processing fee, so the method
// has to be known before a Stripe session exists, and one Stripe page can't
// offer both (it can't add a fee only when a card is used).
//
// Read with the service role: customers open the text signed out, and RLS
// hides stripe_bookings from them. The unguessable id is the credential, as
// with the custom-package page.

/** How long a texted link can be used, matching the "expires in 24 hours" copy. */
export const PAYMENT_LINK_TTL_MS = 24 * 60 * 60 * 1000

/**
 * Placeholder session key for a link no session has been made for yet. The
 * booking row and its inquiry share it so the inquiry can be found and moved
 * to the real session when the customer presses a Pay button.
 */
export function paymentLinkSessionKey(bookingId: string) {
  return `paylink_${bookingId}`
}

const COLUMNS = [
  'id',
  'created_at',
  'status',
  'site_url',
  'trip_id',
  'package_id',
  'user_id',
  'trip_title',
  'customer_name',
  'customer_email',
  'customer_phone',
  'deposit_amount',
  'deposit_percentage',
  'total_price',
  'remaining_balance',
  'remaining_balance_charged',
  'auto_charge_date',
  'stripe_checkout_session_id',
  'booking_details',
].join(', ')

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export interface PaymentLinkRow {
  id: string
  created_at: string
  status: string
  site_url: string | null
  trip_id: string | null
  package_id: string | null
  user_id: string | null
  trip_title: string | null
  customer_name: string | null
  customer_email: string | null
  customer_phone: string | null
  /** Paid toward the trip by this link (deposit or full), before any card fee */
  deposit_amount: number | string
  deposit_percentage: number | null
  total_price: number | string | null
  remaining_balance: number | string | null
  /** true when the link is for the full price (nothing left afterwards) */
  remaining_balance_charged: boolean | null
  auto_charge_date: string | null
  stripe_checkout_session_id: string | null
  booking_details: Record<string, any> | null
}

export type PaymentLinkStage = 'payable' | 'paid' | 'processing' | 'expired'

export function getPaymentLinkStage(row: PaymentLinkRow): PaymentLinkStage {
  if (row.status === 'processing') return 'processing'
  // Cancelled by an admin (Admin → Payments). The row is also 'expired', but
  // this holds even if a Pay press in flight wrote 'pending' back.
  if (row.booking_details?.admin_cancelled_at) return 'expired'
  if (row.status !== 'pending') {
    return ['confirmed', 'completed'].includes(row.status) ? 'paid' : 'expired'
  }
  return Date.now() - new Date(row.created_at).getTime() > PAYMENT_LINK_TTL_MS
    ? 'expired'
    : 'payable'
}

/** The pending row behind an SMS payment link, or null if it isn't one. */
export const loadPaymentLink = cache(async (id: string) => {
  if (!UUID.test(id)) return null
  const { data, error } = await createServiceClient()
    .from('stripe_bookings')
    .select(COLUMNS)
    .eq('id', id)
    .maybeSingle()
  if (error) {
    console.error('[pay-link] Error loading payment link:', error)
    return null
  }
  const row = data as unknown as PaymentLinkRow | null
  if (!row || row.booking_details?.sms_payment_link !== true) return null
  return row
})
