"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CreditCard, Loader2 } from "lucide-react"
import { isValidCardFee } from "@/components/admin/card-fee-field"
import { CANADIAN_CARD_FEE_CAP_PERCENT, MAX_CARD_FEE_PERCENT } from "@/lib/booking-price"

/**
 * Admin → Payments: the default credit card fee for new trips, optionally
 * applied to every existing trip at once (/api/admin/settings/card-fee).
 * Each trip's own fee is on its create / edit form.
 */
export function CardFeeSettings() {
  const [saved, setSaved] = useState<number | null>(null)
  const [tripsUsingOther, setTripsUsingOther] = useState<number | null>(null)
  const [value, setValue] = useState("")
  // On by default: saving sets every existing trip to the new fee too.
  const [applyToAll, setApplyToAll] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null)

  const load = async () => {
    const res = await fetch("/api/admin/settings/card-fee")
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    setSaved(data.percent)
    setValue(String(data.percent))
    setTripsUsingOther(data.tripsUsingOther)
  }

  useEffect(() => {
    load().catch(() =>
      setMessage({ tone: "error", text: "Could not load the card fee setting." }),
    )
  }, [])

  const save = async () => {
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch("/api/admin/settings/card-fee", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ percent: Number(value), applyToAllTrips: applyToAll }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Failed to save")
      setMessage({
        tone: "ok",
        text: applyToAll
          ? `Saved. ${data.tripsUpdated} trip${data.tripsUpdated === 1 ? "" : "s"} changed to ${data.percent}%.`
          : `Saved. New trips will start at ${data.percent}%.`,
      })
      setApplyToAll(true)
      await load()
    } catch (error: any) {
      setMessage({ tone: "error", text: error.message || "Failed to save" })
    } finally {
      setSaving(false)
    }
  }

  const valid = isValidCardFee(value)
  const changed = saved === null || Number(value) !== saved
  // Trips whose own fee a save would overwrite
  const overriding = applyToAll && (tripsUsingOther ?? 0) > 0

  return (
    <Card className="mb-6 p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-1">
          <h3 className="flex items-center gap-2 font-medium">
            <CreditCard className="h-4 w-4 text-muted-foreground" />
            Credit card fee
          </h3>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Default for new trips and custom packages. Each trip can set its own on its
            edit page. Debit and prepaid cards are never charged it, Canadian credit cards
            pay at most {CANADIAN_CARD_FEE_CAP_PERCENT}%, and bank transfers have no fee.
            Bookings already made keep the fee they were made with.
          </p>
          {tripsUsingOther !== null && saved !== null && tripsUsingOther > 0 && (
            <p className="text-xs text-muted-foreground">
              {tripsUsingOther} trip{tripsUsingOther === 1 ? " has" : "s have"} a different fee
              from {saved}%.
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <Label htmlFor="default-card-fee" className="sr-only">
              Default credit card fee
            </Label>
            <Input
              id="default-card-fee"
              type="number"
              inputMode="decimal"
              min={0}
              max={MAX_CARD_FEE_PERCENT}
              step={0.1}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-24"
              disabled={saved === null}
            />
            <span className="text-sm text-muted-foreground">%</span>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={applyToAll}
              onChange={(e) => setApplyToAll(e.target.checked)}
              className="h-4 w-4 rounded border-input accent-[#3D5A80]"
            />
            Also apply to all existing trips
          </label>
          <Button
            onClick={save}
            disabled={!valid || saving || saved === null || (!changed && !overriding)}
            size="sm"
          >
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save
          </Button>
        </div>
      </div>
      {value.trim() !== "" && !valid && (
        <p className="mt-2 text-xs text-red-600">
          Enter a percentage from 0 to {MAX_CARD_FEE_PERCENT}.
        </p>
      )}
      {valid && overriding && (
        <p className="mt-2 text-xs text-amber-700">
          Saving will also change the {tripsUsingOther} trip
          {tripsUsingOther === 1 ? " that has its" : "s that have their"} own fee. Untick
          the box to change only the default for new trips.
        </p>
      )}
      {valid && Number(value) > 3 && (
        <p className="mt-2 text-xs text-amber-700">
          Visa caps credit card surcharges at 3% in the US.
        </p>
      )}
      {message && (
        <p
          className={`mt-2 text-sm ${message.tone === "ok" ? "text-emerald-700" : "text-red-600"}`}
        >
          {message.text}
        </p>
      )}
    </Card>
  )
}
