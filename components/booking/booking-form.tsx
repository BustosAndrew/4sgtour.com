"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Calendar } from "@/components/ui/calendar"
import { Users, User, Minus, Plus, Check } from 'lucide-react'

interface BookingFormProps {
  trip: any
  user: any
  profile: any
}

const DEFAULT_ROOM_TYPES = [
  { id: "double", name: "Double Occupancy", icon: Users, description: "Shared room for two guests", price: 0 },
  { id: "single", name: "Single Occupancy", icon: User, description: "Private room for one guest", price: 0 },
]

export function BookingForm({ trip, user, profile }: BookingFormProps) {
  const packages = trip.packages && trip.packages.length > 0 
    ? trip.packages.map((pkg: any) => ({
        id: pkg.id,
        name: pkg.name,
        description: pkg.description || '',
        price: Number(pkg.price) || 0,
        icon: pkg.name.toLowerCase().includes('double') ? Users : User
      }))
    : DEFAULT_ROOM_TYPES

  const golfCourses = trip.golf_courses || []
  const mealOptions = trip.meal_options || {
    breakfast_included_price: 0,
    breakfast_not_included_price: 0
  }
  const transportationOptions = trip.transportation_options || {
    private_car_price: 0,
    self_drive_price: 0
  }

  // Form state
  const [selectedPackage, setSelectedPackage] = useState<string>("")
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  })
  const [selectedCourses, setSelectedCourses] = useState<string[]>([])
  const [rounds, setRounds] = useState(2)
  const [selectedMeal, setSelectedMeal] = useState<"included" | "not_included">("included")
  const [selectedTransport, setSelectedTransport] = useState<"private" | "self">("private")
  const [additionalRequests, setAdditionalRequests] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const calculateTotal = () => {
    let total = 0

    // Package price
    const selectedPkg = packages.find((p: any) => p.id === selectedPackage)
    if (selectedPkg) total += selectedPkg.price

    // Golf courses and rounds
    selectedCourses.forEach((courseId) => {
      const course = golfCourses.find((c: any) => c.id === courseId)
      if (course) total += Number(course.price_per_round) * rounds
    })

    // Meals
    if (selectedMeal === "included") {
      total += Number(mealOptions.breakfast_included_price)
    } else {
      total += Number(mealOptions.breakfast_not_included_price)
    }

    // Transportation
    if (selectedTransport === "private") {
      total += Number(transportationOptions.private_car_price)
    } else {
      total += Number(transportationOptions.self_drive_price)
    }

    return total
  }

  const handleSubmit = async () => {
    if (!user) {
      alert("Please sign in to submit an inquiry")
      window.location.href = `/auth/login?redirect=/trips/${trip.slug}/book`
      return
    }

    if (!dateRange.from || !dateRange.to) {
      alert("Please select travel dates")
      return
    }

    if (!selectedPackage) {
      alert("Please select a room type")
      return
    }

    setSubmitting(true)

    try {
      const total = calculateTotal()
      const startDate = dateRange.from.toISOString().split("T")[0]
      const endDate = dateRange.to.toISOString().split("T")[0]
      const packageName = packages.find((p: any) => p.id === selectedPackage)?.name || ""
      
      const courseNames = selectedCourses.map((id) => 
        golfCourses.find((c: any) => c.id === id)?.course_name
      ).filter(Boolean)

      const response = await fetch("/api/inquiry", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tripId: trip.id,
          tripTitle: trip.title,
          customerName: profile?.full_name || user?.email || "Unknown",
          customerEmail: profile?.email || user?.email || "",
          packageName,
          startDate,
          endDate,
          golfCourses: courseNames,
          rounds,
          mealOption: selectedMeal === "included" ? "Breakfast Included" : "Breakfast Not Included",
          transportOption: selectedTransport === "private" ? "Private Car with Driver" : "Drive Yourself",
          additionalRequests,
          totalPrice: total,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to send inquiry")
      }

      alert("Your inquiry has been submitted! We'll contact you shortly.")
      
      // Reset form
      setSelectedPackage("")
      setDateRange({ from: undefined, to: undefined })
      setSelectedCourses([])
      setRounds(2)
      setSelectedMeal("included")
      setSelectedTransport("private")
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
        {/* Step 1: Select Room Type */}
        <Card className="bg-[#E8DCC4] p-6">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-[#C9B896] text-sm font-bold">1</div>
            <h2 className="text-lg font-bold">Select Room Type</h2>
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

        {/* Step 2: Travel Duration */}
        <Card className="bg-[#E8DCC4] p-6">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-[#C9B896] text-sm font-bold">2</div>
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

        {/* Step 3: Golf Courses & Rounds */}
        <Card className="bg-[#E8DCC4] p-6">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-[#C9B896] text-sm font-bold">3</div>
            <h2 className="text-lg font-bold">Golf Courses & Rounds</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <h3 className="mb-2 font-medium">Select Courses</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                Choose which golf courses you want to play
              </p>
              <div className="space-y-2">
                {golfCourses.map((course: any) => (
                  <Card
                    key={course.id}
                    className={`cursor-pointer p-4 transition-colors hover:bg-accent ${
                      selectedCourses.includes(course.id) ? "border-2 border-[#6b705c]" : ""
                    }`}
                    onClick={() => {
                      setSelectedCourses((prev) =>
                        prev.includes(course.id) ? prev.filter((id) => id !== course.id) : [...prev, course.id],
                      )
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold">{course.course_name}</span>
                      <span className="font-bold">${course.price_per_round}</span>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            <div>
              <h3 className="mb-2 font-medium">Select Rounds</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                How many rounds would you like to play?
              </p>
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
          </div>
        </Card>

        {/* Step 4: Meals */}
        <Card className="bg-[#E8DCC4] p-6">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-[#C9B896] text-sm font-bold">4</div>
            <h2 className="text-lg font-bold">Meals</h2>
          </div>
          <RadioGroup value={selectedMeal} onValueChange={(val: any) => setSelectedMeal(val)} className="space-y-2">
            <Card
              className={`relative cursor-pointer p-4 transition-colors hover:bg-accent ${
                selectedMeal === "included" ? "border-2 border-[#6b705c]" : ""
              }`}
              onClick={() => setSelectedMeal("included")}
            >
              <RadioGroupItem value="included" id="meal-included" className="absolute right-4 top-4" />
              <label htmlFor="meal-included" className="flex cursor-pointer items-center gap-2">
                <Check className="h-4 w-4" />
                <span className="font-bold">Breakfast Included (Recommended)</span>
              </label>
            </Card>
            <Card
              className={`relative cursor-pointer p-4 transition-colors hover:bg-accent ${
                selectedMeal === "not_included" ? "border-2 border-[#6b705c]" : ""
              }`}
              onClick={() => setSelectedMeal("not_included")}
            >
              <RadioGroupItem value="not_included" id="meal-not-included" className="absolute right-4 top-4" />
              <label htmlFor="meal-not-included" className="cursor-pointer font-bold">
                Breakfast not Included
              </label>
            </Card>
          </RadioGroup>
        </Card>

        {/* Step 5: Transportation */}
        <Card className="bg-[#E8DCC4] p-6">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-[#C9B896] text-sm font-bold">5</div>
            <h2 className="text-lg font-bold">Transportation</h2>
          </div>
          <RadioGroup value={selectedTransport} onValueChange={(val: any) => setSelectedTransport(val)} className="space-y-2">
            <Card
              className={`relative cursor-pointer p-4 transition-colors hover:bg-accent ${
                selectedTransport === "private" ? "border-2 border-[#6b705c]" : ""
              }`}
              onClick={() => setSelectedTransport("private")}
            >
              <RadioGroupItem value="private" id="transport-private" className="absolute right-4 top-4" />
              <label htmlFor="transport-private" className="cursor-pointer font-bold">
                Private Car with Driver (Recommended)
              </label>
            </Card>
            <Card
              className={`relative cursor-pointer p-4 transition-colors hover:bg-accent ${
                selectedTransport === "self" ? "border-2 border-[#6b705c]" : ""
              }`}
              onClick={() => setSelectedTransport("self")}
            >
              <RadioGroupItem value="self" id="transport-self" className="absolute right-4 top-4" />
              <label htmlFor="transport-self" className="cursor-pointer font-bold">
                Drive Yourself
              </label>
            </Card>
          </RadioGroup>
        </Card>

        {/* Step 6: Additional Requests */}
        <Card className="bg-[#E8DCC4] p-6">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-[#C9B896] text-sm font-bold">6</div>
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
            {selectedCourses.length > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">{rounds} Rounds ({selectedCourses.length} courses)</span>
                <span>${selectedCourses.reduce((sum, id) => {
                  const course = golfCourses.find((c: any) => c.id === id)
                  return sum + (course ? Number(course.price_per_round) * rounds : 0)
                }, 0)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {selectedMeal === "included" ? "Breakfast Included" : "Breakfast Not Included"}
              </span>
              <span>${selectedMeal === "included" ? mealOptions.breakfast_included_price : mealOptions.breakfast_not_included_price}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {selectedTransport === "private" ? "Private Car" : "Self Drive"}
              </span>
              <span>${selectedTransport === "private" ? transportationOptions.private_car_price : transportationOptions.self_drive_price}</span>
            </div>
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
            disabled={submitting || !dateRange.from || !dateRange.to || !selectedPackage}
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
