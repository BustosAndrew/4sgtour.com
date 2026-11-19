import 'server-only'

import type Stripe from 'stripe'

/**
 * Whether a saved Stripe payment method is a card, and so carries the card
 * processing fee when it is charged (lib/booking-price.ts).
 *
 * Asked of Stripe rather than read from stripe_bookings.payment_method:
 * bookings paid through an SMS link or a custom-package page were recorded
 * as 'sms_link' whichever method the customer actually used, and their
 * balance auto-charge must still add the fee when that was a card. 'link' is
 * Stripe Link, which is funded by a card.
 */
export async function isCardPaymentMethod(
  stripe: Stripe,
  paymentMethodId: string,
): Promise<boolean> {
  const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId)
  return paymentMethod.type === 'card' || paymentMethod.type === 'link'
}
