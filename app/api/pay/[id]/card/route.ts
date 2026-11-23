import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import {
  quoteCardPayment,
  type CardPaymentRequest,
  type CardPaymentResponse,
} from '@/lib/card-payment'
import {
  closePaymentAttempt,
  readConfirmationTokenCard,
  startCardPayment,
} from '@/lib/card-payment-server'
import {
  getPaymentLinkStage,
  loadPaymentLink,
  paymentLinkCharge,
  pointPaymentLinkAt,
} from '@/lib/payment-link-server'

// The card form on /pay/[id] (lib/card-payment.ts): quotes the card the
// customer entered — the link's credit card fee for a credit card, none for a
// debit or prepaid card — and, once they accept that total, charges it.
// Public, like the page: the unguessable link id is the credential.

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const body = (await request.json().catch(() => null)) as CardPaymentRequest | null
  const reply = (response: CardPaymentResponse) => NextResponse.json(response)
  if (!body || typeof body.confirmationTokenId !== 'string') {
    return reply({ ok: false, code: 'failed' })
  }

  const row = await loadPaymentLink(id)
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const stage = getPaymentLinkStage(row)
  if (stage !== 'payable') {
    return reply({ ok: false, code: stage === 'paid' ? 'already_paid' : 'expired' })
  }
  const charge = paymentLinkCharge(row)
  if (charge.paymentCents <= 0) return reply({ ok: false, code: 'expired' })

  try {
    const card = await readConfirmationTokenCard(stripe, body.confirmationTokenId)
    if (!card) return reply({ ok: false, code: 'not_a_card' })
    const quote = quoteCardPayment(card, charge.paymentCents, charge.feePercent)
    if (body.confirmTotalCents !== quote.totalCents) {
      return reply({
        ok: true,
        status: 'quote',
        quote,
        changed: body.confirmTotalCents !== undefined,
      })
    }

    // A bank session or earlier card attempt for this link (another tab, a
    // declined card): close it so the link can't be paid twice.
    if ((await closePaymentAttempt(stripe, row.stripe_checkout_session_id)) === 'paid') {
      return reply({ ok: false, code: 'already_paid' })
    }

    return reply(
      await startCardPayment(stripe, {
        confirmationTokenId: body.confirmationTokenId,
        quote,
        bookingFeePercent: charge.feePercent,
        saveForLater: !charge.isFullPayment,
        description: charge.description,
        metadata: charge.metadata,
        beforeConfirm: async (paymentIntentId) =>
          (await pointPaymentLinkAt(row, paymentIntentId, {
            payment_method: 'card',
            processing_fee: quote.feeCents / 100,
            total_paid: quote.totalCents / 100,
          }))
            ? null
            : 'expired', // an admin cancelled the link meanwhile
      }),
    )
  } catch (error) {
    console.error('[pay-link] Card payment failed:', error)
    return reply({ ok: false, code: 'failed' })
  }
}
