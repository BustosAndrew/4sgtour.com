import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import type { CustomPaymentType } from '@/lib/custom-package'
import {
  CUSTOM_PAYMENT_TYPES,
  prepareCustomPackagePayment,
} from '@/lib/custom-package-checkout'
import {
  quoteCardPayment,
  type CardPaymentRequest,
  type CardPaymentResponse,
} from '@/lib/card-payment'
import { readConfirmationTokenCard, startCardPayment } from '@/lib/card-payment-server'

// The card form on /package/[id] (lib/card-payment.ts): quotes the card the
// customer entered — the package's credit card fee for a credit card, none
// for a debit or prepaid card — and, once they accept that total, charges it.
// What is owed is worked out from the database on every call, as for bank
// payments. The webhook writes the stripe_bookings row, as it does for a
// custom-package Checkout Session.

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const body = (await request.json().catch(() => null)) as
    | (CardPaymentRequest & { type?: string })
    | null
  const reply = (response: CardPaymentResponse) => NextResponse.json(response)
  const type = body?.type as CustomPaymentType
  if (
    !body ||
    typeof body.confirmationTokenId !== 'string' ||
    !CUSTOM_PAYMENT_TYPES.includes(type)
  ) {
    return reply({ ok: false, code: 'failed' })
  }

  const payment = await prepareCustomPackagePayment(id, type)
  if (!payment.ok) {
    if (payment.refusal === 'not_found') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    return reply({ ok: false, code: payment.refusal })
  }

  try {
    const card = await readConfirmationTokenCard(stripe, body.confirmationTokenId)
    if (!card) return reply({ ok: false, code: 'not_a_card' })
    const quote = quoteCardPayment(card, payment.amountCents, payment.feePercent)
    if (body.confirmTotalCents !== quote.totalCents) {
      return reply({
        ok: true,
        status: 'quote',
        quote,
        changed: body.confirmTotalCents !== undefined,
      })
    }

    return reply(
      await startCardPayment(stripe, {
        confirmationTokenId: body.confirmationTokenId,
        quote,
        bookingFeePercent: payment.feePercent,
        saveForLater: payment.saveForLater,
        description: payment.description,
        metadata: payment.metadata,
      }),
    )
  } catch (error) {
    console.error('[custom-package] Card payment failed:', error)
    return reply({ ok: false, code: 'failed' })
  }
}
