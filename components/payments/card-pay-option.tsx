'use client'

import { useState } from 'react'
import { AnimatedButton } from '@/components/ui/animated-button'
import { CardPaymentForm } from '@/components/payments/card-payment-form'
import type { CardPaymentRequest, CardPaymentResponse } from '@/lib/card-payment'

// "Pay by card" on the server-rendered payment pages (/pay/[id],
// /package/[id]): a button that opens the card form in place, posting to the
// page's card endpoint (/api/pay/[id]/card, /api/package/[id]/card).

export interface CardPayOptionProps {
  label: string
  /** Text for the button's hover state */
  hoverText: string
  colors: { start: string; end: string }
  buttonClassName?: string
  endpoint: string
  /** Sent with every request, e.g. the custom-package payment type */
  extraBody?: Record<string, string>
  successUrl: string
  amountCents: number
  feePercent: number
  saveForLater: boolean
  billingName?: string
  billingEmail?: string
}

export function CardPayOption({
  label,
  hoverText,
  colors,
  buttonClassName,
  endpoint,
  extraBody,
  successUrl,
  ...form
}: CardPayOptionProps) {
  const [open, setOpen] = useState(false)

  const submit = async (request: CardPaymentRequest): Promise<CardPaymentResponse> => {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...extraBody, ...request }),
    })
    const data = await response.json().catch(() => null)
    return data && typeof data.ok === 'boolean' ? data : { ok: false, code: 'failed' }
  }

  if (!open) {
    return (
      <AnimatedButton
        type="button"
        onClick={() => setOpen(true)}
        startColor={colors.start}
        endColor={colors.end}
        hoverText={hoverText}
        className={buttonClassName}
      >
        {label}
      </AnimatedButton>
    )
  }

  return (
    <div className="w-full rounded border border-border bg-background p-4">
      <CardPaymentForm
        {...form}
        submit={submit}
        onPaid={() => window.location.assign(successUrl)}
      />
    </div>
  )
}
