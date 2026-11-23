import 'server-only'

import { cache } from 'react'
import { createServiceClient } from '@/lib/supabase/service'
import { CHECKOUT_TTL_MS } from '@/lib/checkout-expiry'
import { getSiteUrl } from '@/lib/site-url'
import { getBookingCardFeePercent, toCents } from '@/lib/booking-price'

// SMS payment links (app/actions/send-payment-link.ts). The text points at
// /pay/[id], id = the pending stripe_bookings row, where the customer pays by
// bank transfer (a Stripe Checkout Session, /api/pay/[id]/checkout) or by
// card (the card form, /api/pay/[id]/card, which charges a credit card the
// fee and a debit card none).
//
// Read with the service role: customers open the text signed out, and RLS
// hides stripe_bookings from them. The unguessable id is the credential, as
// with the custom-package page.

/** How long a texted link can be used, matching the "expires in 24 hours" copy. */
export const PAYMENT_LINK_TTL_MS = CHECKOUT_TTL_MS

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

/**
 * What a payment link charges and what the webhook needs to record it, for
 * either method. The amount was fixed when the link was texted (it's in the
 * text) and is read from the row, never from the request.
 */
export function paymentLinkCharge(row: PaymentLinkRow) {
  const details = row.booking_details || {}
  const isFullPayment = !!row.remaining_balance_charged
  const packageName = details.package_name || 'Golf Package'
  const tripTitle = row.trip_title || details.trip_title || 'Golf Trip'
  const label = isFullPayment ? 'Full Payment' : `${row.deposit_percentage || 30}% Deposit`
  const siteUrl = (row.site_url || getSiteUrl()).replace(/\/+$/, '')
  return {
    paymentCents: toCents(Number(row.deposit_amount) || 0),
    /** The fee quoted in the text (the trip's when the link was sent) */
    feePercent: getBookingCardFeePercent(details),
    isFullPayment,
    siteUrl,
    description: `${tripTitle} - ${packageName} (${label})`,
    lineDescription: `Travel dates: ${details.start_date || ''} to ${details.end_date || ''}. Room: ${details.room_type || ''}.`,
    metadata: {
      site_url: siteUrl,
      trip_id: row.trip_id || '',
      trip_title: tripTitle,
      package_id: row.package_id || '',
      package_name: packageName,
      user_id: row.user_id || '',
      customer_name: row.customer_name || '',
      customer_email: row.customer_email || '',
      customer_phone: row.customer_phone || '',
      start_date: details.start_date || '',
      end_date: details.end_date || '',
      room_type: details.room_type || '',
      golf_courses: JSON.stringify(details.golf_courses || []),
      meal_option: details.meal_option || '',
      transport_option: details.transport_option || '',
      additional_requests: String(details.additional_requests || '').slice(0, 450),
      via_sms_link: 'true',
      payment_type: isFullPayment ? 'full' : 'deposit',
      is_guest: row.user_id ? 'false' : 'true',
      total_price: String(row.total_price ?? ''),
      deposit_percentage: String(row.deposit_percentage || 30),
      remaining_balance: String(row.remaining_balance ?? 0),
      auto_charge_date: isFullPayment ? '' : row.auto_charge_date || '',
    } as Record<string, string>,
  }
}

/**
 * Points the link's booking row, and the inquiry written beside it, at a new
 * payment attempt (a Checkout Session or a card PaymentIntent): the webhook
 * confirms the booking, and converts the inquiry, by that id.
 *
 * Returns false — and changes nothing — if an admin cancelled the link
 * meanwhile (Admin → Payments); the caller must then close the attempt.
 */
export async function pointPaymentLinkAt(
  row: PaymentLinkRow,
  attemptId: string,
  fields: { payment_method: 'card' | 'ach'; processing_fee: number; total_paid: number },
): Promise<boolean> {
  const supabase = createServiceClient()
  const { data: updatedRows, error: bookingError } = await supabase
    .from('stripe_bookings')
    .update({
      ...fields,
      stripe_checkout_session_id: attemptId,
      // The earlier attempt's checkout.session.expired may already have
      // marked this row expired.
      status: 'pending',
      updated_at: new Date().toISOString(),
    })
    .eq('id', row.id)
    .is('booking_details->>admin_cancelled_at', null)
    .select('id')
  if (bookingError) throw bookingError
  if (!updatedRows || updatedRows.length === 0) return false

  const previous = row.stripe_checkout_session_id
  const { error: inquiryError } = await supabase
    .from('inquiries')
    .update({ stripe_session_id: attemptId, updated_at: new Date().toISOString() })
    .in('stripe_session_id', [previous || '', paymentLinkSessionKey(row.id)].filter(Boolean))
  if (inquiryError) {
    console.error('[pay-link] Error updating inquiry for new payment:', inquiryError)
  }
  return true
}
