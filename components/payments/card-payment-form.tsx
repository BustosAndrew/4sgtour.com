'use client'

import { useMemo, useRef, useState } from 'react'
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js'
import type { StripeElementLocale, StripeElementsOptions } from '@stripe/stripe-js'
import { AlertCircle, ArrowLeft, Loader2, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLocale, useTranslations } from '@/lib/i18n/provider'
import { getStripe } from '@/lib/stripe-client'
import { formatFeePercent } from '@/lib/booking-price'
import type {
  CardPaymentErrorCode,
  CardPaymentRequest,
  CardPaymentResponse,
  CardQuote,
} from '@/lib/card-payment'

// The card form used wherever a customer pays by card (lib/card-payment.ts):
//
//   1. The customer enters a card in Stripe's Payment Element.
//   2. Continue → the card becomes a ConfirmationToken and the server quotes
//      the exact total for it: the credit card fee for a credit card, nothing
//      for a debit or prepaid card. Nothing is charged.
//   3. The customer reviews that total and presses Pay → the server charges
//      exactly it, then 3-D Secure runs here if the bank asks for it.
//
// Wallets (Apple Pay / Google Pay) are off: their payment sheet shows the
// amount before we know the card, which may then differ from what is charged.

export interface CardPaymentFormProps {
  /** Paid toward the trip, before any card fee */
  amountCents: number
  /** The booking's credit card fee, for the note above the form */
  feePercent: number
  /** Keep the card for the balance auto-charge — must match the server */
  saveForLater: boolean
  billingName?: string
  billingEmail?: string
  /** Sends the request to this payment's server endpoint */
  submit: (request: CardPaymentRequest) => Promise<CardPaymentResponse>
  /** The payment went through (or is processing) */
  onPaid: () => void
}

const ERROR_KEYS: Record<CardPaymentErrorCode, string> = {
  card_declined: 'errorDeclined',
  expired_card: 'errorExpiredCard',
  incorrect_cvc: 'errorIncorrectCvc',
  insufficient_funds: 'errorInsufficientFunds',
  authentication_failed: 'errorAuthentication',
  not_a_card: 'errorNotACard',
  already_paid: 'errorAlreadyPaid',
  expired: 'errorExpired',
  price_changed: 'errorPriceChanged',
  not_available: 'errorNotAvailable',
  failed: 'errorFailed',
}

const STRIPE_LOCALES: Record<string, StripeElementLocale> = { en: 'en', ko: 'ko', de: 'de' }

function money(cents: number) {
  return `$${(cents / 100).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

export function CardPaymentForm(props: CardPaymentFormProps) {
  const locale = useLocale()
  const options = useMemo<StripeElementsOptions>(
    () => ({
      mode: 'payment',
      // Stripe needs an amount to show the form; what is charged is decided
      // on the server once the card is known.
      amount: Math.max(50, props.amountCents),
      currency: 'usd',
      paymentMethodTypes: ['card'],
      ...(props.saveForLater ? { setupFutureUsage: 'off_session' as const } : {}),
      locale: STRIPE_LOCALES[locale] || 'auto',
      appearance: {
        theme: 'stripe',
        variables: { colorPrimary: '#3D5A80', borderRadius: '4px' },
      },
    }),
    [props.amountCents, props.saveForLater, locale],
  )
  return (
    <Elements stripe={getStripe()} options={options}>
      <CardPaymentFields {...props} />
    </Elements>
  )
}

type Stage = 'entry' | 'checking' | 'review' | 'paying' | 'done'

function CardPaymentFields({
  amountCents,
  feePercent,
  billingName,
  billingEmail,
  submit,
  onPaid,
}: CardPaymentFormProps) {
  const t = useTranslations('cardPayment')
  const stripe = useStripe()
  const elements = useElements()
  const [stage, setStage] = useState<Stage>('entry')
  const [complete, setComplete] = useState(false)
  const [quote, setQuote] = useState<CardQuote | null>(null)
  const [tokenId, setTokenId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  // The last attempt's PaymentIntent, so the server can close it
  const lastAttempt = useRef<string | undefined>(undefined)

  const backToEntry = (message: string | null) => {
    setError(message)
    setQuote(null)
    setTokenId(null)
    setStage('entry')
  }

  const send = async (request: CardPaymentRequest) => {
    try {
      return await submit({ ...request, previousPaymentIntentId: lastAttempt.current })
    } catch (e) {
      console.error('[card-payment] Request failed:', e)
      backToEntry(t('errorFailed'))
      return null
    }
  }

  const refused = (response: CardPaymentResponse) => {
    if (response.ok) return
    if (response.paymentIntentId) lastAttempt.current = response.paymentIntentId
    backToEntry(t(ERROR_KEYS[response.code] || 'errorFailed'))
  }

  const paid = () => {
    setStage('done')
    onPaid()
  }

  // Step 2: read the card and get its total. Charges nothing.
  const review = async () => {
    if (!stripe || !elements) return
    setError(null)
    setNotice(null)
    setStage('checking')
    const { error: submitError } = await elements.submit()
    if (submitError) return backToEntry(submitError.message || t('errorFailed'))
    const { error: tokenError, confirmationToken } = await stripe.createConfirmationToken({
      elements,
      params: {
        payment_method_data: {
          billing_details: {
            ...(billingName ? { name: billingName } : {}),
            ...(billingEmail ? { email: billingEmail } : {}),
          },
        },
        return_url: window.location.href,
      },
    })
    if (tokenError || !confirmationToken) {
      return backToEntry(tokenError?.message || t('errorFailed'))
    }
    const response = await send({ confirmationTokenId: confirmationToken.id })
    if (!response) return
    if (response.ok && response.status === 'quote') {
      setTokenId(confirmationToken.id)
      setQuote(response.quote)
      setStage('review')
      return
    }
    refused(response)
  }

  // Step 3: charge exactly the total the customer is looking at.
  const pay = async () => {
    if (!stripe || !quote || !tokenId) return
    setError(null)
    setNotice(null)
    setStage('paying')
    const response = await send({
      confirmationTokenId: tokenId,
      confirmTotalCents: quote.totalCents,
    })
    if (!response) return
    if (!response.ok) return refused(response)
    if (response.status === 'quote') {
      // The amount changed since the review (e.g. the trip's fee was
      // edited). Nothing was charged; show the new total.
      setQuote(response.quote)
      setNotice(t('amountUpdated'))
      setStage('review')
      return
    }
    if (response.status !== 'requires_action') return paid() // succeeded / processing

    // 3-D Secure
    lastAttempt.current = response.paymentIntentId
    const { error: actionError, paymentIntent } = await stripe.handleNextAction({
      clientSecret: response.clientSecret,
    })
    if (actionError) return backToEntry(actionError.message || t('errorAuthentication'))
    if (paymentIntent?.status === 'succeeded' || paymentIntent?.status === 'processing') {
      return paid()
    }
    backToEntry(t('errorAuthentication'))
  }

  const busy = stage === 'checking' || stage === 'paying' || stage === 'done'

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {feePercent > 0
          ? t('intro', { rate: formatFeePercent(feePercent) })
          : t('introNoFee')}
      </p>

      <PaymentElement
        options={{
          readOnly: stage !== 'entry',
          wallets: { applePay: 'never', googlePay: 'never' },
        }}
        onChange={(event) => setComplete(event.complete)}
      />

      {error && (
        <div
          role="alert"
          className="flex gap-3 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {quote && (stage === 'review' || stage === 'paying' || stage === 'done') ? (
        <div className="space-y-3">
          <div className="border border-border bg-muted/30 p-4 text-sm">
            <p className="mb-2 font-medium">
              {t(
                quote.funding === 'credit'
                  ? 'creditCard'
                  : quote.funding === 'debit'
                    ? 'debitCard'
                    : quote.funding === 'prepaid'
                      ? 'prepaidCard'
                      : 'card',
              )}
              {quote.last4 && (
                <span className="font-normal text-muted-foreground">
                  {' '}
                  · {quote.brand ? `${quote.brand.toUpperCase()} ` : ''}•••• {quote.last4}
                </span>
              )}
            </p>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span>{t('payment')}</span>
                <span>{money(quote.paymentCents)}</span>
              </div>
              {quote.feeCents > 0 ? (
                <div className="flex justify-between text-muted-foreground">
                  <span>{t('fee', { rate: formatFeePercent(quote.feePercent) })}</span>
                  <span>{money(quote.feeCents)}</span>
                </div>
              ) : (
                feePercent > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>{t('noFee')}</span>
                    <span>{money(0)}</span>
                  </div>
                )
              )}
              {quote.feeNote && (
                <p className="text-xs text-muted-foreground">
                  {quote.feeNote === 'quebec'
                    ? t('feeNoteQuebec')
                    : t('feeNoteCanada', { rate: formatFeePercent(quote.feePercent) })}
                </p>
              )}
              <div className="mt-2 flex justify-between border-t border-border pt-2 font-medium">
                <span>{t('total')}</span>
                <span>{money(quote.totalCents)}</span>
              </div>
            </div>
          </div>

          {notice && (
            <p role="status" className="text-sm text-amber-700">
              {notice}
            </p>
          )}

          <Button
            onClick={pay}
            disabled={busy}
            className="w-full bg-[#3D5A80] hover:bg-[#3D5A80]/90"
            size="lg"
          >
            {busy ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('paying')}
              </>
            ) : (
              <>
                <Lock className="mr-2 h-4 w-4" />
                {t('pay', { amount: money(quote.totalCents) })}
              </>
            )}
          </Button>
          {!busy && (
            <Button variant="ghost" onClick={() => backToEntry(null)} className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('changeCard')}
            </Button>
          )}
        </div>
      ) : (
        <Button
          onClick={review}
          disabled={!stripe || !elements || !complete || busy}
          className="w-full bg-[#3D5A80] hover:bg-[#3D5A80]/90"
          size="lg"
        >
          {stage === 'checking' ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t('checking')}
            </>
          ) : (
            t('continue')
          )}
        </Button>
      )}

      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Lock className="h-3 w-3" />
        {t('secure')}
      </p>
    </div>
  )
}
