"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Calendar } from "@/components/ui/calendar"
import { Users, User, Minus, Plus, Check } from "lucide-react"

interface BookingFormProps {
  trip: any
  user: any
  profile: any
  preSelectedPackageId?: string
}

export function BookingForm({ trip, user, profile, preSelectedPackageId }: BookingFormProps) {
  const packages = trip.packages || []
  const basicPackage = packages.find((pkg: any) => pkg.name === "Basic" || pkg.name === "Regular")
  const premiumPackage = packages.find((pkg: any) => pkg.name === "Premium")

  const golfCourses = trip.golf_courses || []
  const mealOptions = trip.meal_options || []
  const transportationOptions = trip.transportation_options || []
  const isAllInclusive = trip.is_all_inclusive || false

  const [selectedPlan, setSelectedPlan] = useState<string>(preSelectedPackageId || basicPackage?.id || "")
  const [roomType, setRoomType] = useState<string>("")
  const [travelDateRange, setTravelDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  })
  const [courseDateRange, setCourseDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  })
  const [dateSelectionMode, setDateSelectionMode] = useState<"travel" | "course">("travel")
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

    const selectedPackage = packages.find((p: any) => p.id === selectedPlan)
    if (selectedPackage) total += Number(selectedPackage.price)

    // Golf courses
    Object.entries(courseRounds).forEach(([courseId, rounds]) => {
      if (rounds > 0) {
        const course = golfCourses.find((c: any) => c.id === courseId)
        if (course) total += Number(course.price_per_round) * rounds
      }
    })

    // Meals (only if not all-inclusive)
    if (!isAllInclusive) {
      const selectedMealOption = mealOptions.find((meal: any) => meal.id === selectedMeal)
      if (selectedMealOption) {
        total += Number(selectedMealOption.price)
      }
    }

    // Transportation (only if not all-inclusive)
    if (!isAllInclusive) {
      const selectedTransportOption = transportationOptions.find((transport: any) => transport.id === selectedTransport)
      if (selectedTransportOption) {
        total += Number(selectedTransportOption.price)
      }
    }

    return total
  }

  const handleTravelDateSelect = (range: any) => {
    const newRange = range || { from: undefined, to: undefined }

    if (!newRange.from || !newRange.to) {
      setTravelDateRange(newRange)
      setDateRangeError("")
      // Reset course dates if travel dates are cleared
      if (!newRange.from && !newRange.to) {
        setCourseDateRange({ from: undefined, to: undefined })
      }
      return
    }

    if (trip.min_days_advance && newRange.from) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const daysUntilStart = Math.ceil((newRange.from.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

      if (daysUntilStart < trip.min_days_advance) {
        setDateRangeError(
          `This trip requires booking at least ${trip.min_days_advance} days in advance. Please select a start date that is at least ${trip.min_days_advance} days from today.`,
        )
        return
      }
    }

    if (trip.max_days && newRange.from && newRange.to) {
      const daysDiff = Math.ceil((newRange.to.getTime() - newRange.from.getTime()) / (1000 * 60 * 60 * 24))

      if (daysDiff > trip.max_days) {
        setDateRangeError(
          `Selected date range (${daysDiff} days) exceeds the maximum trip duration of ${trip.max_days} ${trip.max_days === 1 ? "day" : "days"}.`,
        )
        return
      }
    }

    setDateRangeError("")
    setTravelDateRange(newRange)

    // Reset course dates if they fall outside new travel dates
    if (courseDateRange.from && courseDateRange.to) {
      if (courseDateRange.from < newRange.from || courseDateRange.to > newRange.to) {
        setCourseDateRange({ from: undefined, to: undefined })
      }
    }
  }

  const handleCourseDateSelect = (range: any) => {
    const newRange = range || { from: undefined, to: undefined }

    if (!travelDateRange.from || !travelDateRange.to) {
      setDateRangeError("Please select travel dates first before selecting course dates.")
      return
    }

    if (newRange.from && newRange.from < travelDateRange.from) {
      setDateRangeError("Course dates must be within your travel dates.")
      return
    }

    if (newRange.to && newRange.to > travelDateRange.to) {
      setDateRangeError("Course dates must be within your travel dates.")
      return
    }

    setDateRangeError("")
    setCourseDateRange(newRange)
  }

  const handleSubmit = async () => {
    if (!user) {
      alert("Please sign in to submit an inquiry")
      window.location.href = `/auth/login?redirect=/trips/${trip.slug}/book`
      return
    }

    if (!travelDateRange.from || !travelDateRange.to) {
      alert("Please select travel dates")
      return
    }

    if (!courseDateRange.from || !courseDateRange.to) {
      alert("Please select course dates")
      return
    }

    if (trip.max_days) {
      const daysDiff = Math.ceil(
        (travelDateRange.to.getTime() - travelDateRange.from.getTime()) / (1000 * 60 * 60 * 24),
      )
      if (daysDiff > trip.max_days) {
        alert(
          `Your selected date range exceeds the maximum trip duration of ${trip.max_days} days. Please select a shorter date range.`,
        )
        return
      }
    }

    if (!selectedPlan) {
      alert("Please select a plan (Basic or Premium)")
      return
    }

    if (!roomType) {
      alert("Please select a room type (Double or Single Occupancy)")
      return
    }

    setSubmitting(true)

    try {
      const total = calculateTotal()
      const startDate = travelDateRange.from.toISOString().split("T")[0]
      const endDate = travelDateRange.to.toISOString().split("T")[0]
      const courseStartDate = courseDateRange.from.toISOString().split("T")[0]
      const courseEndDate = courseDateRange.to.toISOString().split("T")[0]

      const selectedPackage = packages.find((p: any) => p.id === selectedPlan)
      const packageName = selectedPackage?.name || ""
      const occupancyType = roomType === "double" ? "Double Occupancy" : "Single Occupancy"

      const courseDetails = Object.entries(courseRounds)
        .filter(([_, rounds]) => rounds > 0)
        .map(([courseId, rounds]) => {
          const course = golfCourses.find((c: any) => c.id === courseId)
          return course ? `${course.course_name} (${rounds} rounds)` : null
        })
        .filter(Boolean)

      const mealOptionName = isAllInclusive
        ? "Included (All-Inclusive)"
        : mealOptions.find((meal: any) => meal.id === selectedMeal)?.name || "Breakfast Included"
      const transportOptionName = isAllInclusive
        ? "Included (All-Inclusive)"
        : transportationOptions.find((transport: any) => transport.id === selectedTransport)?.name ||
          "Private Car with Driver"

      const response = await fetch("/api/inquiry", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tripId: trip.id,
          tripTitle: trip.title,
          customerName: profile?.display_name || user?.email || "Unknown",
          customerEmail: profile?.email || user?.email || "",
          packageName: `${packageName} - ${occupancyType}`,
          startDate,
          endDate,
          courseStartDate,
          courseEndDate,
          golfCourses: courseDetails,
          mealOption: mealOptionName,
          transportOption: transportOptionName,
          additionalRequests,
          totalPrice: total,
          roomType: occupancyType,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to send inquiry")
      }

      alert("Your inquiry has been submitted! We'll contact you shortly.")

      setSelectedPlan(basicPackage?.id || "")
      setRoomType("")
      setTravelDateRange({ from: undefined, to: undefined })
      setCourseDateRange({ from: undefined, to: undefined })
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

  const getCalendarModifiers = () => {
    const modifiers: any = {}

    if (travelDateRange.from && travelDateRange.to) {
      modifiers.travelDays = { from: travelDateRange.from, to: travelDateRange.to }
    }

    if (courseDateRange.from && courseDateRange.to) {
      modifiers.courseDays = { from: courseDateRange.from, to: courseDateRange.to }
    }

    return modifiers
  }

  const getCalendarModifiersStyles = () => ({
    travelDays: {
      backgroundColor: "#274C77",
      color: "white",
    },
    courseDays: {
      backgroundColor: "#6096BA",
      color: "white",
    },
  })

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
      <div className="space-y-6">
        <Card className="border-2 border-blue-400 p-4 sm:p-6 border-none bg-transparent shadow-none sm:px-[0] sm:py-[0]">
          <div className="mb-4 flex items-center gap-2 bg-[rgba(240,234,210,1)]">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center text-sm font-bold bg-[rgba(221,190,169,1)] rounded-none">
              1
            </div>
            <h2 className="text-base font-bold sm:text-lg">Select Your Plan</h2>
          </div>
          <RadioGroup value={selectedPlan} onValueChange={setSelectedPlan} className="space-y-3">
            {basicPackage && (
              <Card
                key={basicPackage.id}
                className="relative cursor-pointer p-3 transition-colors hover:bg-accent sm:p-4 border-2"
              >
                <RadioGroupItem
                  value={basicPackage.id}
                  id={basicPackage.id}
                  className="absolute right-3 top-3 sm:right-4 sm:top-4"
                />
                <label htmlFor={basicPackage.id} className="flex cursor-pointer items-start gap-3">
                  <div className="flex-1 pr-8">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <div className="font-bold text-sm sm:text-base">Basic Package</div>
                      <div className="font-bold text-sm sm:text-base">${basicPackage.price}</div>
                    </div>
                    <div className="text-xs text-muted-foreground sm:text-sm">
                      {basicPackage.description || "Essential golf trip experience"}
                    </div>
                  </div>
                </label>
              </Card>
            )}
            {premiumPackage && (
              <Card
                key={premiumPackage.id}
                className="relative cursor-pointer p-3 transition-colors hover:bg-accent sm:p-4 border-2"
              >
                <RadioGroupItem
                  value={premiumPackage.id}
                  id={premiumPackage.id}
                  className="absolute right-3 top-3 sm:right-4 sm:top-4"
                />
                <label htmlFor={premiumPackage.id} className="flex cursor-pointer items-start gap-3">
                  <div className="flex-1 pr-8">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <div className="font-bold text-sm sm:text-base">Premium Package</div>
                      <div className="font-bold text-sm sm:text-base">${premiumPackage.price}</div>
                    </div>
                    <div className="text-xs text-muted-foreground sm:text-sm">
                      {premiumPackage.description || "Enhanced golf trip with premium amenities"}
                    </div>
                  </div>
                </label>
              </Card>
            )}
          </RadioGroup>
        </Card>

        <Card className="border-2 border-blue-400 p-4 sm:p-6 border-none bg-transparent shadow-none sm:px-[0] sm:py-[0]">
          <div className="mb-4 flex items-center gap-2 bg-[rgba(240,234,210,1)]">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center text-sm font-bold bg-[rgba(221,190,169,1)] rounded-none">
              2
            </div>
            <h2 className="text-base font-bold sm:text-lg">Select Room Type</h2>
          </div>
          <RadioGroup value={roomType} onValueChange={setRoomType} className="space-y-3">
            <Card className="relative cursor-pointer p-3 transition-colors hover:bg-accent sm:p-4 border-2">
              <RadioGroupItem value="double" id="double" className="absolute right-3 top-3 sm:right-4 sm:top-4" />
              <label htmlFor="double" className="flex cursor-pointer items-start gap-3">
                <Users className="mt-1 h-5 w-5 flex-shrink-0" />
                <div className="flex-1 pr-8">
                  <div className="font-bold text-sm sm:text-base">Double Occupancy</div>
                  <div className="text-xs text-muted-foreground sm:text-sm">Shared room for two guests</div>
                </div>
              </label>
            </Card>
            <Card className="relative cursor-pointer p-3 transition-colors hover:bg-accent sm:p-4 border-2">
              <RadioGroupItem value="single" id="single" className="absolute right-3 top-3 sm:right-4 sm:top-4" />
              <label htmlFor="single" className="flex cursor-pointer items-start gap-3">
                <User className="mt-1 h-5 w-5 flex-shrink-0" />
                <div className="flex-1 pr-8">
                  <div className="font-bold text-sm sm:text-base">Single Occupancy</div>
                  <div className="text-xs text-muted-foreground sm:text-sm">Private room for one guest</div>
                </div>
              </label>
            </Card>
          </RadioGroup>
        </Card>

        <Card className="border-2 border-blue-400 p-4 sm:p-6 sm:px-[0] sm:py-[0] border-none shadow-none bg-transparent">
          <div className="mb-4 flex items-center gap-2 bg-[rgba(240,233,209,1)]">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center text-sm font-bold bg-[rgba(222,190,169,1)] rounded-none">
              3
            </div>
            <h2 className="text-base font-bold sm:text-lg">Travel Duration</h2>
          </div>
          <div className="space-y-4">
            <div>
              <h3 className="mb-2 text-sm font-medium sm:text-base">Select Dates</h3>
              <p className="mb-2 text-xs text-muted-foreground sm:text-sm">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt
              </p>
              {trip.max_days && (
                <p className="mb-2 text-xs text-muted-foreground sm:text-sm">
                  Maximum stay: {trip.max_days} {trip.max_days === 1 ? "night" : "nights"}
                </p>
              )}
              {dateRangeError && (
                <div className="mb-4 rounded-md bg-red-50 border border-red-200 p-3">
                  <p className="text-xs text-red-600 sm:text-sm">{dateRangeError}</p>
                </div>
              )}

              <div className="flex flex-col lg:flex-row gap-6">
                <div className="overflow-x-auto flex-1">
                  <Calendar
                    mode="range"
                    selected={dateSelectionMode === "travel" ? travelDateRange : courseDateRange}
                    onSelect={dateSelectionMode === "travel" ? handleTravelDateSelect : handleCourseDateSelect}
                    className="rounded-md border"
                    modifiers={getCalendarModifiers()}
                    modifiersStyles={getCalendarModifiersStyles()}
                    disabled={(date) => {
                      const today = new Date()
                      today.setHours(0, 0, 0, 0)

                      // Disable past dates
                      if (date < today) return true

                      // For course dates, only allow dates within travel range
                      if (dateSelectionMode === "course" && travelDateRange.from && travelDateRange.to) {
                        return date < travelDateRange.from || date > travelDateRange.to
                      }

                      // Disable dates within minimum advance period for travel dates
                      if (dateSelectionMode === "travel" && trip.min_days_advance && trip.min_days_advance > 0) {
                        const minDate = new Date(today)
                        minDate.setDate(minDate.getDate() + trip.min_days_advance)
                        return date < minDate
                      }

                      return false
                    }}
                  />
                </div>

                {/* Date selection mode buttons */}
                <div className="flex flex-col gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Select Travel Dates</p>
                    <Button
                      type="button"
                      onClick={() => setDateSelectionMode("travel")}
                      className={`w-full flex items-center gap-2 ${
                        dateSelectionMode === "travel"
                          ? "bg-[#274C77] text-white hover:bg-[#1a3a5c]"
                          : "bg-white text-[#274C77] border-2 border-[#274C77] hover:bg-[#274C77]/10"
                      }`}
                    >
                      <span className="w-4 h-4 rounded-sm bg-[#274C77] border border-white"></span>
                      Travel Days
                    </Button>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Select Course Dates</p>
                    <Button
                      type="button"
                      onClick={() => setDateSelectionMode("course")}
                      disabled={!travelDateRange.from || !travelDateRange.to}
                      className={`w-full flex items-center gap-2 ${
                        dateSelectionMode === "course"
                          ? "bg-[#6096BA] text-white hover:bg-[#4a7a9e]"
                          : "bg-white text-[#6096BA] border-2 border-[#6096BA] hover:bg-[#6096BA]/10"
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      <span className="w-4 h-4 rounded-sm bg-[#6096BA] border border-white"></span>
                      Course Days
                    </Button>
                  </div>
                </div>
              </div>

              {/* Reservation summary */}
              {travelDateRange.from && travelDateRange.to && (
                <div className="mt-4 p-4 bg-[rgba(240,234,210,1)] border-t-4 border-[rgba(221,190,169,1)]">
                  <p className="text-sm">
                    <span className="font-medium">Reservation for: </span>
                    <span className="font-bold">
                      {travelDateRange.from.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                      {" - "}
                      {travelDateRange.to.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </p>
                  {courseDateRange.from && courseDateRange.to && (
                    <p className="text-sm mt-1">
                      <span className="font-medium">Course dates: </span>
                      <span className="font-bold">
                        {courseDateRange.from.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                        {" - "}
                        {courseDateRange.to.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </Card>

        {golfCourses.length > 0 && (
          <Card className="border-2 border-blue-400 p-4 sm:p-6 sm:px-[0] sm:py-[0] border-none shadow-none bg-transparent">
            <div className="mb-4 flex items-center gap-2 bg-[rgba(240,234,210,1)]">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center text-sm font-bold bg-[rgba(221,190,169,1)] rounded-none">
                4
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

        {/* Meals Section */}
        {isAllInclusive ? (
          <Card className="border-2 border-blue-400 p-4 sm:p-6 sm:px-[0] sm:py-[0] border-none shadow-none bg-transparent">
            <div className="mb-4 flex items-center gap-2 bg-[rgba(240,234,210,1)]">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center text-sm font-bold bg-[rgba(221,190,169,1)] rounded-none">
                5
              </div>
              <h2 className="text-base font-bold sm:text-lg">Meals</h2>
            </div>
            <Card className="border-2 border-green-500 bg-green-50 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500">
                  <Check className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="font-bold text-sm sm:text-base text-green-800">
                    Included with All-Inclusive Package
                  </div>
                  <div className="text-xs text-green-700 sm:text-sm">Meals are included with your trip</div>
                </div>
              </div>
            </Card>
          </Card>
        ) : (
          mealOptions.length > 0 && (
            <Card className="border-2 border-blue-400 p-4 sm:p-6 sm:px-[0] sm:py-[0] border-none shadow-none bg-transparent">
              <div className="mb-4 flex items-center gap-2 bg-[rgba(240,234,210,1)]">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center text-sm font-bold bg-[rgba(221,190,169,1)] rounded-none">
                  5
                </div>
                <h2 className="text-base font-bold sm:text-lg">Meals</h2>
              </div>
              <RadioGroup value={selectedMeal} onValueChange={setSelectedMeal} className="space-y-3">
                {mealOptions.map((meal: any) => (
                  <Card
                    key={meal.id}
                    className="relative cursor-pointer p-3 transition-colors hover:bg-accent sm:p-4 border-2"
                  >
                    <RadioGroupItem
                      value={meal.id}
                      id={meal.id}
                      className="absolute right-3 top-3 sm:right-4 sm:top-4"
                    />
                    <label htmlFor={meal.id} className="flex cursor-pointer items-start gap-3">
                      <div className="flex-1 pr-8">
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                          <div className="font-bold text-sm sm:text-base">{meal.name}</div>
                          <div className="font-bold text-sm sm:text-base">${meal.price}</div>
                        </div>
                        <div className="text-xs text-muted-foreground sm:text-sm">
                          {meal.description || "Meal option"}
                        </div>
                      </div>
                    </label>
                  </Card>
                ))}
              </RadioGroup>
            </Card>
          )
        )}

        {/* Transportation Section */}
        {isAllInclusive ? (
          <Card className="border-2 border-blue-400 p-4 sm:p-6 sm:px-[0] sm:py-[0] border-none shadow-none bg-transparent">
            <div className="mb-4 flex items-center gap-2 bg-[rgba(240,234,210,1)]">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center text-sm font-bold bg-[rgba(221,190,169,1)] rounded-none">
                6
              </div>
              <h2 className="text-base font-bold sm:text-lg">Transportation</h2>
            </div>
            <Card className="border-2 border-green-500 bg-green-50 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500">
                  <Check className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="font-bold text-sm sm:text-base text-green-800">
                    Included with All-Inclusive Package
                  </div>
                  <div className="text-xs text-green-700 sm:text-sm">Transportation is included with your trip</div>
                </div>
              </div>
            </Card>
          </Card>
        ) : (
          transportationOptions.length > 0 && (
            <Card className="border-2 border-blue-400 p-4 sm:p-6 sm:px-[0] sm:py-[0] border-none shadow-none bg-transparent">
              <div className="mb-4 flex items-center gap-2 bg-[rgba(240,234,210,1)]">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center text-sm font-bold bg-[rgba(221,190,169,1)] rounded-none">
                  6
                </div>
                <h2 className="text-base font-bold sm:text-lg">Transportation</h2>
              </div>
              <RadioGroup value={selectedTransport} onValueChange={setSelectedTransport} className="space-y-3">
                {transportationOptions.map((transport: any) => (
                  <Card
                    key={transport.id}
                    className="relative cursor-pointer p-3 transition-colors hover:bg-accent sm:p-4 border-2"
                  >
                    <RadioGroupItem
                      value={transport.id}
                      id={transport.id}
                      className="absolute right-3 top-3 sm:right-4 sm:top-4"
                    />
                    <label htmlFor={transport.id} className="flex cursor-pointer items-start gap-3">
                      <div className="flex-1 pr-8">
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                          <div className="font-bold text-sm sm:text-base">{transport.name}</div>
                          <div className="font-bold text-sm sm:text-base">${transport.price}</div>
                        </div>
                        <div className="text-xs text-muted-foreground sm:text-sm">
                          {transport.description || "Transportation option"}
                        </div>
                      </div>
                    </label>
                  </Card>
                ))}
              </RadioGroup>
            </Card>
          )
        )}

        {/* Additional Requests */}
        <Card className="border-2 border-blue-400 p-4 sm:p-6 sm:px-[0] sm:py-[0] border-none shadow-none bg-transparent">
          <div className="mb-4 flex items-center gap-2 bg-[rgba(240,234,210,1)]">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center text-sm font-bold bg-[rgba(221,190,169,1)] rounded-none">
              7
            </div>
            <h2 className="text-base font-bold sm:text-lg">Additional Requests</h2>
          </div>
          <Textarea
            placeholder="Any special requests or requirements..."
            value={additionalRequests}
            onChange={(e) => setAdditionalRequests(e.target.value)}
            className="min-h-[100px]"
          />
        </Card>
      </div>

      {/* Summary Sidebar */}
      <div className="lg:sticky lg:top-24 h-fit">
        <Card className="p-4 sm:p-6">
          <h3 className="text-lg font-bold mb-4">Booking Summary</h3>

          <div className="space-y-3 text-sm">
            {selectedPlan && (
              <div className="flex justify-between">
                <span>Package:</span>
                <span className="font-medium">
                  {packages.find((p: any) => p.id === selectedPlan)?.name || "Not selected"}
                </span>
              </div>
            )}

            {roomType && (
              <div className="flex justify-between">
                <span>Room:</span>
                <span className="font-medium">{roomType === "double" ? "Double Occupancy" : "Single Occupancy"}</span>
              </div>
            )}

            {travelDateRange.from && travelDateRange.to && (
              <div className="flex justify-between">
                <span>Travel:</span>
                <span className="font-medium">
                  {travelDateRange.from.toLocaleDateString()} - {travelDateRange.to.toLocaleDateString()}
                </span>
              </div>
            )}

            {courseDateRange.from && courseDateRange.to && (
              <div className="flex justify-between">
                <span>Course:</span>
                <span className="font-medium">
                  {courseDateRange.from.toLocaleDateString()} - {courseDateRange.to.toLocaleDateString()}
                </span>
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t">
            <div className="flex justify-between text-lg font-bold">
              <span>Total:</span>
              <span>${calculateTotal().toFixed(2)}</span>
            </div>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full mt-6 bg-[#6096BA] hover:bg-[#4a7a9e] text-white"
          >
            {submitting ? "Submitting..." : "Submit Inquiry"}
          </Button>
        </Card>
      </div>
    </div>
  )
}
