"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DEFAULT_SINGLE_OCCUPANCY_SURCHARGE_PERCENT } from "@/lib/booking-price"

/**
 * The single-room surcharge for a trip: a percentage of the per-person price
 * added for every traveler (the booker and each guest) who picks a single
 * room. Used by the trip create and edit forms; stored on
 * trips.single_occupancy_surcharge (migration 061).
 */
export function SingleSurchargeField({
  value,
  onChange,
  basePrice,
}: {
  /** Kept as text so the admin can clear the box while typing. */
  value: string
  onChange: (value: string) => void
  /** The Premium per-person price, for the worked example. */
  basePrice?: number
}) {
  const percent = Number(value)
  const valid = value.trim() !== "" && Number.isFinite(percent) && percent >= 0 && percent <= 100
  const example = valid && basePrice && basePrice > 0 ? (basePrice * percent) / 100 : null

  return (
    <div className="space-y-3 rounded-lg border border-border p-4">
      <div>
        <Label htmlFor="single_occupancy_surcharge" className="text-base font-medium text-foreground">
          Single room surcharge
        </Label>
        <p className="text-sm text-muted-foreground">
          Added to the per-person price for each traveler — the booker and every
          guest — who chooses a single room. Use 0 for no surcharge. Default{" "}
          {DEFAULT_SINGLE_OCCUPANCY_SURCHARGE_PERCENT}%.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Input
          id="single_occupancy_surcharge"
          type="number"
          inputMode="decimal"
          min={0}
          max={100}
          step={0.5}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-28"
        />
        <span className="text-sm text-muted-foreground">% per person</span>
      </div>
      {!valid && (
        <p className="text-xs text-red-600">Enter a percentage from 0 to 100.</p>
      )}
      {example !== null && (
        <p className="text-xs text-muted-foreground">
          e.g. 2 travelers in single rooms on the ${basePrice!.toLocaleString()} package pay +$
          {example.toFixed(2)} each, +${(example * 2).toFixed(2)} in total.
        </p>
      )}
    </div>
  )
}

/** Whether the field's text is a storable percentage. */
export function isValidSurcharge(value: string): boolean {
  const n = Number(value)
  return value.trim() !== "" && Number.isFinite(n) && n >= 0 && n <= 100
}
