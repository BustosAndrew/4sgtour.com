"use client"

import { Label } from "@/components/ui/label"
import {
  CANCELLATION_SCHEDULES,
  CANCELLATION_SCHEDULE_LABELS,
  type CancellationSchedule,
} from "@/lib/cancellation-policy"

/**
 * Which fee schedule from Terms → Cancellation Policy applies to a trip.
 * Used by the trip and custom-package create/edit forms.
 */
export function CancellationScheduleField({
  value,
  onChange,
}: {
  value: CancellationSchedule
  onChange: (value: CancellationSchedule) => void
}) {
  return (
    <div className="space-y-3 rounded-lg border border-border p-4">
      <div>
        <Label className="text-base font-medium text-foreground">
          Cancellation schedule
        </Label>
        <p className="text-sm text-muted-foreground">
          The fee charged when a customer cancels, by days before departure (see Terms →
          Cancellation Policy). Customers see it when they cancel from My Bookings.
        </p>
      </div>
      <div className="space-y-2">
        {CANCELLATION_SCHEDULES.map((schedule) => (
          <label
            key={schedule}
            className={`flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2 text-sm ${
              value === schedule ? "border-primary bg-primary/5" : "border-border"
            }`}
          >
            <input
              type="radio"
              name="cancellation-schedule"
              checked={value === schedule}
              onChange={() => onChange(schedule)}
            />
            {CANCELLATION_SCHEDULE_LABELS[schedule]}
          </label>
        ))}
      </div>
    </div>
  )
}
