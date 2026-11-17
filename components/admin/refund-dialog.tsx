"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { CARD_REFUND_FEE_PERCENT } from "@/lib/cancellation-policy"

interface RefundQuote {
  cancelledBy: "customer" | "admin" | null
  cancelledAt: string | null
  schedule: "standard" | "western_us"
  feePercent: number
  tripTotal: number
  paidTowardTrip: number
  fee: number
  policyRefundDue: number
  cardFee: number
  paidByCard: boolean
  policyRefund: number
  fullRefund: number
  maxRefundable: number
}

type RefundOption = "policy" | "full" | "custom" | "none"

interface RefundDialogProps {
  bookingId: string | null
  customerName?: string
  tripTitle?: string
  onOpenChange: (open: boolean) => void
  /** Called after the refund is issued or the cancellation closed. */
  onDone: (result: { refunded: number }) => void
}

function money(amount: number) {
  return `$${Number(amount || 0).toFixed(2)}`
}

/**
 * Approve the refund for a cancelled booking (Terms → Cancellation Policy).
 * Amounts are recomputed by /api/admin/bookings/[id]/refund; the dialog
 * only picks which one.
 */
export function RefundDialog({
  bookingId,
  customerName,
  tripTitle,
  onOpenChange,
  onDone,
}: RefundDialogProps) {
  const [quote, setQuote] = useState<RefundQuote | null>(null)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [option, setOption] = useState<RefundOption>("policy")
  const [customAmount, setCustomAmount] = useState("")

  useEffect(() => {
    if (!bookingId) return
    let cancelled = false
    setQuote(null)
    setError(null)
    setLoading(true)
    fetch(`/api/admin/bookings/${bookingId}/refund`)
      .then(async (response) => {
        const data = await response.json().catch(() => ({}))
        if (cancelled) return
        if (!response.ok) {
          setError(data.error || "Couldn't load the refund details.")
          return
        }
        setQuote(data.quote)
        // A customer cancellation defaults to the policy refund; one the
        // team made (e.g. too few participants) defaults to a full refund.
        setOption(data.quote.cancelledBy === "admin" ? "full" : "policy")
        setCustomAmount(String(data.quote.policyRefund.toFixed(2)))
      })
      .catch(() => !cancelled && setError("Couldn't load the refund details."))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [bookingId])

  const amountFor = (choice: RefundOption) => {
    if (!quote) return 0
    if (choice === "policy") return quote.policyRefund
    if (choice === "full") return quote.fullRefund
    if (choice === "custom") return Number(customAmount) || 0
    return 0
  }

  const submit = async () => {
    if (!bookingId) return
    setSubmitting(true)
    setError(null)
    try {
      const response = await fetch(`/api/admin/bookings/${bookingId}/refund`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          option,
          amount: option === "custom" ? Number(customAmount) : undefined,
        }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        setError(data.error || "The refund failed. Please try again.")
        // A partial refund was still recorded — refresh the list.
        if (typeof data.refunded === "number") onDone({ refunded: data.refunded })
        return
      }
      onDone({ refunded: data.refunded || 0 })
    } catch {
      setError("The refund failed. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  const options: { value: RefundOption; label: string; detail: string }[] = quote
    ? [
        {
          value: "policy",
          label: `Policy refund — ${money(quote.policyRefund)}`,
          detail:
            `${money(quote.paidTowardTrip)} paid − ${quote.feePercent}% fee (${money(quote.fee)})` +
            (quote.cardFee > 0
              ? ` − ${CARD_REFUND_FEE_PERCENT}% card fee (${money(quote.cardFee)})`
              : ""),
        },
        {
          value: "full",
          label: `Full refund — ${money(quote.fullRefund)}`,
          detail:
            "Everything paid toward the trip, no fees. Use when the company cancels (e.g. too few participants).",
        },
        {
          value: "custom",
          label: "Other amount",
          detail: `Up to ${money(quote.maxRefundable)} (what Stripe can still refund).`,
        },
        {
          value: "none",
          label: "No refund — close",
          detail: "Mark the cancellation as handled without refunding anything.",
        },
      ]
    : []

  return (
    <Dialog open={!!bookingId} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Refund cancelled booking</DialogTitle>
          <DialogDescription>
            {customerName} — {tripTitle}
          </DialogDescription>
        </DialogHeader>

        {loading && <p className="text-sm text-muted-foreground">Loading payments from Stripe…</p>}

        {quote && (
          <div className="space-y-4 text-sm">
            <div className="rounded-md bg-muted/50 p-3 space-y-1">
              <div>
                Cancelled by{" "}
                <span className="font-medium">
                  {quote.cancelledBy === "customer" ? "the customer" : "the team"}
                </span>
                {quote.cancelledAt && <> on {new Date(quote.cancelledAt).toLocaleDateString()}</>}
              </div>
              <div>
                Schedule:{" "}
                <span className="font-medium">
                  {quote.schedule === "western_us" ? "Western US" : "Standard"}
                </span>{" "}
                · Fee {quote.feePercent}% of {money(quote.tripTotal)}
              </div>
              <div>
                Paid toward trip: <span className="font-medium">{money(quote.paidTowardTrip)}</span>{" "}
                · Paid by {quote.paidByCard ? "card" : "bank transfer"}
              </div>
            </div>

            <div className="space-y-2">
              {options.map((choice) => (
                <label
                  key={choice.value}
                  className={`flex cursor-pointer gap-3 rounded-md border p-3 ${
                    option === choice.value ? "border-primary bg-primary/5" : "border-border"
                  }`}
                >
                  <input
                    type="radio"
                    name="refund-option"
                    className="mt-1"
                    checked={option === choice.value}
                    onChange={() => setOption(choice.value)}
                  />
                  <span className="space-y-1">
                    <span className="block font-medium">{choice.label}</span>
                    <span className="block text-xs text-muted-foreground">{choice.detail}</span>
                    {choice.value === "custom" && option === "custom" && (
                      <span className="flex items-center gap-2 pt-1">
                        <Label htmlFor="refund-amount" className="text-xs">
                          Amount ($)
                        </Label>
                        <Input
                          id="refund-amount"
                          type="number"
                          min={0}
                          max={quote.maxRefundable}
                          step="0.01"
                          value={customAmount}
                          onChange={(e) => setCustomAmount(e.target.value)}
                          className="h-8 w-32"
                        />
                      </span>
                    )}
                  </span>
                </label>
              ))}
            </div>

            {quote.maxRefundable < quote.fullRefund && (
              <p className="text-xs text-amber-700">
                Stripe can only refund {money(quote.maxRefundable)} on this booking — some of it may
                already have been refunded in the Stripe dashboard.
              </p>
            )}
          </div>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Back
          </Button>
          <Button onClick={submit} disabled={!quote || submitting || loading}>
            {submitting
              ? "Working..."
              : option === "none"
                ? "Close without refund"
                : `Refund ${money(amountFor(option))}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
