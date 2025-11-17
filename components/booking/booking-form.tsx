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

const ROOM_TYPES = [
  { id: "double", name: "Double Occupancy", icon: Users, description: "Shared room for two guests" },
  { id: "single", name: "Single Occupancy", icon: User, description: "Private room for one guest" },
]

const COURSE_OPTIONS = [
  { id: "course-a", name: "Course A", price: 10 },
  { id: "course-b", name: "Course B", price: 50 },
  { id: "course-c", name: "Course C", price: 75 },
]

const MEAL_OPTIONS = [
  { id: "breakfast-included", name: "Breakfast Included (Recommended)", price: 0 },
  { id: "breakfast-not-included", name: "Breakfast not Included", price: 0 },
]

const TRANSPORT_OPTIONS = [
  { id: "private-car", name: "Private Car with Driver (Recommended)", price: 0 },
  { id: "drive-yourself", name: "Drive Yourself", price: 0 },
]

export function BookingForm({ trip }: BookingFormProps) {
  // Form state
  const [customerName, setCustomerName] = useState("")
  const [customerEmail, setCustomerEmail] = useState("")
  const [selectedRoomType, setSelectedRoomType] = useState<string>("")
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  })
  const [selectedCourses, setSelectedCourses] = useState<string[]>([])
  const [rounds, setRounds] = useState(2)
  const [selectedMeal, setSelectedMeal] = useState<string>("")
  const [selectedTransport, setSelectedTransport] = useState<string>("")
  const [additionalRequests, setAdditionalRequests] = useState("")
  const [submitting, setSubmitting] = useState(false)

  // Calculate total price (base trip price + add-ons)
  const calculateTotal = () => {
    let total = trip.price_regular || 0

    // Course prices
    selectedCourses.forEach((courseId) => {
      const course = COURSE_OPTIONS.find((o) => o.id === courseId)
      if (course) total += course.price
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

    if (!selectedRoomType) {
      alert("Please select a room type")
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
      const roomTypeName = ROOM_TYPES.find((r) => r.id === selectedRoomType)?.name || ""
      const courseNames = selectedCourses.map((id) => COURSE_OPTIONS.find((c) => c.id === id)?.name).filter(Boolean)
      const mealName = MEAL_OPTIONS.find((m) => m.id === selectedMeal)?.name || "None"
      const transportName = TRANSPORT_OPTIONS.find((t) => t.id === selectedTransport)?.name || "None"

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
          roomType: roomTypeName,
          startDate,
          endDate,
          courses: courseNames,
          rounds,
          meal: mealName,
          transport: transportName,
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
      setSelectedRoomType("")
      setDateRange({ from: undefined, to: undefined })
      setSelectedCourses([])
      setRounds(2)
      setSelectedMeal("")
      setSelectedTransport("")
      setAdditionalRequests("")
    } catch (error) {
      console.error("[v0] Error submitting inquiry:", error)
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

        {/* Step 2: Select Room Type */}
        <Card className="bg-[#E8DCC4] p-6">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-[#C9B896] text-sm font-bold">2</div>
            <h2 className="text-lg font-bold">Select Room Type</h2>
          </div>
          <RadioGroup value={selectedRoomType} onValueChange={setSelectedRoomType} className="space-y-3">
            {ROOM_TYPES.map((roomType) => {
              const Icon = roomType.icon
              return (
                <Card key={roomType.id} className="relative cursor-pointer p-4 transition-colors hover:bg-accent">
                  <RadioGroupItem value={roomType.id} id={roomType.id} className="absolute right-4 top-4" />
                  <label htmlFor={roomType.id} className="flex cursor-pointer items-start gap-3">
                    <Icon className="mt-1 h-5 w-5" />
                    <div className="flex-1">
                      <div className="font-bold">{roomType.name}</div>
                      <div className="text-sm text-muted-foreground">{roomType.description}</div>
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
              <Calendar
                mode="range"
                selected={dateRange}
                onSelect={(range: any) => setDateRange(range || { from: undefined, to: undefined })}
                className="rounded-md border"
              />
            </div>
          </div>
        </Card>

        {/* Step 4: Golf Courses & Rounds */}
        <Card className="bg-[#E8DCC4] p-6">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-[#C9B896] text-sm font-bold">4</div>
            <h2 className="text-lg font-bold">Golf Courses & Rounds</h2>
          </div>
          <div className="space-y-6">
            <div>
              <h3 className="mb-2 font-medium">Select Courses</h3>
              <p className="mb-4 text-sm text-muted-foreground">Choose which courses you'd like to play</p>
              <div className="space-y-2">
                {COURSE_OPTIONS.map((course) => (
                  <Card
                    key={course.id}
                    className={`cursor-pointer p-4 transition-colors hover:bg-accent ${
                      selectedCourses.includes(course.id) ? "border-primary" : ""
                    }`}
                    onClick={() => {
                      setSelectedCourses((prev) =>
                        prev.includes(course.id) ? prev.filter((id) => id !== course.id) : [...prev, course.id],
                      )
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{course.name}</span>
                      <span className="font-bold">${course.price}</span>
                    </div>
                  </Card>
                ))}
              </div>
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
          </div>
        </Card>

        {/* Step 5: Meals */}
        <Card className="bg-[#E8DCC4] p-6">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-[#C9B896] text-sm font-bold">5</div>
            <h2 className="text-lg font-bold">Meals</h2>
          </div>
          <RadioGroup value={selectedMeal} onValueChange={setSelectedMeal} className="space-y-2">
            {MEAL_OPTIONS.map((meal) => (
              <Card key={meal.id} className="relative cursor-pointer p-4 transition-colors hover:bg-accent">
                <RadioGroupItem value={meal.id} id={meal.id} className="absolute right-4 top-4" />
                <label htmlFor={meal.id} className="flex cursor-pointer items-center justify-between">
                  <span className="font-medium">{meal.name}</span>
                </label>
              </Card>
            ))}
          </RadioGroup>
        </Card>

        {/* Step 6: Transportation */}
        <Card className="bg-[#E8DCC4] p-6">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-[#C9B896] text-sm font-bold">6</div>
            <h2 className="text-lg font-bold">Transportation</h2>
          </div>
          <RadioGroup value={selectedTransport} onValueChange={setSelectedTransport} className="space-y-2">
            {TRANSPORT_OPTIONS.map((transport) => (
              <Card key={transport.id} className="relative cursor-pointer p-4 transition-colors hover:bg-accent">
                <RadioGroupItem value={transport.id} id={transport.id} className="absolute right-4 top-4" />
                <label htmlFor={transport.id} className="flex cursor-pointer items-center justify-between">
                  <span className="font-medium">{transport.name}</span>
                </label>
              </Card>
            ))}
          </RadioGroup>
        </Card>

        {/* Step 7: Additional Requests */}
        <Card className="bg-[#E8DCC4] p-6">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-[#C9B896] text-sm font-bold">7</div>
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
            {selectedRoomType && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">{ROOM_TYPES.find((r) => r.id === selectedRoomType)?.name}</span>
                <span>${trip.price_regular}</span>
              </div>
            )}
            {selectedCourses.map((courseId) => {
              const course = COURSE_OPTIONS.find((o) => o.id === courseId)
              return (
                course && (
                  <div key={courseId} className="flex justify-between">
                    <span className="text-muted-foreground">{course.name}</span>
                    <span>${course.price}</span>
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
            {selectedMeal && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">{MEAL_OPTIONS.find((m) => m.id === selectedMeal)?.name}</span>
                <span>Included</span>
              </div>
            )}
            {selectedTransport && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {TRANSPORT_OPTIONS.find((t) => t.id === selectedTransport)?.name}
                </span>
                <span>Included</span>
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
            disabled={submitting || !dateRange.from || !dateRange.to || !selectedRoomType || !customerName || !customerEmail}
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
