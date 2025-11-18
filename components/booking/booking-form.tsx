"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Calendar } from "@/components/ui/calendar"
import { Users, User, Minus, Plus, Check } from 'lucide-react'
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

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
  const mealOptions = trip.meal_options || []
  const transportationOptions = trip.transportation_options || []

  // Form state
  const [selectedPackage, setSelectedPackage] = useState<string>("")
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  })
  const [courseRounds, setCourseRounds] = useState<Record<string, number>>({})
  const [selectedMeal, setSelectedMeal] = useState<string>("")
  const [selectedTransport, setSelectedTransport] = useState<string>("")
  const [additionalRequests, setAdditionalRequests] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const updateCourseRounds = (courseId: string, rounds: number, maxRounds: number) => {
    const clampedRounds = Math.max(0, Math.min(rounds, maxRounds))
    setCourseRounds(prev => ({
      ...prev,
      [courseId]: clampedRounds
    }))
  }

  const calculateTotal = () => {
    let total = 0

    // Package price
    const selectedPkg = packages.find((p: any) => p.id === selectedPackage)
    if (selectedPkg) total += selectedPkg.price

    Object.entries(courseRounds).forEach(([courseId, rounds]) => {
      if (rounds > 0) {
        const course = golfCourses.find((c: any) => c.id === courseId)
        if (course) total += Number(course.price_per_round) * rounds
      }
    })

    // Meals
    const selectedMealOption = mealOptions.find((meal: any) => meal.id === selectedMeal)
    if (selectedMealOption) {
      total += Number(selectedMealOption.price)
    }

    // Transportation
    const selectedTransportOption = transportationOptions.find((transport: any) => transport.id === selectedTransport)
    if (selectedTransportOption) {
      total += Number(selectedTransportOption.price)
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
      
      const courseDetails = Object.entries(courseRounds)
        .filter(([_, rounds]) => rounds > 0)
        .map(([courseId, rounds]) => {
          const course = golfCourses.find((c: any) => c.id === courseId)
          return course ? `${course.course_name} (${rounds} rounds)` : null
        })
        .filter(Boolean)

      const mealOptionName = mealOptions.find((meal: any) => meal.id === selectedMeal)?.name || "Breakfast Included"
      const transportOptionName = transportationOptions.find((transport: any) => transport.id === selectedTransport)?.name || "Private Car with Driver"

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
          golfCourses: courseDetails,
          mealOption: mealOptionName,
          transportOption: transportOptionName,
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
      setCourseRounds({})
      setSelectedMeal("")
      setSelectedTransport("")
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
        {golfCourses.length > 0 && (
          <Card className="bg-[#E8DCC4] p-6">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-[#C9B896] text-sm font-bold">3</div>
              <h2 className="text-lg font-bold">Golf Courses & Rounds</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="mb-2 font-medium">Select Courses</h3>
                <p className="mb-4 text-sm text-muted-foreground">
                  Choose golf courses and number of rounds for each
                </p>
                <div className="space-y-3">
                  {golfCourses.map((course: any) => {
                    const rounds = courseRounds[course.id] || 0
                    const maxRounds = course.max_rounds || 5
                    
                    return (
                      <Card
                        key={course.id}
                        className="p-4 transition-colors"
                      >
                        <div className="mb-3 flex items-center justify-between">
                          <span className="font-bold">{course.course_name}</span>
                          <span className="font-bold">${course.price_per_round}/round</span>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => updateCourseRounds(course.id, rounds - 1, maxRounds)}
                            disabled={rounds <= 0}
                            className="h-8 w-8"
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <div className="flex-1 text-center">
                            <div className="text-sm text-muted-foreground">Rounds</div>
                            <div className="text-xl font-bold">{rounds}</div>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => updateCourseRounds(course.id, rounds + 1, maxRounds)}
                            disabled={rounds >= maxRounds}
                            className="h-8 w-8"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="mt-2 text-center text-xs text-muted-foreground">
                          Max: {maxRounds} rounds available
                        </div>
                      </Card>
                    )
                  })}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Step 4: Meals */}
        {mealOptions.length > 0 && (
          <Card className="bg-[#E8DCC4] p-6">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-[#C9B896] text-sm font-bold">4</div>
              <h2 className="text-lg font-bold">Meals</h2>
            </div>
            <RadioGroup value={selectedMeal} onValueChange={(val: any) => setSelectedMeal(val)} className="space-y-2">
              {mealOptions.map((meal: any, index: number) => (
                <Card
                  key={meal.id}
                  className={`relative cursor-pointer p-4 transition-colors hover:bg-accent ${
                    selectedMeal === meal.id ? "border-2 border-[#6b705c]" : ""
                  }`}
                  onClick={() => setSelectedMeal(meal.id)}
                >
                  <RadioGroupItem value={meal.id} id={`meal-${meal.id}`} className="absolute right-4 top-4" />
                  <label htmlFor={`meal-${meal.id}`} className="cursor-pointer">
                    <div className="font-bold">{meal.name}</div>
                    {meal.description && <div className="text-sm text-muted-foreground">{meal.description}</div>}
                  </label>
                </Card>
              ))}
            </RadioGroup>
          </Card>
        )}

        {/* Step 5: Transportation */}
        {transportationOptions.length > 0 && (
          <Card className="bg-[#E8DCC4] p-6">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-[#C9B896] text-sm font-bold">5</div>
              <h2 className="text-lg font-bold">Transportation</h2>
            </div>
            <RadioGroup value={selectedTransport} onValueChange={(val: any) => setSelectedTransport(val)} className="space-y-2">
              {transportationOptions.map((transport: any, index: number) => (
                <Card
                  key={transport.id}
                  className={`relative cursor-pointer p-4 transition-colors hover:bg-accent ${
                    selectedTransport === transport.id ? "border-2 border-[#6b705c]" : ""
                  }`}
                  onClick={() => setSelectedTransport(transport.id)}
                >
                  <RadioGroupItem value={transport.id} id={`transport-${transport.id}`} className="absolute right-4 top-4" />
                  <label htmlFor={`transport-${transport.id}`} className="cursor-pointer">
                    <div className="font-bold">{transport.name}</div>
                    {transport.description && <div className="text-sm text-muted-foreground">{transport.description}</div>}
                  </label>
                </Card>
              ))}
            </RadioGroup>
          </Card>
        )}

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
            {Object.entries(courseRounds).filter(([_, rounds]) => rounds > 0).map(([courseId, rounds]) => {
              const course = golfCourses.find((c: any) => c.id === courseId)
              if (!course) return null
              return (
                <div key={courseId} className="flex justify-between">
                  <span className="text-muted-foreground">{course.course_name} ({rounds} rounds)</span>
                  <span>${Number(course.price_per_round) * rounds}</span>
                </div>
              )
            })}
            {selectedMeal && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">{mealOptions.find((meal: any) => meal.id === selectedMeal)?.name}</span>
                <span>${mealOptions.find((meal: any) => meal.id === selectedMeal)?.price}</span>
              </div>
            )}
            {selectedTransport && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">{transportationOptions.find((transport: any) => transport.id === selectedTransport)?.name}</span>
                <span>${transportationOptions.find((transport: any) => transport.id === selectedTransport)?.price}</span>
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
