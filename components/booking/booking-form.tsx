"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar, Check, Users, Hotel, Utensils, ChevronLeft, ChevronRight } from "lucide-react"
import { format, addDays, differenceInDays, isWithinInterval, isBefore, isSameDay } from "date-fns"
import { createBrowserClient } from "@supabase/ssr"
import { AnimatedButton } from "@/components/ui/animated-button"

interface Trip {
  id: string
  title: string
  slug: string
  location: string
  price_regular: number
  max_days?: number
  min_days_advance?: number
  packages?: Array<{
    id: string
    name: string
    description: string | null
    price: number
  }>
  add_ons?: Array<{
    id: string
    name: string
    description: string | null
    price: number
    price_type: string
  }>
  golf_courses?: any[]
  meal_options?: any[]
  transportation_options?: any[]
}

interface BookingFormProps {
  trip: Trip
  user: any
  profile: any
  preSelectedPackageId?: string
}

export function BookingForm({ trip, user, profile, preSelectedPackageId }: BookingFormProps) {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
  const [step, setStep] = useState(1)
  const [courseRounds, setCourseRounds] = useState<{ [key: string]: number }>({})
  const [roomType, setRoomType] = useState<string>("")
  const [selectedMeal, setSelectedMeal] = useState<string>("")
  const [selectedTransport, setSelectedTransport] = useState<string>("")
  const [additionalRequests, setAdditionalRequests] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(user)

  const packages = trip.packages || []
  const premiumPackage = packages.find((pkg: any) => pkg.name === "Premium") // Updated to look for new database names after migration
  const upgradePackage = packages.find((pkg: any) => pkg.name === "Upgrade") // Updated to look for new database names after migration

  const golfCourses = trip.golf_courses || []
  const mealOptions = trip.meal_options || []
  const transportationOptions = trip.transportation_options || []

  const includedMeal = mealOptions.find((meal: any) => meal.is_included)
  const includedTransport = transportationOptions.find((transport: any) => transport.is_included)

  const [selectedPlan, setSelectedPlan] = useState<string>(preSelectedPackageId || premiumPackage?.id || "")
  const [travelDateRange, setTravelDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  })

  const [currentMonth, setCurrentMonth] = useState(new Date())

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user: fetchedUser },
      } = await supabase.auth.getUser()
      if (fetchedUser) {
        setCurrentUser(fetchedUser)
      }
    }

    if (!user) {
      fetchUser()
    }

    if (includedMeal) {
      setSelectedMeal(includedMeal.id)
    }
    if (includedTransport) {
      setSelectedTransport(includedTransport.id)
    }
  }, [user, supabase.auth, includedMeal, includedTransport])

  const minAdvanceDays = trip.min_days_advance || 0
  const maxDays = trip.max_days || 14
  const minDate = addDays(new Date(), minAdvanceDays)

  const handleTravelDateSelect = (date: Date) => {
    if (isBefore(date, minDate)) return

    if (!travelDateRange.from || (travelDateRange.from && travelDateRange.to)) {
      setTravelDateRange({ from: date, to: undefined })
    } else {
      if (isBefore(date, travelDateRange.from)) {
        setTravelDateRange({ from: date, to: undefined })
      } else {
        const daysDiff = differenceInDays(date, travelDateRange.from) + 1
        if (daysDiff <= maxDays) {
          setTravelDateRange({ from: travelDateRange.from, to: date })
        } else {
          const maxEndDate = addDays(travelDateRange.from, maxDays - 1)
          setTravelDateRange({ from: travelDateRange.from, to: maxEndDate })
        }
      }
    }
  }

  const isTravelDate = (date: Date) => {
    if (!travelDateRange.from) return false
    if (!travelDateRange.to) return isSameDay(date, travelDateRange.from)
    return isWithinInterval(date, { start: travelDateRange.from, end: travelDateRange.to })
  }

  const handleCourseRoundChange = (courseId: string, rounds: number) => {
    setCourseRounds((prev) => ({
      ...prev,
      [courseId]: rounds,
    }))
  }

  const generateCalendarDays = (month: Date) => {
    const year = month.getFullYear()
    const monthIndex = month.getMonth()
    const firstDay = new Date(year, monthIndex, 1)
    const lastDay = new Date(year, monthIndex + 1, 0)
    const startPadding = (firstDay.getDay() + 6) % 7

    const days: (Date | null)[] = []
    for (let i = 0; i < startPadding; i++) {
      days.push(null)
    }
    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push(new Date(year, monthIndex, d))
    }
    return days
  }

  const renderCalendar = () => {
    const days = generateCalendarDays(currentMonth)
    const weekdays = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"]

    return (
      <div className="rounded-lg border border-border p-4">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{format(currentMonth, "MMMM yyyy")}</h3>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="mb-2 grid grid-cols-7 gap-1 text-center text-sm text-muted-foreground">
          {weekdays.map((day) => (
            <div key={day} className="py-1">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map((date, idx) => {
            if (!date) {
              return <div key={`empty-${idx}`} className="p-2" />
            }

            const isDisabled = isBefore(date, minDate)
            const isTravel = isTravelDate(date)
            const isStart = travelDateRange.from && isSameDay(date, travelDateRange.from)
            const isEnd = travelDateRange.to && isSameDay(date, travelDateRange.to)

            return (
              <button
                key={date.toISOString()}
                type="button"
                onClick={() => handleTravelDateSelect(date)}
                disabled={isDisabled}
                className={`
                  relative p-2 text-center text-sm transition-colors
                  ${isDisabled ? "cursor-not-allowed text-muted-foreground/40" : "cursor-pointer hover:bg-muted"}
                  ${isTravel ? "bg-[#274C77] text-white" : ""}
                  ${isStart ? "rounded-l" : ""}
                  ${isEnd ? "rounded-r" : ""}
                `}
              >
                {date.getDate()}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!currentUser) {
      alert("Please sign in to submit an inquiry")
      return
    }

    if (!travelDateRange.from || !travelDateRange.to) {
      alert("Please select your travel dates")
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

      const selectedMealOption = mealOptions.find((meal: any) => meal.id === selectedMeal)
      const mealOptionName = selectedMealOption?.is_included
        ? `${selectedMealOption.name} (Included)`
        : selectedMealOption?.name || "None"

      const selectedTransportOption = transportationOptions.find((transport: any) => transport.id === selectedTransport)
      const transportOptionName = selectedTransportOption?.is_included
        ? `${selectedTransportOption.name} (Included)`
        : selectedTransportOption?.name || "None"

      const response = await fetch("/api/inquiry", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tripId: trip.id,
          tripTitle: trip.title,
          customerName: profile?.display_name || currentUser?.email || "Unknown",
          customerEmail: profile?.email || currentUser?.email || "",
          packageName: `${packageName} - ${occupancyType}`,
          startDate,
          endDate,
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

      setStep(1)
      setTravelDateRange({ from: undefined, to: undefined })
      setCourseRounds({})
      setRoomType("")
      setSelectedMeal(includedMeal?.id || "")
      setSelectedTransport(includedTransport?.id || "")
      setAdditionalRequests("")
    } catch (error) {
      console.error("Error submitting inquiry:", error)
      alert("There was an error submitting your inquiry. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  const calculateTotal = () => {
    let total = 0

    const selectedPackage = packages.find((p: any) => p.id === selectedPlan)
    if (selectedPackage) total += Number(selectedPackage.price)

    // Golf courses
    Object.entries(courseRounds).forEach(([courseId, rounds]) => {
      if (rounds > 0) {
        const course = golfCourses.find((c: any) => c.id === courseId)
        if (course && !course.is_included) {
          total += Number(course.price_per_round) * rounds
        }
      }
    })

    const selectedMealOption = mealOptions.find((meal: any) => meal.id === selectedMeal)
    if (selectedMealOption && !selectedMealOption.is_included) {
      total += Number(selectedMealOption.price || 0)
    }

    const selectedTransportOption = transportationOptions.find((transport: any) => transport.id === selectedTransport)
    if (selectedTransportOption && !selectedTransportOption.is_included) {
      total += Number(selectedTransportOption.price || 0)
    }

    return total
  }

  const nextStep = () => setStep((s) => Math.min(s + 1, 6))
  const prevStep = () => setStep((s) => Math.max(s - 1, 1))

  const totalNights =
    travelDateRange.from && travelDateRange.to ? differenceInDays(travelDateRange.to, travelDateRange.from) : 0

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Progress Steps */}
      <div className="mb-8 flex items-center justify-between">
        {[1, 2, 3, 4, 5, 6].map((s) => (
          <div key={s} className="flex flex-1 items-center">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                step >= s ? "bg-[#274C77] text-white" : "bg-muted text-muted-foreground"
              }`}
            >
              {step > s ? <Check className="h-4 w-4" /> : s}
            </div>
            {s < 6 && <div className={`h-1 flex-1 ${step > s ? "bg-[#274C77]" : "bg-muted"}`} />}
          </div>
        ))}
      </div>

      {/* Step 1: Package Selection */}
      {step === 1 && (
        <Card>
          <CardHeader className="bg-[#274C77] text-white">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />1 Package Selection
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div>
                <Label className="text-base">Select Package</Label>
                <p className="mb-4 text-sm text-muted-foreground">
                  Choose between Premium or Upgrade packages for your trip
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {premiumPackage && (
                  <div
                    onClick={() => setSelectedPlan(premiumPackage.id)}
                    className={`cursor-pointer rounded-lg border-2 p-4 transition-all ${
                      selectedPlan === premiumPackage.id ? "border-[#6096BA] bg-[#6096BA]/10" : "border-border"
                    }`}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="font-semibold">Premium</h3>
                      <span className="text-lg font-bold">${premiumPackage.price}</span>
                    </div>
                    {premiumPackage.description && (
                      <p className="text-sm text-muted-foreground">{premiumPackage.description}</p>
                    )}
                  </div>
                )}
                {upgradePackage && (
                  <div
                    onClick={() => setSelectedPlan(upgradePackage.id)}
                    className={`cursor-pointer rounded-lg border-2 p-4 transition-all ${
                      selectedPlan === upgradePackage.id ? "border-[#274C77] bg-[#274C77]/10" : "border-border"
                    }`}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="font-semibold">Upgrade</h3>
                      <span className="text-lg font-bold">${upgradePackage.price}</span>
                    </div>
                    {upgradePackage.description && (
                      <p className="text-sm text-muted-foreground">{upgradePackage.description}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Room Selection */}
      {step === 2 && (
        <Card>
          <CardHeader className="bg-[#274C77] text-white">
            <CardTitle className="flex items-center gap-2">
              <Hotel className="h-5 w-5" />2 Room Selection
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div>
                <Label className="text-base">Select Room Type</Label>
                <p className="mb-4 text-sm text-muted-foreground">Choose your preferred accommodation style</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div
                  onClick={() => setRoomType("double")}
                  className={`cursor-pointer rounded-lg border-2 p-4 transition-all ${
                    roomType === "double" ? "border-[#274C77] bg-[#274C77]/10" : "border-border"
                  }`}
                >
                  <h3 className="font-semibold">Double Occupancy</h3>
                  <p className="text-sm text-muted-foreground">Share a room with another guest</p>
                </div>
                <div
                  onClick={() => setRoomType("single")}
                  className={`cursor-pointer rounded-lg border-2 p-4 transition-all ${
                    roomType === "single" ? "border-[#274C77] bg-[#274C77]/10" : "border-border"
                  }`}
                >
                  <h3 className="font-semibold">Single Occupancy</h3>
                  <p className="text-sm text-muted-foreground">Private room for yourself</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Travel Duration */}
      {step === 3 && (
        <Card>
          <CardHeader className="bg-[#274C77] text-white">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />3 Travel Duration
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-6">
              <div>
                <Label className="text-base">Select Dates</Label>
                <p className="mb-2 text-sm text-muted-foreground">
                  Choose your travel dates. Maximum stay: {maxDays} nights
                </p>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                {renderCalendar()}

                <div className="space-y-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">Select Travel Dates</Label>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="h-4 w-8 bg-[#274C77]"></div>
                      <span className="text-sm">Travel Days</span>
                    </div>
                  </div>
                </div>
              </div>

              {travelDateRange.from && travelDateRange.to && (
                <div className="rounded-lg bg-muted/50 p-4">
                  <p className="font-medium">
                    Reservation for: {format(travelDateRange.from, "MMM d")} -{" "}
                    {format(travelDateRange.to, "MMM d, yyyy")}
                  </p>
                  <p className="text-sm text-muted-foreground">{totalNights} nights</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Golf Courses */}
      {step === 4 && (
        <Card>
          <CardHeader className="bg-[#274C77] text-white">
            <CardTitle className="flex items-center gap-2">4 Golf Courses</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div>
                <Label className="text-base">Select Courses & Rounds</Label>
                <p className="mb-4 text-sm text-muted-foreground">Choose which courses you'd like to play</p>
              </div>
              {golfCourses.length > 0 ? (
                <div className="space-y-4">
                  {golfCourses.map((course: any) => {
                    const isIncluded = course.is_included
                    return (
                      <div
                        key={course.id}
                        className={`flex items-center justify-between rounded-lg border p-4 ${
                          isIncluded ? "border-[#6096BA] bg-[#6096BA]/10" : "border-border"
                        }`}
                      >
                        <div>
                          <h4 className="font-medium">
                            {course.course_name}
                            {isIncluded && (
                              <span className="ml-2 rounded bg-[#6096BA] px-2 py-0.5 text-xs text-white">Included</span>
                            )}
                          </h4>
                          {!isIncluded && (
                            <p className="text-sm text-muted-foreground">${course.price_per_round} per round</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={isIncluded}
                            onClick={() =>
                              handleCourseRoundChange(course.id, Math.max(0, (courseRounds[course.id] || 0) - 1))
                            }
                          >
                            -
                          </Button>
                          <span className="w-8 text-center">{courseRounds[course.id] || 0}</span>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={isIncluded}
                            onClick={() =>
                              handleCourseRoundChange(
                                course.id,
                                Math.min(course.max_rounds || 10, (courseRounds[course.id] || 0) + 1),
                              )
                            }
                          >
                            +
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-muted-foreground">No golf courses configured for this trip.</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 5: Meals & Transport */}
      {step === 5 && (
        <Card>
          <CardHeader className="bg-[#274C77] text-white">
            <CardTitle className="flex items-center gap-2">
              <Utensils className="h-5 w-5" />5 Meals & Transport
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-8">
              {/* Meal Options */}
              <div className="space-y-4">
                <div>
                  <Label className="text-base">Meal Options</Label>
                  <p className="mb-4 text-sm text-muted-foreground">Select your preferred meal plan</p>
                </div>
                {mealOptions.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    {mealOptions.map((meal: any) => {
                      const isIncluded = meal.is_included
                      return (
                        <div
                          key={meal.id}
                          onClick={() => !isIncluded && setSelectedMeal(meal.id)}
                          className={`rounded-lg border-2 p-4 transition-all ${
                            isIncluded
                              ? "cursor-not-allowed border-[#6096BA] bg-[#6096BA]/10 opacity-70"
                              : selectedMeal === meal.id
                                ? "cursor-pointer border-[#274C77] bg-[#274C77]/10"
                                : "cursor-pointer border-border hover:border-muted-foreground"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">
                              {meal.name}
                              {isIncluded && (
                                <span className="ml-2 rounded bg-[#6096BA] px-2 py-0.5 text-xs text-white">
                                  Included
                                </span>
                              )}
                            </h4>
                            {selectedMeal === meal.id && <Check className="h-5 w-5 text-[#274C77]" />}
                          </div>
                          {meal.description && <p className="mt-1 text-sm text-muted-foreground">{meal.description}</p>}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No meal options configured for this trip.</p>
                )}
              </div>

              {/* Transportation Options */}
              <div className="space-y-4">
                <div>
                  <Label className="text-base">Transportation Options</Label>
                  <p className="mb-4 text-sm text-muted-foreground">Select your preferred transportation</p>
                </div>
                {transportationOptions.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    {transportationOptions.map((transport: any) => {
                      const isIncluded = transport.is_included
                      return (
                        <div
                          key={transport.id}
                          onClick={() => !isIncluded && setSelectedTransport(transport.id)}
                          className={`rounded-lg border-2 p-4 transition-all ${
                            isIncluded
                              ? "cursor-not-allowed border-[#6096BA] bg-[#6096BA]/10 opacity-70"
                              : selectedTransport === transport.id
                                ? "cursor-pointer border-[#274C77] bg-[#274C77]/10"
                                : "cursor-pointer border-border hover:border-muted-foreground"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">
                              {transport.name}
                              {isIncluded && (
                                <span className="ml-2 rounded bg-[#6096BA] px-2 py-0.5 text-xs text-white">
                                  Included
                                </span>
                              )}
                            </h4>
                            {selectedTransport === transport.id && <Check className="h-5 w-5 text-[#274C77]" />}
                          </div>
                          {transport.description && (
                            <p className="mt-1 text-sm text-muted-foreground">{transport.description}</p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No transportation options configured for this trip.</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 6: Review & Submit */}
      {step === 6 && (
        <Card>
          <CardHeader className="bg-[#274C77] text-white">
            <CardTitle>6 Review & Submit</CardTitle>
            <CardDescription className="text-white/80">Review your selections before submitting</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-6">
              {/* Summary */}
              <div className="space-y-4 rounded-lg bg-muted/30 p-4">
                <div className="flex justify-between">
                  <span>Package:</span>
                  <span className="font-medium">
                    {packages.find((p: any) => p.id === selectedPlan)?.name || "None"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Room Type:</span>
                  <span className="font-medium">{roomType === "double" ? "Double Occupancy" : "Single Occupancy"}</span>
                </div>
                {travelDateRange.from && travelDateRange.to && (
                  <div className="flex justify-between">
                    <span>Travel Dates:</span>
                    <span className="font-medium">
                      {format(travelDateRange.from, "MMM d")} - {format(travelDateRange.to, "MMM d, yyyy")}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Meal:</span>
                  <span className="font-medium">
                    {mealOptions.find((m: any) => m.id === selectedMeal)?.name || "None"}
                    {mealOptions.find((m: any) => m.id === selectedMeal)?.is_included && " (Included)"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Transportation:</span>
                  <span className="font-medium">
                    {transportationOptions.find((t: any) => t.id === selectedTransport)?.name || "None"}
                    {transportationOptions.find((t: any) => t.id === selectedTransport)?.is_included && " (Included)"}
                  </span>
                </div>
                <div className="border-t pt-4">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Estimated Total:</span>
                    <span>${calculateTotal().toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Additional Requests */}
              <div className="space-y-2">
                <Label>Additional Requests (Optional)</Label>
                <Textarea
                  value={additionalRequests}
                  onChange={(e) => setAdditionalRequests(e.target.value)}
                  placeholder="Any special requests or requirements..."
                  rows={3}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={prevStep} disabled={step === 1}>
          Previous
        </Button>
        {step < 6 ? (
          <Button type="button" onClick={nextStep} className="bg-[#274C77] hover:bg-[#274C77]/90">
            Next
          </Button>
        ) : (
          <AnimatedButton
            type="submit"
            disabled={submitting}
            startColor="#274C77"
            endColor="#1d3a5c"
            hoverText={submitting ? "Submitting..." : "Submitted!"}
          >
            {submitting ? "Submitting..." : "Submit Inquiry"}
          </AnimatedButton>
        )}
      </div>
    </form>
  )
}
