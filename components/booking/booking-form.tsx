"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Calendar } from "@/components/ui/calendar"
import { Users, User, Minus, Plus } from "lucide-react"

interface BookingFormProps {
  trip: any
  user: any
  profile: any
  preSelectedPackageId?: string
}

export function BookingForm({ trip, user, profile, preSelectedPackageId }: BookingFormProps) {
  const packages =
    trip.packages && trip.packages.length > 0
      ? trip.packages.map((pkg: any) => ({
          id: pkg.id,
          name: pkg.name,
          description: pkg.description || "",
          price: Number(pkg.price) || 0,
          icon: pkg.name.toLowerCase().includes("double") ? Users : User,
        }))
      : [
          { id: "double", name: "Double Occupancy", icon: Users, description: "Shared room for two guests", price: 0 },
          { id: "single", name: "Single Occupancy", icon: User, description: "Private room for one guest", price: 0 },
        ]

  const golfCourses = trip.golf_courses || []
  const mealOptions = trip.meal_options || []
  const transportationOptions = trip.transportation_options || []

  // Form state
  const [selectedPackage, setSelectedPackage] = useState<string>(preSelectedPackageId || "")
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  })
  const [dateRangeError, setDateRangeError] = useState<string>("")
  const [courseRounds, setCourseRounds] = useState<Record<string, number>>({})
  const [selectedMeal, setSelectedMeal] = useState<string>("")
  const [selectedTransport, setSelectedTransport] = useState<string>("")
  const [additionalRequests, setAdditionalRequests] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const updateCourseRounds = (courseId: string, rounds: number, maxRounds: number) => {
    const clampedRounds = Math.max(0, Math.min(rounds, maxRounds))
    setCourseRounds((prev) => ({
      ...prev,
      [courseId]: clampedRounds,
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

  const handleDateSelect = (range: any) => {
    const newRange = range || { from: undefined, to: undefined }

    // Clear error when deselecting
    if (!newRange.from || !newRange.to) {
      setDateRange(newRange)
      setDateRangeError("")
      return
    }

    // Check if max_days limit is set and validate
    if (trip.max_days && newRange.from && newRange.to) {
      const daysDiff = Math.ceil((newRange.to.getTime() - newRange.from.getTime()) / (1000 * 60 * 60 * 24))

      if (daysDiff > trip.max_days) {
        setDateRangeError(
          `Selected date range (${daysDiff} days) exceeds the maximum trip duration of ${trip.max_days} ${trip.max_days === 1 ? "day" : "days"}.`,
        )
        // Don't update the date range if it exceeds max_days
        return
      }
    }

    // Valid selection, clear any error and update range
    setDateRangeError("")
    setDateRange(newRange)
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

    if (trip.max_days) {
      const daysDiff = Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24))
      if (daysDiff > trip.max_days) {
        alert(
          `Your selected date range exceeds the maximum trip duration of ${trip.max_days} days. Please select a shorter date range.`,
        )
        return
      }
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
      const transportOptionName =
        transportationOptions.find((transport: any) => transport.id === selectedTransport)?.name ||
        "Private Car with Driver"

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
        <Card className="border-2 border-blue-400 p-4 sm:p-6 border-none bg-transparent shadow-none sm:px-[0] sm:py-[0]">
          <div className="mb-4 flex items-center gap-2 bg-[rgba(240,234,210,1)]">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center text-sm font-bold bg-[rgba(221,190,169,1)] rounded-none">
              1
            </div>
            <h2 className="text-base font-bold sm:text-lg">Select Room Type</h2>
          </div>
          <RadioGroup value={selectedPackage} onValueChange={setSelectedPackage} className="space-y-3">
            {packages.map((pkg: any) => {
              const Icon = pkg.icon
              return (
                <Card
                  key={pkg.id}
                  className="relative cursor-pointer p-3 transition-colors hover:bg-accent sm:p-4 border-2"
                >
                  <RadioGroupItem value={pkg.id} id={pkg.id} className="absolute right-3 top-3 sm:right-4 sm:top-4" />
                  <label htmlFor={pkg.id} className="flex cursor-pointer items-start gap-3">
                    <Icon className="mt-1 h-5 w-5 flex-shrink-0" />
                    <div className="flex-1 pr-8">
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                        <div className="font-bold text-sm sm:text-base">{pkg.name}</div>
                        <div className="font-bold text-sm sm:text-base">${pkg.price}</div>
                      </div>
                      <div className="text-xs text-muted-foreground sm:text-sm">{pkg.description}</div>
                    </div>
                  </label>
                </Card>
              )
            })}
          </RadioGroup>
        </Card>

        {/* Step 2: Travel Duration */}
        <Card className="border-2 border-blue-400 p-4 sm:p-6 sm:px-[0] sm:py-[0] border-none shadow-none bg-transparent">
          <div className="mb-4 flex items-center gap-2 bg-[rgba(240,233,209,1)]">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center text-sm font-bold bg-[rgba(222,190,169,1)] rounded-none">
              2
            </div>
            <h2 className="text-base font-bold sm:text-lg">Travel Duration</h2>
          </div>
          <div className="space-y-4">
            <div>
              <h3 className="mb-2 text-sm font-medium sm:text-base">Select Dates</h3>
              {trip.max_days && (
                <p className="mb-2 text-xs text-muted-foreground sm:text-sm">
                  Maximum trip duration: {trip.max_days} {trip.max_days === 1 ? "day" : "days"}
                </p>
              )}
              <p className="mb-4 text-xs text-muted-foreground sm:text-sm">
                Choose your preferred travel dates for this golf trip
              </p>
              {dateRangeError && (
                <div className="mb-4 rounded-md bg-red-50 border border-red-200 p-3">
                  <p className="text-xs text-red-600 sm:text-sm">{dateRangeError}</p>
                </div>
              )}
              <div className="overflow-x-auto">
                <Calendar mode="range" selected={dateRange} onSelect={handleDateSelect} className="rounded-md border" />
              </div>
            </div>
          </div>
        </Card>

        {/* Step 3: Golf Courses & Rounds */}
        {golfCourses.length > 0 && (
          <Card className="border-2 border-blue-400 p-4 sm:p-6 sm:px-[0] sm:py-[0] border-none shadow-none bg-transparent">
            <div className="mb-4 flex items-center gap-2 bg-[rgba(240,234,210,1)]">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center text-sm font-bold bg-[rgba(221,190,169,1)] rounded-none">
                3
              </div>
              <h2 className="text-base font-bold sm:text-lg">Golf Courses & Rounds</h2>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="mb-2 text-sm font-medium sm:text-base">Select Courses</h3>
                <p className="mb-4 text-xs text-muted-foreground sm:text-sm">
                  Choose golf courses and number of rounds for each
                </p>
                <div className="space-y-3">
                  {golfCourses.map((course: any) => {
                    const rounds = courseRounds[course.id] || 0
                    const maxRounds = course.max_rounds || 5

                    return (
                      <Card key={course.id} className="p-3 transition-colors sm:p-4">
                        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <span className="font-bold text-sm sm:text-base">{course.course_name}</span>
                          <span className="font-bold text-sm sm:text-base">${course.price_per_round}/round</span>
                        </div>

                        <div className="flex items-center gap-3 sm:gap-4">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => updateCourseRounds(course.id, rounds - 1, maxRounds)}
                            disabled={rounds <= 0}
                            className="h-8 w-8 flex-shrink-0 sm:h-10 sm:w-10"
                          >
                            <Minus className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                          <div className="flex-1 text-center">
                            <div className="text-xs text-muted-foreground sm:text-sm">Rounds</div>
                            <div className="text-lg font-bold sm:text-xl">{rounds}</div>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => updateCourseRounds(course.id, rounds + 1, maxRounds)}
                            disabled={rounds >= maxRounds}
                            className="h-8 w-8 flex-shrink-0 sm:h-10 sm:w-10"
                          >
                            <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
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
          <Card className="border-2 border-blue-400 p-4 sm:p-6 sm:px-[0] sm:py-[0] border-none shadow-none bg-transparent">
            <div className="mb-4 flex items-center gap-2 bg-[rgba(240,234,210,1)]">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center text-sm font-bold bg-[rgba(221,190,169,1)] rounded-none">
                4
              </div>
              <h2 className="text-base font-bold sm:text-lg">Meals</h2>
            </div>
            <RadioGroup value={selectedMeal} onValueChange={(val: any) => setSelectedMeal(val)} className="space-y-2">
              {mealOptions.map((meal: any, index: number) => (
                <Card
                  key={meal.id}
                  className={`relative cursor-pointer p-3 transition-colors hover:bg-accent sm:p-4 ${
                    selectedMeal === meal.id ? "border-2 border-[#6b705c]" : ""
                  }`}
                  onClick={() => setSelectedMeal(meal.id)}
                >
                  <RadioGroupItem
                    value={meal.id}
                    id={`meal-${meal.id}`}
                    className="absolute right-3 top-3 sm:right-4 sm:top-4"
                  />
                  <label htmlFor={`meal-${meal.id}`} className="cursor-pointer pr-8">
                    <div className="font-bold text-sm sm:text-base">{meal.name}</div>
                    {meal.description && (
                      <div className="text-xs text-muted-foreground sm:text-sm">{meal.description}</div>
                    )}
                  </label>
                </Card>
              ))}
            </RadioGroup>
          </Card>
        )}

        {/* Step 5: Transportation */}
        {transportationOptions.length > 0 && (
          <Card className="border-2 border-blue-400 p-4 sm:p-6 sm:px-[0] sm:py-[0] border-none shadow-none bg-transparent">
            <div className="mb-4 flex items-center gap-2 bg-[rgba(240,234,210,1)]">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center text-sm font-bold bg-[rgba(221,190,169,1)] rounded-none">
                5
              </div>
              <h2 className="text-base font-bold sm:text-lg">Transportation</h2>
            </div>
            <RadioGroup
              value={selectedTransport}
              onValueChange={(val: any) => setSelectedTransport(val)}
              className="space-y-2"
            >
              {transportationOptions.map((transport: any, index: number) => (
                <Card
                  key={transport.id}
                  className={`relative cursor-pointer p-3 transition-colors hover:bg-accent sm:p-4 ${
                    selectedTransport === transport.id ? "border-2 border-[#6b705c]" : ""
                  }`}
                  onClick={() => setSelectedTransport(transport.id)}
                >
                  <RadioGroupItem
                    value={transport.id}
                    id={`transport-${transport.id}`}
                    className="absolute right-3 top-3 sm:right-4 sm:top-4"
                  />
                  <label htmlFor={`transport-${transport.id}`} className="cursor-pointer pr-8">
                    <div className="font-bold text-sm sm:text-base">{transport.name}</div>
                    {transport.description && (
                      <div className="text-xs text-muted-foreground sm:text-sm">{transport.description}</div>
                    )}
                  </label>
                </Card>
              ))}
            </RadioGroup>
          </Card>
        )}

        {/* Step 6: Additional Requests */}
        <Card className="border-2 border-blue-400 p-4 sm:p-6 sm:py-[0] border-none shadow-none sm:px-[0] bg-transparent">
          <div className="mb-4 flex items-center gap-2 bg-[rgba(240,232,209,1)]">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center text-sm font-bold bg-[rgba(222,190,169,1)] rounded-none">
              6
            </div>
            <h2 className="text-base font-bold sm:text-lg">Additional Requests</h2>
          </div>
          <Textarea
            placeholder="Any special requests or dietary requirements..."
            value={additionalRequests}
            onChange={(e) => setAdditionalRequests(e.target.value)}
            className="min-h-[100px] text-sm"
          />
        </Card>
      </div>

      {/* Confirmation Panel */}
      <div className="lg:sticky lg:top-8 lg:self-start">
        <Card className="p-4 sm:p-6 shadow-none sm:px-[0] sm:py-[0] pl-0 py-0 bg-destructive-foreground sm:pb-2.5 rounded-md border-primary border-solid border-2">
          <div className="mb-4 bg-[rgba(240,234,210,1)] px-3 py-2 flex pl-0 pt-0 pb-0 gap-2">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center text-sm font-bold bg-[rgba(222,190,169,1)] rounded-none">
            </div>
            <h2 className="text-base font-bold sm:text-lg">Confirmation</h2>
          </div>
          <div className="space-y-2 text-xs sm:text-sm px-12">
            {dateRange.from && dateRange.to && (
              <div className="flex flex-col gap-1 sm:flex-row sm:justify-between">
                <span className="text-muted-foreground">Reservation for:</span>
                <span className="font-medium">
                  {dateRange.from.toLocaleDateString()} - {dateRange.to.toLocaleDateString()}
                </span>
              </div>
            )}
            {selectedPackage && (
              <div className="flex flex-col gap-1 sm:flex-row sm:justify-between">
                <span className="text-muted-foreground">
                  {packages.find((p: any) => p.id === selectedPackage)?.name}
                </span>
                <span className="font-medium">${packages.find((p: any) => p.id === selectedPackage)?.price}</span>
              </div>
            )}
            {Object.entries(courseRounds)
              .filter(([_, rounds]) => rounds > 0)
              .map(([courseId, rounds]) => {
                const course = golfCourses.find((c: any) => c.id === courseId)
                if (!course) return null
                return (
                  <div key={courseId} className="flex flex-col gap-1 sm:flex-row sm:justify-between">
                    <span className="text-muted-foreground">
                      {course.course_name} ({rounds} rounds)
                    </span>
                    <span className="font-medium">${Number(course.price_per_round) * rounds}</span>
                  </div>
                )
              })}
            {selectedMeal && (
              <div className="flex flex-col gap-1 sm:flex-row sm:justify-between">
                <span className="text-muted-foreground">
                  {mealOptions.find((meal: any) => meal.id === selectedMeal)?.name}
                </span>
                <span className="font-medium">${mealOptions.find((meal: any) => meal.id === selectedMeal)?.price}</span>
              </div>
            )}
            {selectedTransport && (
              <div className="flex flex-col gap-1 sm:flex-row sm:justify-between">
                <span className="text-muted-foreground">
                  {transportationOptions.find((transport: any) => transport.id === selectedTransport)?.name}
                </span>
                <span className="font-medium">
                  ${transportationOptions.find((transport: any) => transport.id === selectedTransport)?.price}
                </span>
              </div>
            )}
          </div>

          <div className="my-4 border-t border-border pt-4 px-12 border-none">
            <div className="flex justify-between text-base font-bold sm:text-lg">
              <span>Total:</span>
              <span>${calculateTotal()}</span>
            </div>
          </div>

          <Button
            className="w-3/4 bg-[#9CA986] text-sm hover:bg-[#8a9876] sm:text-base mx-auto"
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
                <img
                  src={img.image_url || "/placeholder.svg"}
                  alt={trip.title}
                  className="h-full w-full object-cover"
                />
              </div>
            ))}
          </div>
        )}

        <Card className="mt-4 p-3 sm:p-4 sm:px-[0] sm:py-[0] border-none bg-transparent shadow-none">
          <h3 className="text-sm font-bold sm:text-base">{trip.title}</h3>
          <p className="mt-2 text-xs text-muted-foreground sm:text-sm">Location: {trip.location}</p>
        </Card>
      </div>
    </div>
  )
}
