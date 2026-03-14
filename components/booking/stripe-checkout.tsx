'use client'

import { useCallback, useState } from 'react'
import {
  EmbeddedCheckout,
  EmbeddedCheckoutProvider,
} from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { createTripCheckoutSession } from '@/app/actions/stripe'
import { CreditCard, Building2, ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

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
  // Prefilled user info (for logged-in users)
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
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(null)
  const [customerName, setCustomerName] = useState(prefillName || '')
  const [customerEmail, setCustomerEmail] = useState(prefillEmail || '')
  const [customerPhone, setCustomerPhone] = useState(prefillPhone || '')
  const [showCheckout, setShowCheckout] = useState(false)
  const [isValidating, setIsValidating] = useState(false)

  const depositAmount = packagePrice * 0.3
  const cardFee = depositAmount * 0.04
  const cardTotal = depositAmount + cardFee

  const validateAndProceed = () => {
    if (!customerName.trim()) {
      alert('Please enter your name')
      return
    }
    if (!customerEmail.trim() || !customerEmail.includes('@')) {
      alert('Please enter a valid email address')
      return
    }
    if (!customerPhone.trim()) {
      alert('Please enter your phone number')
      return
    }
    if (!paymentMethod) {
      alert('Please select a payment method')
      return
    }
    setShowCheckout(true)
  }

  const fetchClientSecret = useCallback(async () => {
    return createTripCheckoutSession({
      packageId,
      tripId,
      tripTitle,
      paymentMethod: paymentMethod!,
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
  }, [
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
  ])

  const handleComplete = useCallback(() => {
    onSuccess?.()
  }, [onSuccess])

  if (showCheckout && paymentMethod) {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          onClick={() => setShowCheckout(false)}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to payment options
        </Button>

        <div className="border border-border bg-muted/30 p-4 mb-4">
          <h3 className="font-medium mb-2">Payment Summary</h3>
          <div className="text-sm space-y-1">
            <div className="flex justify-between">
              <span>30% Deposit</span>
              <span>${depositAmount.toFixed(2)}</span>
            </div>
            {paymentMethod === 'card' && (
              <div className="flex justify-between text-muted-foreground">
                <span>Card Processing Fee (4%)</span>
                <span>${cardFee.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-medium pt-2 border-t border-border mt-2">
              <span>Total</span>
              <span>
                ${paymentMethod === 'card' ? cardTotal.toFixed(2) : depositAmount.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        <div id="checkout">
          <EmbeddedCheckoutProvider
            stripe={stripePromise}
            options={{
              fetchClientSecret,
              onComplete: handleComplete,
            }}
          >
            <EmbeddedCheckout />
          </EmbeddedCheckoutProvider>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={onBack} className="mb-2">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to booking details
      </Button>

      <div className="border border-border bg-background p-6">
        <h2 className="font-serif text-xl font-medium mb-4">Contact Information</h2>
        <p className="text-sm text-muted-foreground mb-4">
          {isGuest
            ? 'Please provide your contact details for booking confirmation.'
            : 'Confirm your contact details for this booking.'}
        </p>

        <div className="space-y-4">
          <div>
            <Label htmlFor="customer-name">Full Name *</Label>
            <Input
              id="customer-name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="John Smith"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="customer-email">Email Address *</Label>
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
            <Label htmlFor="customer-phone">Phone Number *</Label>
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
        <h2 className="font-serif text-xl font-medium mb-4">Payment Method</h2>
        <p className="text-sm text-muted-foreground mb-4">
          A 30% deposit (${depositAmount.toFixed(2)}) is required to confirm your booking.
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
                <div className="font-medium">Bank Transfer (ACH)</div>
                <div className="text-sm text-muted-foreground">No processing fee</div>
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
                <div className="font-medium">Credit/Debit Card</div>
                <div className="text-sm text-muted-foreground">
                  +4% processing fee (${cardFee.toFixed(2)})
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
        <h3 className="font-medium mb-2">Booking Summary</h3>
        <div className="text-sm space-y-1">
          <div className="flex justify-between">
            <span>Trip</span>
            <span className="font-medium">{tripTitle}</span>
          </div>
          <div className="flex justify-between">
            <span>Package</span>
            <span>{packageName}</span>
          </div>
          <div className="flex justify-between">
            <span>Travel Dates</span>
            <span>{startDate} - {endDate}</span>
          </div>
          <div className="flex justify-between">
            <span>Room Type</span>
            <span>{roomType}</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-border mt-2">
            <span>Package Total</span>
            <span className="font-medium">${packagePrice.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-[#3D5A80] font-medium">
            <span>Deposit Due (30%)</span>
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
        Continue to Payment
      </Button>

      {isGuest && (
        <p className="text-xs text-center text-muted-foreground">
          Don&apos;t have an account?{' '}
          <a href="/auth/sign-up" className="text-[#3D5A80] hover:underline">
            Sign up
          </a>{' '}
          to manage your bookings and communicate with our team.
        </p>
      )}
    </div>
  )
}
