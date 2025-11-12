"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

interface AssignContinentFormProps {
  tripId: string
  currentContinent: string | null
}

const CONTINENTS = ["Africa", "Asia", "Europe", "North America", "South America"]

export function AssignContinentForm({ tripId, currentContinent }: AssignContinentFormProps) {
  const [selectedContinent, setSelectedContinent] = useState(currentContinent || "")
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage("")

    try {
      const response = await fetch(`/api/admin/trips/${tripId}/continent`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ continent: selectedContinent }),
      })

      if (response.ok) {
        setMessage("Continent assigned successfully!")
        router.refresh()
      } else {
        setMessage("Failed to assign continent")
      }
    } catch (error) {
      setMessage("An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        {CONTINENTS.map((continent) => (
          <label key={continent} className="flex items-center gap-2">
            <input
              type="radio"
              name="continent"
              value={continent}
              checked={selectedContinent === continent}
              onChange={(e) => setSelectedContinent(e.target.value)}
              className="h-4 w-4"
            />
            <span>{continent}</span>
          </label>
        ))}
      </div>

      {message && (
        <p className={`text-sm ${message.includes("success") ? "text-primary" : "text-destructive"}`}>{message}</p>
      )}

      <Button type="submit" disabled={isLoading || !selectedContinent} className="w-full">
        {isLoading ? "Saving..." : "Assign Continent"}
      </Button>
    </form>
  )
}
