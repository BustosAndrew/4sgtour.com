"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Calendar } from "@/components/ui/calendar"
import { Users, User, Minus, Plus } from 'lucide-react'

interface BookingFormProps {
  trip: any
}

const DEFAULT_ROOM_TYPES = [
  { id: "double", name: "Double Occupancy", icon: Users, description: "Shared room for two guests", price: 0 },
  { id: "single", name: "Single Occupancy", icon: User, description: "Private room for one guest", price: 0 },
]

export function BookingForm({ trip }: BookingFormProps) {
  const packages = trip.packages && trip.packages.length > 0 
    ? trip.packages.map((pkg: any) => ({
        id: pkg.id,
        name: pkg.name,
        description: pkg.description || '',
        price: Number(pkg.price) || 0,
        icon: pkg.name.toLowerCase().includes('double') ? Users : User
      }))
    : DEFAULT_ROOM_TYPES

  const addOns = trip.add_ons || []

  // Form state
  const [customerName, setCustomerName] = useState("")
  const [customerEmail, setCustomerEmail] = useState("")
  const [selectedPackage, setSelectedPackage] = useState<string>("")
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  })
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([])
  const [rounds, setRounds] = useState(2)
  const [additionalRequests, setAdditionalRequests] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const calculateTotal = () => {
    let total = 0

    // Package price
    const selectedPkg = packages.find((p: any) => p.id === selectedPackage)
    if (selectedPkg) total += selectedPkg.price

    // Add-ons prices
    selectedAddOns.forEach((addOnId) => {
      const addOn = addOns.find((a: any) => a.id === addOnId)
      if (addOn) total += Number(addOn.price) || 0
    })

    // Rounds price (example: $20 per round)
    total += rounds * 20

    return total
  }

  const handleSubmit = async () => {
    if (!dateRange.from || !dateRange.to) {
      alert("Please select travel dates")
      return
    }

    if (!selectedPackage) {
      alert("Please select a package")
      return
    }

    if (!customerName || !customerEmail) {
      alert("Please provide your name and email")
      return
    }

    setSubmitting(true)

    try {
      const total = calculateTotal()

      // Format dates
      const startDate = dateRange.from.toISOString().split("T")[0]
      const endDate = dateRange.to.toISOString().split("T")[0]

      // Get selected option names for email
      const packageName = packages.find((p: any) => p.id === selectedPackage)?.name || ""
      const addOnNames = selectedAddOns.map((id) => addOns.find((a: any) => a.id === id)?.name).filter(Boolean)

      // Send inquiry email
      const response = await fetch("/api/inquiry", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tripTitle: trip.title,
          customerName,
          customerEmail,
          packageName,
          startDate,
          endDate,
          addOns: addOnNames,
          rounds,
          additionalRequests,
          totalPrice: total,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to send inquiry")
      }

      alert("Your inquiry has been submitted! We'll contact you shortly.")
      
      // Reset form
      setCustomerName("")
      setCustomerEmail("")
      setSelectedPackage("")
      setDateRange({ from: undefined, to: undefined })
      setSelectedAddOns([])
      setRounds(2)
      setAdditionalRequests("")
    } catch (error) {
      console.error("Error submitting inquiry:", error)
      alert("Failed to submit inquiry. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
      <div className="space-y-6">
        {/* Contact Information */}
        <Card className="bg-[#E8DCC4] p-6">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-[#C9B896] text-sm font-bold">1</div>
            <h2 className="text-lg font-bold">Your Information</h2>
          </div>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="John Doe"
                required
              />
            </div>
            <div>
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="john@example.com"
                required
              />
            </div>
          </div>
        </Card>

        {/* Step 2: Select Package */}
        <Card className="bg-[#E8DCC4] p-6">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-[#C9B896] text-sm font-bold">2</div>
            <h2 className="text-lg font-bold">Select Package</h2>
          </div>
          <RadioGroup value={selectedPackage} onValueChange={setSelectedPackage} className="space-y-3">
            {packages.map((pkg: any) => {
              const Icon = pkg.icon
              return (
                <Card key={pkg.id} className="relative cursor-pointer p-4 transition-colors hover:bg-accent">
                  <RadioGroupItem value={pkg.id} id={pkg.id} className="absolute right-4 top-4" />
                  <label htmlFor={pkg.id} className="flex cursor-pointer items-start gap-3">
                    <Icon className="mt-1 h-5 w-5" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="font-bold">{pkg.name}</div>
                        <div className="font-bold">${pkg.price}</div>
                      </div>
                      <div className="text-sm text-muted-foreground">{pkg.description}</div>
                    </div>
                  </label>
                </Card>
              )
            })}
          </RadioGroup>
        </Card>

        {/* Step 3: Travel Duration */}
        <Card className="bg-[#E8DCC4] p-6">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-[#C9B896] text-sm font-bold">3</div>
            <h2 className="text-lg font-bold">Travel Duration</h2>
          </div>
          <div className="space-y-4">
            <div>
              <h3 className="mb-2 font-medium">Select Dates</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                Choose your preferred travel dates for this golf trip
              </p>
              <div className="overflow-x-auto">
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={(range: any) => setDateRange(range || { from: undefined, to: undefined })}
                  className="rounded-md border"
                />
              </div>
            </div>
          </div>
        </Card>

        {addOns.length > 0 && (
          <Card className="bg-[#E8DCC4] p-6">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-[#C9B896] text-sm font-bold">4</div>
              <h2 className="text-lg font-bold">Select Add-ons</h2>
            </div>
            <div className="space-y-2">
              {addOns.map((addOn: any) => (
                <Card
                  key={addOn.id}
                  className={`cursor-pointer p-4 transition-colors hover:bg-accent ${
                    selectedAddOns.includes(addOn.id) ? "border-primary" : ""
                  }`}
                  onClick={() => {
                    setSelectedAddOns((prev) =>
                      prev.includes(addOn.id) ? prev.filter((id) => id !== addOn.id) : [...prev, addOn.id],
                    )
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-bold">{addOn.name}</div>
                      {addOn.description && (
                        <div className="text-sm text-muted-foreground">{addOn.description}</div>
                      )}
                      <div className="mt-1 text-xs text-muted-foreground">
                        {addOn.price_type === 'per_participant' ? 'Per participant' : 'Per booking'}
                      </div>
                    </div>
                    <div className="font-bold">${addOn.price}</div>
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        )}

        {/* Step: Rounds */}
        <Card className="bg-[#E8DCC4] p-6">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-[#C9B896] text-sm font-bold">
              {addOns.length > 0 ? '5' : '4'}
            </div>
            <h2 className="text-lg font-bold">Golf Rounds</h2>
          </div>
          <div>
            <h3 className="mb-2 font-medium">Select Rounds</h3>
            <p className="mb-4 text-sm text-muted-foreground">How many rounds would you like to play?</p>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setRounds(Math.max(1, rounds - 1))}
                disabled={rounds <= 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Number of Rounds:</div>
                <div className="text-2xl font-bold">{rounds}</div>
              </div>
              <Button variant="outline" size="icon" onClick={() => setRounds(rounds + 1)}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>

        {/* Step: Additional Requests */}
        <Card className="bg-[#E8DCC4] p-6">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-[#C9B896] text-sm font-bold">
              {addOns.length > 0 ? '6' : '5'}
            </div>
            <h2 className="text-lg font-bold">Additional Requests</h2>
          </div>
          <Textarea
            placeholder="Any special requests or dietary requirements..."
            value={additionalRequests}
            onChange={(e) => setAdditionalRequests(e.target.value)}
            className="min-h-[100px]"
          />
        </Card>
      </div>

      {/* Confirmation Panel */}
      <div className="lg:sticky lg:top-8 lg:self-start">
        <Card className="bg-[#F8F8F8] p-6">
          <h2 className="mb-4 text-lg font-bold">Confirmation</h2>
          <div className="space-y-2 text-sm">
            {dateRange.from && dateRange.to && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Reservation for:</span>
                <span>
                  {dateRange.from.toLocaleDateString()} - {dateRange.to.toLocaleDateString()}
                </span>
              </div>
            )}
            {selectedPackage && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">{packages.find((p: any) => p.id === selectedPackage)?.name}</span>
                <span>${packages.find((p: any) => p.id === selectedPackage)?.price}</span>
              </div>
            )}
            {selectedAddOns.map((addOnId) => {
              const addOn = addOns.find((a: any) => a.id === addOnId)
              return (
                addOn && (
                  <div key={addOnId} className="flex justify-between">
                    <span className="text-muted-foreground">{addOn.name}</span>
                    <span>${addOn.price}</span>
                  </div>
                )
              )
            })}
            {rounds > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">{rounds} Rounds</span>
                <span>${rounds * 20}</span>
              </div>
            )}
          </div>

          <div className="my-4 border-t border-border pt-4">
            <div className="flex justify-between text-lg font-bold">
              <span>Total:</span>
              <span>${calculateTotal()}</span>
            </div>
          </div>

          <Button
            className="w-full bg-[#9CA986] hover:bg-[#8a9876]"
            size="lg"
            onClick={handleSubmit}
            disabled={submitting || !dateRange.from || !dateRange.to || !selectedPackage || !customerName || !customerEmail}
          >
            {submitting ? "Submitting..." : "Inquire Now"}
          </Button>
        </Card>

        {/* Trip Images */}
        {trip.images && trip.images.length > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-2">
            {trip.images.slice(0, 4).map((img: any, idx: number) => (
              <div key={idx} className="aspect-square overflow-hidden rounded-lg bg-muted">
                <img src={img.image_url || "/placeholder.svg"} alt={trip.title} className="h-full w-full object-cover" />
              </div>
            ))}
          </div>
        )}

        <Card className="mt-4 bg-muted/50 p-4">
          <h3 className="font-bold">{trip.title}</h3>
          <p className="mt-2 text-sm text-muted-foreground">Location: {trip.location}</p>
        </Card>
      </div>
    </div>
  )
}
