"use client"

import { useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  CANADIAN_CARD_FEE_CAP_PERCENT,
  DEFAULT_CARD_FEE_PERCENT,
  MAX_CARD_FEE_PERCENT,
} from "@/lib/booking-price"

/**
 * The credit card processing fee for one trip or custom package, stored on
 * trips.credit_card_fee_percent (migration 062). Used by all four trip /
 * custom-package forms. The site default is set at Admin → Payments.
 */
export function CardFeeField({
  value,
  onChange,
  fillDefault = false,
}: {
  /** Kept as text so the admin can clear the box while typing. */
  value: string
  onChange: (value: string) => void
  /** Create forms: start from the site default (Admin → Payments). */
  fillDefault?: boolean
}) {
  // Only the first render's value decides whether to fill it in, so a value
  // the admin types before the request returns is never overwritten.
  const shouldFill = useRef(fillDefault && value.trim() === "")
  useEffect(() => {
    if (!shouldFill.current) return
    let cancelled = false
    fetch("/api/admin/settings/card-fee")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled) return
        const percent = Number(data?.percent)
        onChange(String(Number.isFinite(percent) ? percent : DEFAULT_CARD_FEE_PERCENT))
      })
      .catch(() => {
        if (!cancelled) onChange(String(DEFAULT_CARD_FEE_PERCENT))
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const valid = isValidCardFee(value)
  const percent = Number(value)

  return (
    <div className="space-y-3 rounded-lg border border-border p-4">
      <div>
        <Label htmlFor="credit_card_fee_percent" className="text-base font-medium text-foreground">
          Credit card fee
        </Label>
        <p className="text-sm text-muted-foreground">
          Added to every credit card payment for this trip: deposit, full payment and
          balance. Use 0 for no fee. Debit and prepaid cards are never charged it, and
          Canadian credit cards pay at most {CANADIAN_CARD_FEE_CAP_PERCENT}%. Bank
          transfers never have a fee. The default for new trips is set in Payments.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Input
          id="credit_card_fee_percent"
          type="number"
          inputMode="decimal"
          min={0}
          max={MAX_CARD_FEE_PERCENT}
          step={0.1}
          value={value}
          placeholder={shouldFill.current ? "Loading…" : undefined}
          onChange={(e) => onChange(e.target.value)}
          className="w-28"
        />
        <span className="text-sm text-muted-foreground">%</span>
      </div>
      {value.trim() !== "" && !valid && (
        <p className="text-xs text-red-600">
          Enter a percentage from 0 to {MAX_CARD_FEE_PERCENT}.
        </p>
      )}
      {valid && percent > 3 && (
        <p className="text-xs text-amber-700">
          Visa caps credit card surcharges at 3% in the US.
        </p>
      )}
      {valid && (
        <p className="text-xs text-muted-foreground">
          e.g. a $1,000.00 deposit by credit card is charged $
          {(1000 + (1000 * percent) / 100).toFixed(2)}.
        </p>
      )}
    </div>
  )
}

/** Whether the field's text is a storable percentage. */
export function isValidCardFee(value: string): boolean {
  const n = Number(value)
  return value.trim() !== "" && Number.isFinite(n) && n >= 0 && n <= MAX_CARD_FEE_PERCENT
}
