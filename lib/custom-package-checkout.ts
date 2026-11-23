import 'server-only'

import { getSiteUrl } from '@/lib/site-url'
import { getTripCardFeePercent } from '@/lib/booking-price'
import { loadCustomPackage, loadCustomTrip } from '@/lib/custom-package-server'
import {
  getCustomPackageState,
  type CustomPaymentType,
} from '@/lib/custom-package'

// What a custom-package payment charges *now*, worked out from the database
// for one Pay button — shared by the bank route (/api/package/[id]/checkout,
// a Stripe Checkout Session) and the card route (/api/package/[id]/card, the
// card form). Nothing comes from the request but the payment type.

export const CUSTOM_PAYMENT_TYPES: CustomPaymentType[] = ['deposit', 'full', 'remainder']

export type CustomPaymentRefusal = 'not_found' | 'already_paid' | 'not_available'

export async function prepareCustomPackagePayment(
  id: string,
  type: CustomPaymentType,
) {
  const data = await loadCustomPackage(id)
  const refuse = (refusal: CustomPaymentRefusal, siteUrl = getSiteUrl()) => ({
    ok: false as const,
    refusal,
    siteUrl,
  })
  if (!data) return refuse('not_found')
  const { inquiry, bookings } = data
  const siteUrl = (inquiry.site_url || getSiteUrl()).replace(/\/+$/, '')

  const state = getCustomPackageState(inquiry, bookings)
  if (!state.allowed.includes(type)) {
    // Already paid, auto-charge pending, or a stale page offering an option
    // that no longer applies.
    return refuse(state.stage === 'paid' ? 'already_paid' : 'not_available', siteUrl)
  }
  if (state.totalCents <= 0) return refuse('not_available', siteUrl)

  const amountCents =
    type === 'deposit'
      ? state.depositCents
      : type === 'full'
        ? state.totalCents
        : state.remainingCents
  if (amountCents <= 0) return refuse('not_available', siteUrl)

  // The package's credit card fee, as the page shows it.
  const feePercent = getTripCardFeePercent(await loadCustomTrip(inquiry.trip_id))
  const remainingAfterCents = type === 'deposit' ? state.totalCents - state.depositCents : 0
  const title = inquiry.trip_title || 'Custom Package'
  const label =
    type === 'deposit'
      ? `${state.depositPercentage}% Deposit`
      : type === 'full'
        ? 'Full Payment'
        : 'Remaining Balance'

  // Save the payment method for the cron to charge the balance — only when
  // the admin chose auto-charge and there will be a balance left.
  const saveForLater =
    type === 'deposit' && state.balanceFlow === 'auto_charge' && remainingAfterCents > 0

  return {
    ok: true as const,
    inquiry,
    siteUrl,
    amountCents,
    feePercent,
    saveForLater,
    description: `${title} (${label})`,
    lineDescription:
      inquiry.custom_package_description?.slice(0, 500) ||
      `Custom package for ${inquiry.customer_name || 'you'}`,
    /** Read by the webhook's custom-package branch */
    metadata: {
      is_custom_package: 'true',
      inquiry_id: id,
      trip_id: inquiry.trip_id || '',
      trip_title: title,
      custom_package_name: title,
      site_url: siteUrl,
      payment_type: type,
      balance_flow: state.balanceFlow,
      total_price: String(state.totalCents / 100),
      deposit_percentage: String(type === 'deposit' ? state.depositPercentage : 100),
      remaining_balance: String(remainingAfterCents / 100),
      remainder_due_date: inquiry.remainder_due_date || '',
      auto_charge_date:
        saveForLater && inquiry.remainder_due_date ? inquiry.remainder_due_date : '',
      customer_name: inquiry.customer_name || '',
      customer_email: inquiry.customer_email || '',
      customer_phone: inquiry.customer_phone || '',
      start_date: inquiry.start_date || '',
      end_date: inquiry.end_date || '',
    } as Record<string, string>,
  }
}
