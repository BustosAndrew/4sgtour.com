import { SiteHeaderWrapper } from '@/components/site-header-wrapper'
import { SiteFooter } from '@/components/site-footer'
import { AnimatedButton } from '@/components/ui/animated-button'
import { notFound } from 'next/navigation'
import { AlertCircle, Building2, CheckCircle2, CreditCard } from 'lucide-react'
import type { Metadata } from 'next'
import { getServerLocale, getServerTranslations } from '@/lib/i18n/server'
import { getPaymentLinkStage, loadPaymentLink } from '@/lib/payment-link-server'
import {
  cardFeeCents,
  formatFeePercent,
  getBookingCardFeePercent,
  toCents,
} from '@/lib/booking-price'
import { parseCalendarDate, toCalendarDate } from '@/lib/calendar-date'
import { getSupportEmail } from '@/lib/site-email'

// Opened from an SMS payment link, usually signed out (see
// lib/payment-link-server.ts). The customer chooses bank transfer or card;
// card payments carry the card processing fee, so each gets its own button
// and its own Stripe session.

export const metadata: Metadata = {
  title: 'Payment | 4 Seasons Golf Tour',
  robots: { index: false, follow: false, nocache: true },
}

function formatMoney(cents: number) {
  return `$${(cents / 100).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

const ERROR_KEYS: Record<string, string> = {
  already_paid: 'errorAlreadyPaid',
  expired: 'errorExpired',
  invalid_request: 'errorCheckoutFailed',
  checkout_failed: 'errorCheckoutFailed',
}

export default async function PaymentLinkPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const { id } = await params
  const { error: errorCode } = await searchParams
  const row = await loadPaymentLink(id)
  if (!row) notFound()

  const t = await getServerTranslations('paymentLink')
  const locale = await getServerLocale()
  const dateFormat = new Intl.DateTimeFormat(
    locale === 'ko' ? 'ko-KR' : locale === 'de' ? 'de-DE' : 'en-US',
    { year: 'numeric', month: 'long', day: 'numeric' },
  )
  const formatDate = (value: unknown) => {
    const date = toCalendarDate(value)
    return date ? dateFormat.format(parseCalendarDate(date)) : ''
  }

  const stage = getPaymentLinkStage(row)
  const details = row.booking_details || {}
  const paymentCents = toCents(Number(row.deposit_amount) || 0)
  // The fee quoted in the text (the trip's when the link was sent).
  const feePercent = getBookingCardFeePercent(row.booking_details)
  const feeCents = cardFeeCents(paymentCents, feePercent)
  const rate = formatFeePercent(feePercent)
  const isFullPayment = !!row.remaining_balance_charged
  const remainingCents = toCents(Number(row.remaining_balance) || 0)
  const errorKey = errorCode ? ERROR_KEYS[errorCode] : undefined
  const supportEmail = getSupportEmail(row.site_url)
  const travelDates = [formatDate(details.start_date), formatDate(details.end_date)]
    .filter(Boolean)
    .join(' – ')

  const payForm = (
    method: 'ach' | 'card',
    label: string,
    note: string,
    Icon: typeof CreditCard,
    colors: { start: string; end: string },
  ) => (
    // A plain form POST: works without JavaScript; the route creates the
    // Stripe session for this method and redirects to it.
    <form action={`/api/pay/${id}/checkout`} method="post" className="space-y-2">
      <input type="hidden" name="method" value={method} />
      <AnimatedButton
        type="submit"
        startColor={colors.start}
        endColor={colors.end}
        hoverText={t('letsGo')}
        className="w-full"
      >
        {label}
      </AnimatedButton>
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Icon className="h-4 w-4 shrink-0" />
        {note}
      </p>
    </form>
  )

  const statusPanel = (title: string, message: string) => (
    <div className="rounded-lg bg-emerald-50 p-4 text-emerald-800">
      <div className="flex items-start gap-3">
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
        <div>
          <p className="font-semibold">{title}</p>
          <p className="mt-1 text-sm opacity-90">{message}</p>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-background">
      <SiteHeaderWrapper />
      <main className="container max-w-xl px-4 pt-28 pb-16 sm:px-6 lg:pt-32">
        <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
          {t('eyebrow')}
        </p>
        <h1 className="mt-2 font-serif text-2xl font-bold sm:text-3xl">
          {row.trip_title || details.trip_title}
        </h1>
        {row.customer_name && (
          <p className="mt-1 text-sm text-muted-foreground">
            {t('preparedFor', { name: row.customer_name })}
          </p>
        )}

        <dl className="mt-6 space-y-2 border-y border-border py-4 text-sm">
          {details.package_name && (
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">{t('package')}</dt>
              <dd className="text-right font-medium">{details.package_name}</dd>
            </div>
          )}
          {travelDates && (
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">{t('travelDates')}</dt>
              <dd className="text-right font-medium">{travelDates}</dd>
            </div>
          )}
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">
              {isFullPayment
                ? t('fullPayment')
                : t('deposit', { percentage: row.deposit_percentage || 30 })}
            </dt>
            <dd className="text-right text-lg font-bold">{formatMoney(paymentCents)}</dd>
          </div>
        </dl>

        <div className="mt-6 space-y-5">
          {errorKey && (
            <div
              role="alert"
              className="flex gap-3 rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800"
            >
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
              <p>{t(errorKey)}</p>
            </div>
          )}

          {stage === 'payable' && (
            <>
              {payForm(
                'ach',
                t('payByBank', { amount: formatMoney(paymentCents) }),
                t('bankNote'),
                Building2,
                { start: '#274C77', end: '#1a3a5c' },
              )}
              {payForm(
                'card',
                t('payByCard', { amount: formatMoney(paymentCents + feeCents) }),
                feeCents > 0
                  ? t('cardNote', { fee: formatMoney(feeCents), rate })
                  : t('cardNoteNoFee'),
                CreditCard,
                { start: '#6096BA', end: '#4a7a9e' },
              )}
              {!isFullPayment && remainingCents > 0 && row.auto_charge_date && (
                <p className="text-sm text-muted-foreground">
                  {t(feePercent > 0 ? 'remainingAutoCharge' : 'remainingAutoChargeNoFee', {
                    amount: formatMoney(remainingCents),
                    date: formatDate(row.auto_charge_date),
                    rate,
                  })}
                </p>
              )}
              <p className="text-xs text-muted-foreground">{t('secureNote')}</p>
            </>
          )}

          {stage === 'paid' && statusPanel(t('paidTitle'), t('paidMessage'))}
          {stage === 'processing' &&
            statusPanel(t('processingTitle'), t('processingMessage'))}
          {stage === 'expired' && (
            <div className="rounded-lg bg-muted p-4 text-sm">
              <p className="font-semibold">{t('expiredTitle')}</p>
              <p className="mt-1 text-muted-foreground">
                {t('expiredMessage')}{' '}
                <a href={`mailto:${supportEmail}`} className="text-[#274C77] underline">
                  {supportEmail}
                </a>
              </p>
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
