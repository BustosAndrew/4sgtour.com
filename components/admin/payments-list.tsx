"use client"

import { useEffect, useMemo, useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
import { AlertTriangle, CalendarClock, Mail, RefreshCw, Search, XCircle } from "lucide-react"
import { parseCalendarDate } from "@/lib/calendar-date"
import { todayUtc, type AdminPayment, type PaymentStage } from "@/lib/admin-payments"

type Filter = "pending" | "balance_due" | "clearing" | "paid" | "all"

const FILTERS: { value: Filter; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "balance_due", label: "Balance due" },
  { value: "clearing", label: "Clearing" },
  { value: "paid", label: "Paid in full" },
  { value: "all", label: "All" },
]

function inFilter(stage: PaymentStage, filter: Filter) {
  switch (filter) {
    case "pending":
      return stage === "awaiting_payment" || stage === "stale" || stage === "unrecorded_payment"
    case "balance_due":
      return stage === "balance_due"
    case "clearing":
      return stage === "clearing" || stage === "balance_clearing"
    case "paid":
      return stage === "paid_in_full"
    default:
      return true
  }
}

const STAGE_BADGE: Record<PaymentStage, { label: string; className: string }> = {
  unrecorded_payment: {
    label: "Paid in Stripe — not recorded",
    className: "bg-red-500/10 text-red-700 border-red-500/20",
  },
  awaiting_payment: {
    label: "Awaiting payment",
    className: "bg-yellow-500/10 text-yellow-700 border-yellow-500/20",
  },
  stale: {
    label: "Lapsed — closed at the next daily cleanup",
    className: "bg-gray-500/10 text-gray-700 border-gray-500/20",
  },
  clearing: {
    label: "Bank payment clearing",
    className: "bg-amber-500/10 text-amber-700 border-amber-500/20",
  },
  balance_clearing: {
    label: "Balance clearing",
    className: "bg-amber-500/10 text-amber-700 border-amber-500/20",
  },
  balance_due: {
    label: "Balance due",
    className: "bg-blue-500/10 text-blue-700 border-blue-500/20",
  },
  paid_in_full: {
    label: "Paid in full",
    className: "bg-green-500/10 text-green-700 border-green-500/20",
  },
}

function money(amount: number) {
  return `$${Number(amount || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

function formatDate(value: string | null) {
  if (!value) return null
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value) ? parseCalendarDate(value) : new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
}

function methodLabel(payment: AdminPayment) {
  if (payment.isSmsLink && payment.paymentMethod === "sms_link") return "SMS link (method not chosen yet)"
  switch (payment.paymentMethod) {
    case "card":
      return "Card"
    case "us_bank_account":
    case "ach":
      return "Bank transfer (ACH)"
    case "sms_link":
      return "Payment link"
    default:
      return payment.paymentMethod || "—"
  }
}

/** How the remaining balance will be collected, in a sentence. */
function scheduleText(payment: AdminPayment) {
  if (payment.stage !== "balance_due") return null
  if (payment.autoChargeDate && payment.hasSavedPaymentMethod) {
    return `Charged automatically on ${formatDate(payment.autoChargeDate)} to the saved payment method`
  }
  if (payment.hasSavedPaymentMethod) {
    return payment.chargeAttempts > 0
      ? "Automatic charging stopped after declined attempts — set a new date to try again"
      : payment.dueDate
        ? `Not charged automatically — due ${formatDate(payment.dueDate)}`
        : "Not charged automatically, and no due date set"
  }
  return payment.dueDate
    ? `Due ${formatDate(payment.dueDate)} — the customer pays it (no saved card)`
    : "No saved card and no due date — set one so the customer is reminded"
}

export function PaymentsList() {
  const [payments, setPayments] = useState<AdminPayment[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [filter, setFilter] = useState<Filter>("pending")
  const [query, setQuery] = useState("")

  const [cancelTarget, setCancelTarget] = useState<AdminPayment | null>(null)
  const [scheduleTarget, setScheduleTarget] = useState<AdminPayment | null>(null)

  const load = async () => {
    // (also called after a refused cancel, which may have flagged a row)
    setLoading(true)
    setLoadError(null)
    try {
      const response = await fetch("/api/admin/payments", { cache: "no-store" })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || "Failed to load payments")
      setPayments(data.payments || [])
    } catch (error: any) {
      console.error("[admin-payments] Load failed:", error)
      setLoadError(error?.message || "Failed to load payments")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const totals = useMemo(() => {
    let pendingCount = 0
    let pendingAmount = 0
    let clearing = 0
    let dueCount = 0
    let due = 0
    let received = 0
    for (const p of payments) {
      if (p.stage === "awaiting_payment") {
        pendingCount++
        pendingAmount += p.amountDueNow
      }
      clearing += p.clearingAmount
      if (p.stage === "balance_due") {
        dueCount++
        due += p.remaining
      }
      received += p.totalReceived
    }
    return { pendingCount, pendingAmount, clearing, dueCount, due, received }
  }, [payments])

  const counts = useMemo(() => {
    const result = {} as Record<Filter, number>
    for (const f of FILTERS) result[f.value] = payments.filter((p) => inFilter(p.stage, f.value)).length
    return result
  }, [payments])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return payments.filter((p) => {
      if (!inFilter(p.stage, filter)) return false
      if (!q) return true
      return [p.customerName, p.customerEmail, p.customerPhone || "", p.tripTitle, p.packageName || ""]
        .join(" ")
        .toLowerCase()
        .includes(q)
    })
  }, [payments, filter, query])

  const replace = (updated: AdminPayment) =>
    setPayments((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))

  if (loading && payments.length === 0) {
    return <div className="py-8 text-center">Loading payments...</div>
  }

  return (
    <>
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <SummaryTile
          label="Awaiting payment"
          value={money(totals.pendingAmount)}
          hint={`${totals.pendingCount} open checkout${totals.pendingCount === 1 ? "" : "s"} or link${totals.pendingCount === 1 ? "" : "s"}`}
        />
        <SummaryTile label="Clearing (bank)" value={money(totals.clearing)} hint="Submitted, not settled" />
        <SummaryTile
          label="Balances still owed"
          value={money(totals.due)}
          hint={`${totals.dueCount} booking${totals.dueCount === 1 ? "" : "s"}`}
        />
        <SummaryTile label="Received" value={money(totals.received)} hint="Incl. card fees, active bookings" />
      </div>

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap rounded-lg border border-input bg-background p-1">
          {FILTERS.map((option) => (
            <button
              key={option.value}
              onClick={() => setFilter(option.value)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                filter === option.value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {option.label} ({counts[option.value]})
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative flex-1 lg:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, email, trip"
              className="pl-9"
            />
          </div>
          <Button variant="outline" size="icon" onClick={load} disabled={loading} title="Refresh">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {loadError && (
        <Card className="mb-4 border-red-500/30 bg-red-500/5 p-4 text-sm text-red-700">{loadError}</Card>
      )}

      <div className="space-y-4">
        {visible.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">
            {query ? "Nothing matches your search." : "Nothing here right now."}
          </Card>
        ) : (
          visible.map((payment) => (
            <PaymentCard
              key={payment.id}
              payment={payment}
              onCancel={() => setCancelTarget(payment)}
              onSchedule={() => setScheduleTarget(payment)}
            />
          ))
        )}
      </div>

      <CancelPendingDialog
        payment={cancelTarget}
        onClose={() => setCancelTarget(null)}
        onFlagged={() => {
          setCancelTarget(null)
          load()
        }}
        onDone={(id) => {
          setPayments((prev) => prev.filter((p) => p.id !== id))
          setCancelTarget(null)
        }}
      />

      <ScheduleDialog
        payment={scheduleTarget}
        onClose={() => setScheduleTarget(null)}
        onDone={(updated) => {
          replace(updated)
          setScheduleTarget(null)
        }}
      />
    </>
  )
}

function SummaryTile({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <Card className="p-4">
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 text-xl font-semibold tabular-nums sm:text-2xl">{value}</div>
      <div className="mt-0.5 text-xs text-muted-foreground">{hint}</div>
    </Card>
  )
}

function PaymentCard({
  payment,
  onCancel,
  onSchedule,
}: {
  payment: AdminPayment
  onCancel: () => void
  onSchedule: () => void
}) {
  const badge = STAGE_BADGE[payment.stage]
  const unrecorded = payment.stage === "unrecorded_payment"
  const pending = payment.stage === "awaiting_payment" || payment.stage === "stale"
  const schedule = scheduleText(payment)
  const paidPercent =
    payment.tripTotal > 0 ? Math.min(100, Math.round((payment.paidTowardTrip / payment.tripTotal) * 100)) : 0
  const clearingPercent =
    payment.tripTotal > 0
      ? Math.min(100 - paidPercent, Math.round((payment.clearingAmount / payment.tripTotal) * 100))
      : 0

  return (
    <Card className="p-4 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold">{payment.tripTitle}</h3>
            <Badge className={badge.className}>{badge.label}</Badge>
            {payment.inquiryId && (
              <Badge variant="outline" className="border-purple-200 bg-purple-50 text-xs text-purple-700">
                Custom Package
              </Badge>
            )}
            {payment.isSmsLink && (
              <Badge variant="outline" className="text-xs">
                SMS link
              </Badge>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-2 text-sm">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{payment.customerName}</span>
            <span className="text-muted-foreground">({payment.customerEmail})</span>
            {payment.customerPhone && <span className="text-muted-foreground">· {payment.customerPhone}</span>}
          </div>
          <div className="text-sm text-muted-foreground">
            {payment.packageName && <span>{payment.packageName} · </span>}
            {payment.startDate && (
              <span>
                Departs {formatDate(payment.startDate)}
                {payment.endDate ? ` – ${formatDate(payment.endDate)}` : ""} ·{" "}
              </span>
            )}
            <span>{methodLabel(payment)}</span>
            <span> · Started {formatDate(payment.createdAt)}</span>
          </div>

          {pending && (
            <div className="text-sm">
              Would charge <span className="font-semibold">{money(payment.amountDueNow)}</span> now
              {payment.depositPercentage && payment.depositPercentage < 100
                ? ` (${payment.depositPercentage}% deposit)`
                : " (full payment)"}{" "}
              — nothing has been paid yet.
            </div>
          )}

          {unrecorded && (
            <div className="flex items-start gap-2 rounded border border-red-500/20 bg-red-500/5 p-2 text-sm text-red-700">
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>
                Stripe says this checkout ({money(payment.amountDueNow)}) was completed, but the booking
                was never confirmed here, so it isn&apos;t in Inquiries or the customer&apos;s My Bookings.
                Look it up in Stripe (Payments, search {payment.customerEmail}) and check the webhook
                endpoint&apos;s delivery log.
              </span>
            </div>
          )}

          {schedule && (
            <div className="flex items-start gap-2 text-sm">
              <CalendarClock className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
              <span>{schedule}</span>
            </div>
          )}

          {payment.lastChargeError && payment.stage === "balance_due" && (
            <div className="flex items-start gap-2 rounded border border-red-500/20 bg-red-500/5 p-2 text-sm text-red-700">
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>
                Last charge failed{payment.chargeAttempts > 0 ? ` (attempt ${payment.chargeAttempts} of 3)` : ""}:{" "}
                {payment.lastChargeError}
              </span>
            </div>
          )}
        </div>

        <div className="w-full space-y-3 lg:w-80">
          <dl className="grid grid-cols-3 gap-2 text-center text-sm lg:text-right">
            <div>
              <dt className="text-xs text-muted-foreground">Trip total</dt>
              <dd className="font-semibold tabular-nums">{money(payment.tripTotal)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Paid so far</dt>
              <dd className="font-semibold tabular-nums text-green-700">{money(payment.paidTowardTrip)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Remaining</dt>
              <dd
                className={`font-semibold tabular-nums ${payment.remaining > 0 ? "text-blue-700" : "text-muted-foreground"}`}
              >
                {money(payment.remaining)}
              </dd>
            </div>
          </dl>
          <div className="flex h-2 overflow-hidden rounded-full bg-muted" aria-hidden>
            <div className="bg-green-600" style={{ width: `${paidPercent}%` }} />
            <div className="bg-amber-400" style={{ width: `${clearingPercent}%` }} />
          </div>
          <div className="space-y-0.5 text-xs text-muted-foreground lg:text-right">
            {payment.clearingAmount > 0 && <div>{money(payment.clearingAmount)} clearing by bank</div>}
            {payment.cardFeesPaid > 0 && (
              <div>
                + {money(payment.cardFeesPaid)} card fees · {money(payment.totalReceived)} received in all
              </div>
            )}
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            {payment.stage === "balance_due" && (
              <Button variant="outline" size="sm" onClick={onSchedule}>
                <CalendarClock className="mr-2 h-4 w-4" />
                Change charge date
              </Button>
            )}
            {pending && (
              <Button
                variant="outline"
                size="sm"
                onClick={onCancel}
                className="text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                <XCircle className="mr-2 h-4 w-4" />
                Cancel payment
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}

function CancelPendingDialog({
  payment,
  onClose,
  onDone,
  onFlagged,
}: {
  payment: AdminPayment | null
  onClose: () => void
  onDone: (id: string) => void
  /** Stripe says it was paid; the row was flagged — reload the list */
  onFlagged: () => void
}) {
  const [working, setWorking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setError(null)
    setWorking(false)
  }, [payment?.id])

  const confirm = async () => {
    if (!payment) return
    setWorking(true)
    setError(null)
    try {
      const response = await fetch(`/api/admin/bookings/${payment.id}/cancel-pending`, { method: "POST" })
      const data = await response.json().catch(() => ({}))
      if (data.unrecorded) {
        onFlagged()
        return
      }
      if (!response.ok) throw new Error(data.error || "Could not cancel this payment.")
      onDone(payment.id)
    } catch (e: any) {
      setError(e?.message || "Could not cancel this payment.")
    } finally {
      setWorking(false)
    }
  }

  return (
    <Dialog open={!!payment} onOpenChange={(open) => !open && !working && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancel pending payment</DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-2">
              <p>
                <span className="font-medium">{payment?.customerName}</span> —{" "}
                <span className="font-medium">{payment?.tripTitle}</span>,{" "}
                {payment ? money(payment.amountDueNow) : ""}
              </p>
              <p>
                {payment?.isSmsLink
                  ? "The texted payment link stops working at once."
                  : "The customer's open checkout page is closed, so it can no longer be paid."}{" "}
                Nothing has been charged, so nothing needs refunding. The customer is not notified.
              </p>
              {error && <p className="text-red-600">{error}</p>}
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={working}>
            Back
          </Button>
          <Button variant="destructive" onClick={confirm} disabled={working}>
            {working ? "Cancelling..." : "Cancel payment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ScheduleDialog({
  payment,
  onClose,
  onDone,
}: {
  payment: AdminPayment | null
  onClose: () => void
  onDone: (payment: AdminPayment) => void
}) {
  const [mode, setMode] = useState<"auto" | "stop">("auto")
  const [date, setDate] = useState("")
  const [working, setWorking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const today = todayUtc()

  useEffect(() => {
    if (!payment) return
    setError(null)
    setWorking(false)
    setMode("auto")
    const current = payment.hasSavedPaymentMethod ? payment.autoChargeDate || payment.dueDate : payment.dueDate
    setDate(current && current >= today ? current : "")
  }, [payment?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const canAuto = !!payment?.hasSavedPaymentMethod
  const afterDeparture = !!(date && payment?.startDate && date > payment.startDate.slice(0, 10))

  const save = async () => {
    if (!payment) return
    const sendDate = canAuto && mode === "stop" ? null : date
    if (sendDate !== null && !sendDate) {
      setError("Choose a date.")
      return
    }
    setWorking(true)
    setError(null)
    try {
      const response = await fetch(`/api/admin/bookings/${payment.id}/schedule`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: sendDate }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || "Could not save the date.")
      onDone(data.payment)
    } catch (e: any) {
      setError(e?.message || "Could not save the date.")
    } finally {
      setWorking(false)
    }
  }

  return (
    <Dialog open={!!payment} onOpenChange={(open) => !open && !working && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{canAuto ? "When to charge the balance" : "Balance due date"}</DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-1">
              <p>
                <span className="font-medium">{payment?.customerName}</span> — {payment?.tripTitle}
              </p>
              <p>
                Remaining balance <span className="font-medium">{payment ? money(payment.remaining) : ""}</span>
                {payment?.startDate ? `, departs ${formatDate(payment.startDate)}` : ""}.
              </p>
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {canAuto && (
            <div className="space-y-2">
              <label
                className={`flex cursor-pointer items-start gap-3 rounded-md border px-3 py-2 text-sm ${
                  mode === "auto" ? "border-primary bg-primary/5" : "border-border"
                }`}
              >
                <input
                  type="radio"
                  name="charge-mode"
                  className="mt-1"
                  checked={mode === "auto"}
                  onChange={() => setMode("auto")}
                />
                <span>
                  <span className="font-medium">Charge the saved payment method automatically</span>
                  <span className="block text-muted-foreground">
                    Billed on the morning of the chosen date (08:00 UTC), with the 4% fee if it is a card.
                  </span>
                </span>
              </label>
              <label
                className={`flex cursor-pointer items-start gap-3 rounded-md border px-3 py-2 text-sm ${
                  mode === "stop" ? "border-primary bg-primary/5" : "border-border"
                }`}
              >
                <input
                  type="radio"
                  name="charge-mode"
                  className="mt-1"
                  checked={mode === "stop"}
                  onChange={() => setMode("stop")}
                />
                <span>
                  <span className="font-medium">Don&apos;t charge automatically</span>
                  <span className="block text-muted-foreground">
                    The balance stays owed; collect it another way.
                    {payment?.inquiryId ? " The package page shows a Pay remaining balance button." : ""}
                  </span>
                </span>
              </label>
            </div>
          )}

          {(!canAuto || mode === "auto") && (
            <div className="space-y-2">
              <Label htmlFor="charge-date">{canAuto ? "Charge on" : "Due on"}</Label>
              <Input
                id="charge-date"
                type="date"
                min={today}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-48"
              />
              <p className="text-xs text-muted-foreground">
                {canAuto
                  ? "Choosing today charges it on the next daily run. A new date also restarts the 3 retry attempts."
                  : "No card was saved, so this isn't charged automatically. The customer is texted a reminder 5 days before."}
              </p>
              {afterDeparture && (
                <p className="text-xs text-amber-700">This date is after the trip departs.</p>
              )}
            </div>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={working}>
            Back
          </Button>
          <Button onClick={save} disabled={working} className="bg-[#274C77] text-white hover:bg-[#274C77]/90">
            {working ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
