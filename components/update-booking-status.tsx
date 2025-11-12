"use client"

import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useState } from "react"

interface UpdateBookingStatusProps {
  bookingId: string
  currentStatus: string
}

export function UpdateBookingStatus({ bookingId, currentStatus }: UpdateBookingStatusProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleStatusUpdate = async (newStatus: "pending" | "confirmed" | "cancelled") => {
    setIsLoading(true)

    try {
      const supabase = createClient()
      const { error } = await supabase.from("bookings").update({ status: newStatus }).eq("id", bookingId)

      if (error) throw error

      router.refresh()
    } catch (error) {
      console.error("Error updating booking status:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <div className="mb-4">
        <span
          className={`inline-block rounded-full px-3 py-1 text-sm font-medium ${
            currentStatus === "confirmed"
              ? "bg-primary/10 text-primary"
              : currentStatus === "cancelled"
                ? "bg-destructive/10 text-destructive"
                : "bg-muted text-muted-foreground"
          }`}
        >
          {currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)}
        </span>
      </div>

      <Button
        onClick={() => handleStatusUpdate("confirmed")}
        disabled={isLoading || currentStatus === "confirmed"}
        className="w-full"
        variant={currentStatus === "confirmed" ? "secondary" : "default"}
      >
        Confirm Booking
      </Button>

      <Button
        onClick={() => handleStatusUpdate("pending")}
        disabled={isLoading || currentStatus === "pending"}
        className="w-full"
        variant="outline"
      >
        Set to Pending
      </Button>

      <Button
        onClick={() => handleStatusUpdate("cancelled")}
        disabled={isLoading || currentStatus === "cancelled"}
        className="w-full"
        variant="destructive"
      >
        Cancel Booking
      </Button>
    </div>
  )
}
