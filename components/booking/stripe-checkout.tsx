'use client'

import { useCallback, useState, useRef, useMemo, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  EmbeddedCheckout,
  EmbeddedCheckoutProvider,
} from '@stripe/react-stripe-js'
import { loadStripe, type Stripe } from '@stripe/stripe-js'
import { createTripCheckoutSession } from '@/app/actions/stripe'
import { sendPaymentLinkSms } from '@/app/actions/send-payment-link'
import {
  CreditCard,
  Building2,
  ArrowLeft,
  Smartphone,
  CheckCircle2,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useTranslations } from '@/lib/i18n/provider'
import { PaymentConsent } from '@/components/payment-consent'
import { PhoneInput } from '@/components/phone-input'
import { isE164, normalizeE164 } from '@/lib/phone'
import {
  calculatePaymentAmounts,
  cardFeeCents,
  formatCents,
  type CheckoutErrorCode,
  type PaymentAmounts,
} from '@/lib/booking-price'

// Initialize stripe once, outside of component
let stripePromise: Promise<Stripe | null> | null = null
const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
  }
  return stripePromise
}

// Mounts Stripe's embedded form for a session that was already created. The
// session is created *before* this mounts (see validateAndProceed) so a
// refused checkout — e.g. the price changed — is explained on our own screen
// instead of surfacing as Stripe's generic "something went wrong".
function EmbeddedCheckoutWrapper({
  clientSecret,
  onCompleteRef,
}: {
  clientSecret: string
  onCompleteRef: React.RefObject<(() => void) | undefined>
}) {
  // Stable onComplete that reads from ref
  const onComplete = useCallback(() => {
    onCompleteRef.current?.()
  }, [onCompleteRef])

  // The provider's options must not change after mount
  const options = useMemo(
    () => ({ clientSecret, onComplete }),
    [clientSecret, onComplete],
  )

  return (
    <EmbeddedCheckoutProvider stripe={getStripe()} options={options}>
      <EmbeddedCheckout />
    </EmbeddedCheckoutProvider>
  )
}

interface StripeCheckoutProps {
  tripId: string
  tripTitle: string
  packageId: string
  packageName: string
  packagePrice: number
  basePrice: number
  extraNights: number
  extraNightPrice: number
  singleOccupancySurcharge?: number
  startDate: string
  endDate: string
  roomType: string
  golfCourses?: string[]
  mealOption?: string
  transportOption?: string
  additionalRequests?: string
  guests?: Array<{
    name: string
    phone: string
    occupancy: 'single' | 'double'
  }>
  prefillName?: string
  prefillEmail?: string
  prefillPhone?: string
  isGuest: boolean
  onBack: () => void
  onSuccess?: () => void
  /** The selected package was removed from the trip while the customer was booking. */
  onPackageUnavailable?: () => void
  depositPercentage?: number // Configurable deposit percentage (default 30)
}

type PaymentMethod = 'card' | 'ach' | 'sms' | null
type PaymentType = 'deposit' | 'full'

// Why a checkout couldn't start. 'PRICE_CHECK_FAILED' is ours: the price was
// refreshed and still didn't match, so refreshing again won't help and the
// customer needs another way to book.
type CheckoutNotice = CheckoutErrorCode | 'PRICE_CHECK_FAILED'

const NOTICE_MESSAGE_KEYS: Record<CheckoutNotice, string> = {
  PRICE_CHANGED: 'checkoutErrorPriceChanged',
  PRICE_CHECK_FAILED: 'checkoutErrorPriceCheckFailed',
  PACKAGE_UNAVAILABLE: 'checkoutErrorPackageUnavailable',
  TRIP_UNAVAILABLE: 'checkoutErrorTripUnavailable',
  INVALID_DATES: 'checkoutErrorInvalidDates',
  INVALID_PHONE: 'checkoutErrorInvalidPhone',
  SMS_FAILED: 'checkoutErrorSmsFailed',
  CHECKOUT_FAILED: 'checkoutErrorFailed',
}

export function StripeCheckout({
  tripId,
  tripTitle,
  packageId,
  packageName,
  packagePrice,
  basePrice,
  extraNights,
  extraNightPrice,
  singleOccupancySurcharge = 0,
  startDate,
  endDate,
  roomType,
  golfCourses,
  mealOption,
  transportOption,
  additionalRequests,
  guests = [],
  prefillName,
  prefillEmail,
  prefillPhone,
  isGuest,
  onBack,
  onSuccess,
  onPackageUnavailable,
  depositPercentage = 30,
}: StripeCheckoutProps) {
  const t = useTranslations('checkout')
  const router = useRouter()
  // True while router.refresh() is re-fetching the trip's current prices.
  // Continue stays disabled until then, so a retry can't go out with the
  // stale total and be refused a second time.
  const [refreshingPrices, startPriceRefresh] = useTransition()
  const refreshPrices = () => startPriceRefresh(() => router.refresh())

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(null)
  const [paymentType, setPaymentType] = useState<PaymentType>('deposit')
  const [customerName, setCustomerName] = useState(prefillName || '')
  const [customerEmail, setCustomerEmail] = useState(prefillEmail || '')
  const [customerPhone, setCustomerPhone] = useState(
    normalizeE164(prefillPhone) || '',
  )

  // A created Checkout Session, with the amounts the SERVER will charge
  const [checkout, setCheckout] = useState<{
    clientSecret: string
    amounts: PaymentAmounts
    paymentType: PaymentType
  } | null>(null)

  // Creating a session / sending a link, and why it last failed
  const [submitting, setSubmitting] = useState(false)
  const [notice, setNotice] = useState<CheckoutNotice | null>(null)
  // The total on screen when the server last said the price changed. If it
  // says so again for the same total after refreshing, stop offering a retry.
  const priceChangedForTotal = useRef<number | null>(null)

  // SMS payment link state
  const [smsSentAmountCents, setSmsSentAmountCents] = useState<number | null>(
    null,
  )
  const [smsConsent, setSmsConsent] = useState(false)

  // Use ref for onSuccess to avoid changing the onComplete callback
  const onSuccessRef = useRef(onSuccess)
  onSuccessRef.current = onSuccess

  // Every figure on this screen comes from the helper the server charges
  // with (lib/booking-price.ts), so screen and charge agree to the cent.
  const amountsFor = (method: 'card' | 'ach' | 'sms') =>
    calculatePaymentAmounts(packagePrice, depositPercentage, paymentType, method)
  const achAmounts = amountsFor('ach')
  const cardAmounts = amountsFor('card')
  const smsAmounts = amountsFor('sms')

  const handleFailure = (code: CheckoutErrorCode) => {
    if (code === 'PACKAGE_UNAVAILABLE') {
      // The package is gone; this screen can't continue. Send the customer
      // back to choose another one (the booking form says why).
      refreshPrices()
      onPackageUnavailable?.()
      return
    }

    if (code === 'PRICE_CHANGED') {
      if (priceChangedForTotal.current === packagePrice) {
        // Already refreshed for this exact total and it still doesn't match.
        setNotice('PRICE_CHECK_FAILED')
        return
      }
      priceChangedForTotal.current = packagePrice
      // Re-fetch the trip's current prices. Server components re-render with
      // fresh data and every field the customer filled in is kept.
      refreshPrices()
    }

    setNotice(code)
  }

  const validateAndProceed = async () => {
    if (!customerName.trim()) {
      alert(t('fullName') + ' is required')
      return
    }
    if (!customerEmail.trim() || !customerEmail.includes('@')) {
      alert(t('emailAddress') + ' is invalid')
      return
    }
    if (!isE164(customerPhone)) {
      setNotice('INVALID_PHONE')
      return
    }
    if (!paymentMethod) {
      alert(t('paymentMethod') + ' is required')
      return
    }

    const params = {
      packageId,
      tripId,
      tripTitle,
      customerName,
      customerEmail,
      customerPhone,
      startDate,
      endDate,
      roomType,
      packageName,
      // What the customer is looking at. The server recomputes the real
      // price and refuses if these differ.
      totalPrice: packagePrice,
      depositPercentage,
      paymentType,
      golfCourses,
      mealOption,
      transportOption,
      additionalRequests,
      guests,
    }

    setSubmitting(true)
    setNotice(null)
    try {
      if (paymentMethod === 'sms') {
        const result = await sendPaymentLinkSms(params)
        if (!result.ok) {
          handleFailure(result.code)
          return
        }
        priceChangedForTotal.current = null
        setSmsSentAmountCents(result.amounts.chargeCents)
        return
      }

      const result = await createTripCheckoutSession({
        ...params,
        paymentMethod,
      })
      if (!result.ok) {
        handleFailure(result.code)
        return
      }
      priceChangedForTotal.current = null
      setCheckout({
        clientSecret: result.clientSecret,
        amounts: result.amounts,
        paymentType,
      })
    } catch (error) {
      // Network failure, or a server error the action didn't catch
      console.error('[checkout] Could not start payment:', error)
      setNotice('CHECKOUT_FAILED')
    } finally {
      setSubmitting(false)
    }
  }

  const handleBackToPayment = () => {
    // Unmounts the EmbeddedCheckoutProvider. The abandoned session expires on
    // its own and the webhook marks its pending row expired.
    setCheckout(null)
  }

  // Show SMS sent confirmation
  if (smsSentAmountCents !== null) {
    return (
      <div className="w-full max-w-2xl mx-auto text-center py-16">
        <div className="mb-6">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <h2 className="font-serif text-2xl font-bold mb-3">
          {t('smsLinkSentTitle')}
        </h2>
        <p className="text-muted-foreground mb-2">
          {t('smsLinkSentMessage', { phone: customerPhone })}
        </p>
        <p className="text-sm text-muted-foreground mb-6">
          {t('smsLinkSentDeposit', {
            amount: `$${formatCents(smsSentAmountCents)}`,
            cardAmount: `$${formatCents(smsSentAmountCents + cardFeeCents(smsSentAmountCents))}`,
          })}
        </p>
        <div className="bg-muted/50 border border-border p-4 rounded-lg mb-6 max-w-md mx-auto">
          <p className="text-sm text-muted-foreground">{t('smsLinkExpiry')}</p>
        </div>
        <div className="flex flex-col gap-3 items-center">
          <Button
            variant="outline"
            onClick={() => {
              setSmsSentAmountCents(null)
              setNotice(null)
            }}
          >
            {t('smsLinkResend')}
          </Button>
          <a
            href="/bookings"
            className="text-[#3D5A80] hover:underline text-sm"
          >
            {t('smsLinkViewBookings')}
          </a>
        </div>
      </div>
    )
  }

  // Show Stripe checkout once the session exists
  if (checkout) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={handleBackToPayment} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('backToPaymentOptions')}
        </Button>

        {/* Amounts from the server's session — exactly what Stripe charges */}
        <div className="border border-border bg-muted/30 p-4 mb-4">
          <h3 className="font-medium mb-2">{t('paymentSummary')}</h3>
          <div className="text-sm space-y-1">
            <div className="flex justify-between">
              <span>
                {checkout.paymentType === 'full'
                  ? t('fullPayment')
                  : t('deposit')}
              </span>
              <span>${formatCents(checkout.amounts.paymentCents)}</span>
            </div>
            {checkout.amounts.feeCents > 0 && (
              <div className="flex justify-between text-muted-foreground">
                <span>{t('cardProcessingFee')}</span>
                <span>${formatCents(checkout.amounts.feeCents)}</span>
              </div>
            )}
            <div className="flex justify-between font-medium pt-2 border-t border-border mt-2">
              <span>{t('total')}</span>
              <span>${formatCents(checkout.amounts.chargeCents)}</span>
            </div>
          </div>
        </div>

        <div id="checkout">
          <EmbeddedCheckoutWrapper
            key={checkout.clientSecret}
            clientSecret={checkout.clientSecret}
            onCompleteRef={onSuccessRef}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={onBack} className="mb-2">
        <ArrowLeft className="mr-2 h-4 w-4" />
        {t('backToBookingDetails')}
      </Button>

      <div className="border border-border bg-background p-6">
        <h2 className="font-serif text-xl font-medium mb-4">
          {t('contactInformation')}
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          {isGuest ? t('guestContactPrompt') : t('memberContactPrompt')}
        </p>

        <div className="space-y-4">
          <div>
            <Label htmlFor="customer-name">{t('fullName')} *</Label>
            <Input
              id="customer-name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="John Smith"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="customer-email">{t('emailAddress')} *</Label>
            <Input
              id="customer-email"
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              placeholder="john@example.com"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="customer-phone">{t('phoneNumber')} *</Label>
            {/* Country picker + national number → E.164, so texts reach
                e.g. Korean "010-…" numbers. Holds '' until valid. */}
            <PhoneInput
              id="customer-phone"
              value={prefillPhone || ''}
              onChange={(e164) => setCustomerPhone(e164 || '')}
              placeholder={t('phoneNumberPlaceholder')}
              className="mt-1"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              {t('phoneNumberHint')}
            </p>
          </div>
        </div>
      </div>

      {/* Payment Type Selection */}
      <div className="border border-border bg-background p-6">
        <h2 className="font-serif text-xl font-medium mb-4">
          {t('paymentAmount')}
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          {t('paymentAmountDescription')}
        </p>

        <div className="space-y-3 mb-6">
          <button
            type="button"
            onClick={() => setPaymentType('deposit')}
            className={`w-full flex items-center justify-between border p-4 transition-colors ${
              paymentType === 'deposit'
                ? 'border-[#3D5A80] bg-[#3D5A80]/5'
                : 'border-border hover:border-gray-300'
            }`}
          >
            <div className="text-left">
              <div className="font-medium">
                {t('payDeposit', { percentage: depositPercentage })}
              </div>
              <div className="text-sm text-muted-foreground">
                {t('payDepositDescription')}
              </div>
            </div>
            <div className="text-right">
              <div className="font-medium">${formatCents(achAmounts.depositCents)}</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setPaymentType('full')}
            className={`w-full flex items-center justify-between border p-4 transition-colors ${
              paymentType === 'full'
                ? 'border-[#3D5A80] bg-[#3D5A80]/5'
                : 'border-border hover:border-gray-300'
            }`}
          >
            <div className="text-left">
              <div className="font-medium">{t('payFull')}</div>
              <div className="text-sm text-muted-foreground">
                {t('payFullDescription')}
              </div>
            </div>
            <div className="text-right">
              <div className="font-medium">${formatCents(achAmounts.totalCents)}</div>
            </div>
          </button>
        </div>
      </div>

      <div className="border border-border bg-background p-6">
        <h2 className="font-serif text-xl font-medium mb-4">
          {t('paymentMethod')}
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          {paymentType === 'full'
            ? t('fullPaymentRequired', {
                amount: `$${formatCents(achAmounts.totalCents)}`,
              })
            : t('depositRequired', {
                amount: `$${formatCents(achAmounts.depositCents)}`,
              })}
        </p>

        {/* Auto-charge disclaimer - only show for deposit payments */}
        {paymentType === 'deposit' && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-amber-800 mb-1">
                  {t('autoChargeTitle')}
                </p>
                <p className="text-amber-700">
                  {t('autoChargeDescription', {
                    remainingAmount: `$${formatCents(achAmounts.totalCents - achAmounts.depositCents)}`,
                  })}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <button
            type="button"
            onClick={() => setPaymentMethod('ach')}
            className={`w-full flex items-center justify-between border p-4 transition-colors ${
              paymentMethod === 'ach'
                ? 'border-[#3D5A80] bg-[#3D5A80]/5'
                : 'border-border hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              <div className="text-left">
                <div className="font-medium">{t('bankTransfer')}</div>
                <div className="text-sm text-muted-foreground">
                  {t('noProcessingFee')}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-medium">${formatCents(achAmounts.paymentCents)}</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setPaymentMethod('card')}
            className={`w-full flex items-center justify-between border p-4 transition-colors ${
              paymentMethod === 'card'
                ? 'border-[#3D5A80] bg-[#3D5A80]/5'
                : 'border-border hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <CreditCard className="h-5 w-5 text-muted-foreground" />
              <div className="text-left">
                <div className="font-medium">{t('creditDebitCard')}</div>
                <div className="text-sm text-muted-foreground">
                  {t('processingFee', {
                    fee: `$${formatCents(cardAmounts.feeCents)}`,
                  })}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-medium">${formatCents(cardAmounts.chargeCents)}</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setPaymentMethod('sms')}
            className={`w-full flex items-center justify-between border p-4 transition-colors ${
              paymentMethod === 'sms'
                ? 'border-[#3D5A80] bg-[#3D5A80]/5'
                : 'border-border hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <Smartphone className="h-5 w-5 text-muted-foreground" />
              <div className="text-left">
                <div className="font-medium">{t('smsPaymentLink')}</div>
                <div className="text-sm text-muted-foreground">
                  {t('smsPaymentLinkDescription')}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-medium">${formatCents(smsAmounts.chargeCents)}</div>
            </div>
          </button>
        </div>
      </div>

      <div className="border border-border bg-muted/30 p-4">
        <h3 className="font-medium mb-2">{t('paymentSummary')}</h3>
        <div className="text-sm space-y-1">
          <div className="flex justify-between">
            {/* <span>{t('trip')}</span> */}
            <span className="font-medium">{tripTitle}</span>
          </div>
          <div className="flex justify-between">
            <span>{t('package')}</span>
            <span>{packageName}</span>
          </div>
          <div className="flex justify-between">
            <span>{t('travelDates')}</span>
            <span>
              {startDate} - {endDate}
            </span>
          </div>
          <div className="flex justify-between">
            <span>{t('roomType')}</span>
            <span>{roomType}</span>
          </div>
          {extraNights > 0 || singleOccupancySurcharge > 0 ? (
            <>
              <div className="flex justify-between pt-2 border-t border-border mt-2">
                <span>{t('basePrice')}</span>
                <span>${basePrice.toFixed(2)}</span>
              </div>
              {extraNights > 0 && (
                <div className="flex justify-between">
                  <span>{t('extraNightsCost', { nights: extraNights })}</span>
                  <span>${(extraNights * extraNightPrice).toFixed(2)}</span>
                </div>
              )}
              {singleOccupancySurcharge > 0 && (
                <div className="flex justify-between text-amber-700">
                  <span>{t('singleOccupancySurcharge')} (+12%)</span>
                  <span>+${singleOccupancySurcharge.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-medium">
                <span>{t('packageTotal')}</span>
                <span>${formatCents(achAmounts.totalCents)}</span>
              </div>
            </>
          ) : (
            <div className="flex justify-between pt-2 border-t border-border mt-2">
              <span>{t('packageTotal')}</span>
              <span className="font-medium">
                ${formatCents(achAmounts.totalCents)}
              </span>
            </div>
          )}
          <div className="flex justify-between text-[#3D5A80] font-medium">
            <span>
              {paymentType === 'full' ? t('totalDue') : t('depositDue')}
            </span>
            <span>${formatCents(achAmounts.paymentCents)}</span>
          </div>
        </div>
      </div>

      {/* SMS consent handled inside PaymentConsent (below) */}

      {notice && (
        <div
          role="alert"
          className={`flex gap-3 p-3 text-sm rounded border ${
            notice === 'PRICE_CHANGED'
              ? 'bg-amber-50 border-amber-200 text-amber-800'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}
        >
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <p>{t(NOTICE_MESSAGE_KEYS[notice])}</p>
        </div>
      )}

      {/* Compliance consent block for SMS payments */}
      {paymentMethod === 'sms' && (
        <div className="mb-4">
          <PaymentConsent onSmsConsentChange={(v) => setSmsConsent(v)} />
        </div>
      )}

      <Button
        onClick={validateAndProceed}
        disabled={
          !paymentMethod ||
          !customerName ||
          !customerEmail ||
          !customerPhone ||
          submitting ||
          refreshingPrices ||
          (paymentMethod === 'sms' && !smsConsent)
        }
        className="w-full bg-[#3D5A80] hover:bg-[#3D5A80]/90"
        size="lg"
      >
        {submitting || refreshingPrices ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {refreshingPrices
              ? t('updatingPrices')
              : paymentMethod === 'sms'
                ? t('smsLinkSending')
                : t('preparingCheckout')}
          </>
        ) : paymentMethod === 'sms' ? (
          t('smsLinkSendButton')
        ) : (
          t('continueToPayment')
        )}
      </Button>

      {isGuest && (
        <p className="text-xs text-center text-muted-foreground">
          {t('noAccountPrompt')}{' '}
          <a href="/auth/sign-up" className="text-[#3D5A80] hover:underline">
            {t('signUp')}
          </a>{' '}
          {t('manageBookings')}
        </p>
      )}
    </div>
  )
}
