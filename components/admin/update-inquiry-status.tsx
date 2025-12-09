"use client"

import { useState } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface UpdateInquiryStatusProps {
  inquiryId: string
  currentStatus: string
  onStatusChange?: (newStatus: string) => void
}

const STATUS_OPTIONS = [
  {
    value: "pending",
    label: "Pending",
    color: "bg-yellow-100 text-yellow-800",
  },
  {
    value: "contacted",
    label: "Contacted",
    color: "bg-blue-100 text-blue-800",
  },
  {
    value: "converted",
    label: "Converted",
    color: "bg-[#6096BA]/20 text-[#274C77]",
  },
  { value: "cancelled", label: "Cancelled", color: "bg-red-100 text-red-800" },
]

export function UpdateInquiryStatus({
  inquiryId,
  currentStatus,
  onStatusChange,
}: UpdateInquiryStatusProps) {
  const [status, setStatus] = useState(currentStatus)
  const [isUpdating, setIsUpdating] = useState(false)

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === status) return

    setIsUpdating(true)
    try {
      const response = await fetch(`/api/admin/inquiries/${inquiryId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        throw new Error("Failed to update status")
      }

      setStatus(newStatus)
      onStatusChange?.(newStatus)
    } catch (error) {
      console.error("Error updating inquiry status:", error)
      alert("Failed to update status. Please try again.")
    } finally {
      setIsUpdating(false)
    }
  }

  const currentOption = STATUS_OPTIONS.find((opt) => opt.value === status)

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground sm:text-sm">Status:</span>
      <Select
        value={status}
        onValueChange={handleStatusChange}
        disabled={isUpdating}
      >
        <SelectTrigger
          className={`h-8 w-[140px] text-xs sm:text-sm ${
            currentOption?.color || ""
          }`}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {STATUS_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              <span
                className={`inline-block rounded px-2 py-0.5 text-xs ${option.color}`}
              >
                {option.label}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
