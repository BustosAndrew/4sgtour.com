'use client'

import { useCallback, useState, useRef, useMemo } from 'react'
import {
  EmbeddedCheckout,
  EmbeddedCheckoutProvider,
} from '@stripe/react-stripe-js'
import { loadStripe, type Stripe } from '@stripe/stripe-js'
import { createTripCheckoutSession } from '@/app/actions/stripe'
import { CreditCard, Building2, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useTranslations } from '@/lib/i18n/provider'

// Initialize stripe once, outside of component
let stripePromise: Promise<Stripe | null> | null = null
const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
  }
  return stripePromise
}

// Separate component for the embedded checkout to ensure clean mounting
// All props must be stable - they cannot change after initial mount
interface EmbeddedCheckoutWrapperProps {
  checkoutParams: {
    packageId: string
    tripId: string
    tripTitle: string
    paymentMethod: 'card' | 'ach'
    customerName: string
    customerEmail: string
    customerPhone: string
    startDate: string
    endDate: string
    roomType: string
    packageName: string
    golfCourses?: string[]
    mealOption?: string
    transportOption?: string
    additionalRequests?: string
  }
  onCompleteRef: React.RefObject<(() => void) | undefined>
}

function EmbeddedCheckoutWrapper({ checkoutParams, onCompleteRef }: EmbeddedCheckoutWrapperProps) {
  // Capture params at mount time using useMemo
  const stableParams = useMemo(() => checkoutParams, [])
  
  const fetchClientSecret = useCallback(async () => {
    return createTripCheckoutSession(stableParams)
  }, [stableParams])

  // Stable onComplete that reads from ref
  const onComplete = useCallback(() => {
    onCompleteRef.current?.()
  }, [onCompleteRef])

  // Memoize options to prevent any changes
  const options = useMemo(() => ({
    fetchClientSecret,
    onComplete,
  }), [fetchClientSecret, onComplete])

  return (
    <EmbeddedCheckoutProvider
      stripe={getStripe()}
      options={options}
    >
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
  startDate: string
  endDate: string
  roomType: string
  golfCourses?: string[]
  mealOption?: string
  transportOption?: string
  additionalRequests?: string
  prefillName?: string
  prefillEmail?: string
  prefillPhone?: string
  isGuest: boolean
  onBack: () => void
  onSuccess?: () => void
}

type PaymentMethod = 'card' | 'ach' | null

export function StripeCheckout({
  tripId,
  tripTitle,
  packageId,
  packageName,
  packagePrice,
  startDate,
  endDate,
  roomType,
  golfCourses,
  mealOption,
  transportOption,
  additionalRequests,
  prefillName,
  prefillEmail,
  prefillPhone,
  isGuest,
  onBack,
  onSuccess,
}: StripeCheckoutProps) {
  const t = useTranslations('checkout')

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(null)
  const [customerName, setCustomerName] = useState(prefillName || '')
  const [customerEmail, setCustomerEmail] = useState(prefillEmail || '')
  const [customerPhone, setCustomerPhone] = useState(prefillPhone || '')
  
  // Store checkout params when user proceeds - this freezes the values
  const [checkoutParams, setCheckoutParams] = useState<EmbeddedCheckoutWrapperProps['checkoutParams'] | null>(null)
  
  // Use ref for onSuccess to avoid changing the onComplete callback
  const onSuccessRef = useRef(onSuccess)
  onSuccessRef.current = onSuccess

  const depositAmount = packagePrice * 0.3
  const cardFee = depositAmount * 0.04
  const cardTotal = depositAmount + cardFee

  const validateAndProceed = () => {
    if (!customerName.trim()) {
      alert(t('fullName') + ' is required')
      return
    }
    if (!customerEmail.trim() || !customerEmail.includes('@')) {
      alert(t('emailAddress') + ' is invalid')
      return
    }
    if (!customerPhone.trim()) {
      alert(t('phoneNumber') + ' is required')
      return
    }
    if (!paymentMethod) {
      alert(t('paymentMethod') + ' is required')
      return
    }
    
    // Freeze the params at this moment - this ensures the checkout wrapper
    // gets stable props and won't try to change fetchClientSecret
    setCheckoutParams({
      packageId,
      tripId,
      tripTitle,
      paymentMethod,
      customerName,
      customerEmail,
      customerPhone,
      startDate,
      endDate,
      roomType,
      packageName,
      golfCourses,
      mealOption,
      transportOption,
      additionalRequests,
    })
  }

  const handleBackToPayment = () => {
    // Clear checkout params to unmount the EmbeddedCheckoutProvider
    setCheckoutParams(null)
  }

  // Show Stripe checkout when params are set
  if (checkoutParams) {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          onClick={handleBackToPayment}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('backToPaymentOptions')}
        </Button>

        <div className="border border-border bg-muted/30 p-4 mb-4">
          <h3 className="font-medium mb-2">{t('paymentSummary')}</h3>
          <div className="text-sm space-y-1">
            <div className="flex justify-between">
              <span>{t('deposit')}</span>
              <span>${depositAmount.toFixed(2)}</span>
            </div>
            {checkoutParams.paymentMethod === 'card' && (
              <div className="flex justify-between text-muted-foreground">
                <span>{t('cardProcessingFee')}</span>
                <span>${cardFee.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-medium pt-2 border-t border-border mt-2">
              <span>{t('total')}</span>
              <span>
                ${checkoutParams.paymentMethod === 'card' ? cardTotal.toFixed(2) : depositAmount.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        <div id="checkout">
          <EmbeddedCheckoutWrapper
            checkoutParams={checkoutParams}
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
        <h2 className="font-serif text-xl font-medium mb-4">{t('contactInformation')}</h2>
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
            <Input
              id="customer-phone"
              type="tel"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="+1 (555) 000-0000"
              className="mt-1"
            />
          </div>
        </div>
      </div>

      <div className="border border-border bg-background p-6">
        <h2 className="font-serif text-xl font-medium mb-4">{t('paymentMethod')}</h2>
        <p className="text-sm text-muted-foreground mb-4">
          {t('depositRequired', { amount: `$${depositAmount.toFixed(2)}` })}
        </p>

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
                <div className="text-sm text-muted-foreground">{t('noProcessingFee')}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-medium">${depositAmount.toFixed(2)}</div>
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
                  {t('processingFee', { fee: `$${cardFee.toFixed(2)}` })}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-medium">${cardTotal.toFixed(2)}</div>
            </div>
          </button>
        </div>
      </div>

      <div className="border border-border bg-muted/30 p-4">
        <h3 className="font-medium mb-2">{t('paymentSummary')}</h3>
        <div className="text-sm space-y-1">
          <div className="flex justify-between">
            <span>{t('trip')}</span>
            <span className="font-medium">{tripTitle}</span>
          </div>
          <div className="flex justify-between">
            <span>{t('package')}</span>
            <span>{packageName}</span>
          </div>
          <div className="flex justify-between">
            <span>{t('travelDates')}</span>
            <span>{startDate} - {endDate}</span>
          </div>
          <div className="flex justify-between">
            <span>{t('roomType')}</span>
            <span>{roomType}</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-border mt-2">
            <span>{t('packageTotal')}</span>
            <span className="font-medium">${packagePrice.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-[#3D5A80] font-medium">
            <span>{t('depositDue')}</span>
            <span>${depositAmount.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <Button
        onClick={validateAndProceed}
        disabled={!paymentMethod || !customerName || !customerEmail || !customerPhone}
        className="w-full bg-[#3D5A80] hover:bg-[#3D5A80]/90"
        size="lg"
      >
        {t('continueToPayment')}
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
