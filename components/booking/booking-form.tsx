"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  ChevronLeft,
  ChevronRight,
  Users,
  User,
  Check,
  Utensils,
  Car,
  Minus,
  Plus,
  X,
} from "lucide-react"
import {
  format,
  addDays,
  differenceInDays,
  isWithinInterval,
  isBefore,
  isSameDay,
} from "date-fns"
import { createClient } from "@/lib/supabase/client"
import Image from "next/image"

interface Trip {
  id: string
  title: string
  slug: string
  location: string
  price_regular: number
  max_days?: number
  min_days?: number
  min_days_advance?: number
  courses_photo_url?: string | null
  single_room_photo_url?: string | null
  double_room_photo_url?: string | null
  images?: Array<{
    image_url: string
    display_order: number
  }>
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

export function BookingForm({
  trip,
  user,
  profile,
  preSelectedPackageId,
}: BookingFormProps) {
  const supabase = createClient()

  const [courseRounds, setCourseRounds] = useState<{ [key: string]: number }>(
    {},
  )
  const [roomType, setRoomType] = useState<string>("")
  const [selectedMeal, setSelectedMeal] = useState<string>("")
  const [selectedTransport, setSelectedTransport] = useState<string>("")
  const [additionalRequests, setAdditionalRequests] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(user)
  const [galleryOpen, setGalleryOpen] = useState(false)
  const [galleryIndex, setGalleryIndex] = useState(0)

  const packages = trip.packages || []
  const premiumPackage = packages.find((pkg: any) => pkg.name === "Premium")
  const upgradePackage = packages.find((pkg: any) => pkg.name === "Upgrade")

  const golfCourses = trip.golf_courses || []
  const mealOptions = trip.meal_options || []
  const transportationOptions = trip.transportation_options || []

  const includedMeal = mealOptions.find((meal: any) => meal.is_included)
  const includedTransport = transportationOptions.find(
    (transport: any) => transport.is_included,
  )

  const [selectedPlan, setSelectedPlan] = useState<string>(
    preSelectedPackageId || premiumPackage?.id || "",
  )
  const [travelDateRange, setTravelDateRange] = useState<{
    from: Date | undefined
    to: Date | undefined
  }>({
    from: undefined,
    to: undefined,
  })
  const [currentMonth, setCurrentMonth] = useState(new Date())

  // Prioritize courses_photo_url, then use trip_images or other fallbacks
  const courseImages: Array<{ image_url: string; display_order: number }> = []
  if (trip.courses_photo_url) {
    courseImages.push({
      image_url: trip.courses_photo_url,
      display_order: 0,
    })
  }

  // Add trip_images after course photo
  const sortedTripImages =
    trip.images?.sort((a, b) => a.display_order - b.display_order) || []
  sortedTripImages.forEach((img, idx) => {
    courseImages.push({
      image_url: img.image_url,
      display_order: idx + 1,
    })
  })

  // Add room photos as additional fallbacks
  if (trip.double_room_photo_url) {
    courseImages.push({
      image_url: trip.double_room_photo_url,
      display_order: courseImages.length,
    })
  }
  if (trip.single_room_photo_url) {
    courseImages.push({
      image_url: trip.single_room_photo_url,
      display_order: courseImages.length,
    })
  }
  const tripImages = courseImages

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
  const minDays = trip.min_days || 1
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
        if (daysDiff >= minDays && daysDiff <= maxDays) {
          setTravelDateRange({ from: travelDateRange.from, to: date })
        } else if (daysDiff < minDays) {
          const minEndDate = addDays(travelDateRange.from, minDays - 1)
          setTravelDateRange({ from: travelDateRange.from, to: minEndDate })
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
    return isWithinInterval(date, {
      start: travelDateRange.from,
      end: travelDateRange.to,
    })
  }

  const handleCourseRoundChange = (courseId: string, delta: number) => {
    setCourseRounds((prev) => {
      const current = prev[courseId] || 0
      const newValue = Math.max(0, current + delta)
      return { ...prev, [courseId]: newValue }
    })
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
      const occupancyType =
        roomType === "double" ? "Double Occupancy" : "Single Occupancy"

      const courseDetails = Object.entries(courseRounds)
        .filter(([_, rounds]) => rounds > 0)
        .map(([courseId, rounds]) => {
          const course = golfCourses.find((c: any) => c.id === courseId)
          return course ? `${course.course_name} (${rounds} rounds)` : null
        })
        .filter(Boolean)

      const selectedMealOption = mealOptions.find(
        (meal: any) => meal.id === selectedMeal,
      )
      const mealOptionName = selectedMealOption?.is_included
        ? `${selectedMealOption.name} (Included)`
        : selectedMealOption?.name || "None"

      const selectedTransportOption = transportationOptions.find(
        (transport: any) => transport.id === selectedTransport,
      )
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
          customerName:
            profile?.display_name || currentUser?.email || "Unknown",
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

    // Note: Golf courses, meals, and transportation no longer have individual prices
    // All pricing is now included in the package price

    return total
  }

  const totalRounds = Object.values(courseRounds).reduce((sum, r) => sum + r, 0)

  const SectionHeader = ({
    number,
    title,
  }: {
    number: number
    title: string
  }) => (
    <div className="flex items-center bg-[#3D5A80]">
      <span className="flex h-full items-center justify-center bg-[#14184E] px-4 py-3 text-lg font-medium text-white">
        {number}
      </span>
      <h2 className="px-4 py-3 font-serif text-lg text-white">{title}</h2>
    </div>
  )

  const RadioOption = ({
    selected,
    onClick,
    children,
  }: {
    selected: boolean
    onClick: () => void
    children: React.ReactNode
  }) => (
    <div
      onClick={onClick}
      className={`cursor-pointer border bg-[#f5f5f5] px-4 py-3 transition-colors ${
        selected ? "border-[#3D5A80]" : "border-gray-200 hover:border-gray-300"
      }`}
    >
      <div className="flex items-center justify-between">
        {children}
        <div
          className={`ml-4 flex h-5 w-5 shrink-0 items-center justify-center border-2 ${
            selected ? "border-[#3D5A80] bg-[#3D5A80]" : "border-gray-300"
          }`}
        >
          {selected && <div className="h-2 w-2 bg-white" />}
        </div>
      </div>
    </div>
  )

  // Calendar renderer
  const renderCalendar = () => {
    const days = generateCalendarDays(currentMonth)
    const weekdays = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"]

    return (
      <div className="border border-border bg-white p-4">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold font-bitter">
            {format(currentMonth, "MMMM yyyy")}
          </h3>
          <div className="flex gap-1">
            <button
              type="button"
              className="p-1 hover:bg-muted"
              onClick={() =>
                setCurrentMonth(
                  new Date(
                    currentMonth.getFullYear(),
                    currentMonth.getMonth() - 1,
                  ),
                )
              }
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="p-1 hover:bg-muted"
              onClick={() =>
                setCurrentMonth(
                  new Date(
                    currentMonth.getFullYear(),
                    currentMonth.getMonth() + 1,
                  ),
                )
              }
            >
              <ChevronRight className="h-4 w-4" />
            </button>
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
            const isStart =
              travelDateRange.from && isSameDay(date, travelDateRange.from)
            const isEnd =
              travelDateRange.to && isSameDay(date, travelDateRange.to)

            return (
              <button
                key={date.toISOString()}
                type="button"
                onClick={() => handleTravelDateSelect(date)}
                disabled={isDisabled}
                className={`
                  relative p-2 text-center text-sm transition-colors
                  ${
                    isDisabled
                      ? "cursor-not-allowed text-muted-foreground/40"
                      : "cursor-pointer hover:bg-muted"
                  }
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

  const selectedPackage = packages.find((p: any) => p.id === selectedPlan)
  const selectedMealOption = mealOptions.find(
    (meal: any) => meal.id === selectedMeal,
  )
  const selectedTransportOption = transportationOptions.find(
    (transport: any) => transport.id === selectedTransport,
  )

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex flex-col gap-16 lg:flex-row">
        {/* Left Column - Form Sections */}
        <div className="flex-1 space-y-8">
          <h1 className="font-bitter text-[40px] font-bold leading-tight text-foreground">
            Make A Reservation
          </h1>

          {/* Section 1: Select Your Plan */}
          <div className="overflow-hidden">
            <SectionHeader number={1} title="Select Your Plan" />
            <div className="mt-6 space-y-4">
              {packages.map((pkg) => (
                <RadioOption
                  key={pkg.id}
                  selected={selectedPlan === pkg.id}
                  onClick={() => setSelectedPlan(pkg.id)}
                >
                  <div className="flex-1">
                    <h3 className="font-serif text-xl font-medium">
                      {pkg.name}
                    </h3>
                    {pkg.description && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {pkg.description}
                      </p>
                    )}
                  </div>
                  <span className="mr-4 text-2xl font-medium">
                    ${pkg.price}
                  </span>
                </RadioOption>
              ))}
            </div>
          </div>

          {/* Section 2: Select Room Type */}
          <div className="overflow-hidden">
            <SectionHeader number={2} title="Select Room Type" />
            <div className="mt-6 space-y-4">
              <RadioOption
                selected={roomType === "double"}
                onClick={() => setRoomType("double")}
              >
                <div className="flex items-start gap-3">
                  <Users className="mt-0.5 h-5 w-5 text-muted-foreground" />
                  <div>
                    <h3 className="font-serif text-xl font-medium">
                      Double Occupancy
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Share a room with another guest for a more economical
                      option
                    </p>
                  </div>
                </div>
              </RadioOption>

              <RadioOption
                selected={roomType === "single"}
                onClick={() => setRoomType("single")}
              >
                <div className="flex items-start gap-3">
                  <User className="mt-0.5 h-5 w-5 text-muted-foreground" />
                  <div>
                    <h3 className="font-serif text-xl font-medium">
                      Single Occupancy
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Private room for yourself for maximum comfort and privacy
                    </p>
                  </div>
                </div>
              </RadioOption>
            </div>
          </div>

          {/* Section 3: Travel Duration */}
          <div className="overflow-hidden">
            <SectionHeader number={3} title="Travel Duration" />
            <div className="py-6">
              <div className="mb-1">
                <Label className="text-base font-medium">Select Dates</Label>
                <p className="mt-1 text-sm text-muted-foreground">
                  Choose your travel dates for your golf experience
                </p>
                <p className="mt-1 text-sm text-muted-foreground italic">
                  Maximum stay: {maxDays} nights
                </p>
              </div>

              <div className="mt-4 flex flex-col gap-6 lg:flex-row">
                {renderCalendar()}

                <div className="flex flex-col justify-start">
                  <Label className="mb-2 text-sm text-muted-foreground">
                    Select Travel Dates
                  </Label>
                  <div className="flex items-center gap-2">
                    <div className="h-[45px] w-[45px] bg-[#3D5A80]" />
                    <span className="font-bitter border border-border bg-white px-4 py-2 text-sm font-medium">
                      Travel Days
                    </span>
                  </div>
                </div>
              </div>

              {travelDateRange.from && travelDateRange.to && (
                <div className="mt-4 border-2 border-gray-200 bg-gray-50 px-8 py-3 w-fit">
                  <span className="text-sm">
                    Reservation for:{" "}
                    <strong className="font-bitter">
                      {format(travelDateRange.from, "MMM d")} –{" "}
                      {format(travelDateRange.to, "MMM d, yyyy")}
                    </strong>
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Section 4: Golf Courses & Rounds */}
          {golfCourses.length > 0 && (
            <div className="overflow-hidden">
              <SectionHeader number={4} title="Golf Courses & Rounds" />
              <div className="py-6">
                <div className="mb-4">
                  <Label className="text-base font-medium">
                    Select Courses
                  </Label>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Choose the golf courses you'd like to play during your trip
                  </p>
                </div>

                <div className="mb-6 space-y-3">
                  {golfCourses.map((course: any) => {
                    const isSelected = (courseRounds[course.id] || 0) > 0
                    return (
                      <div
                        key={course.id}
                        onClick={() => {
                          if (!isSelected) {
                            handleCourseRoundChange(course.id, 1)
                          }
                        }}
                        className={`cursor-pointer border-2 px-6 py-4 transition-colors ${
                          isSelected
                            ? "border-[#3D5A80]"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-serif text-lg font-medium">
                            {course.course_name}
                          </span>
                          <div
                            className={`flex h-6 w-6 items-center justify-center border-2 ${
                              isSelected
                                ? "border-[#3D5A80] bg-[#3D5A80]"
                                : "border-gray-300"
                            }`}
                          >
                            {isSelected && (
                              <div className="h-2.5 w-2.5 bg-white" />
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div className="mt-6">
                  <Label className="text-base font-medium">Select Rounds</Label>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Choose how many rounds you'd like to play at each selected
                    course
                  </p>
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const firstCourseId = golfCourses[0]?.id
                      if (firstCourseId && totalRounds > 0) {
                        const courseWithRounds = Object.entries(
                          courseRounds,
                        ).find(([_, r]) => r > 0)
                        if (courseWithRounds)
                          handleCourseRoundChange(courseWithRounds[0], -1)
                      }
                    }}
                    className="flex h-10 w-10 items-center justify-center border-2 border-gray-200 hover:bg-gray-50"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="flex h-10 w-10 items-center justify-center border-y-2 border-gray-200 text-lg font-medium">
                    {totalRounds}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const firstSelectedCourse = Object.entries(
                        courseRounds,
                      ).find(([_, r]) => r > 0)
                      if (firstSelectedCourse)
                        handleCourseRoundChange(firstSelectedCourse[0], 1)
                    }}
                    className="flex h-10 w-10 items-center justify-center border-2 border-gray-200 hover:bg-gray-50"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-4 border-2 border-gray-200 bg-gray-50 px-6 py-3">
                  <span className="text-sm">
                    Number of Rounds: {totalRounds}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Section 5: Meals */}
          {mealOptions.length > 0 && (
            <div className="overflow-hidden">
              <SectionHeader number={5} title="Meals" />
              <div className="mt-6 space-y-4">
                {mealOptions.map((meal: any) => (
                  <RadioOption
                    key={meal.id}
                    selected={selectedMeal === meal.id}
                    onClick={() => setSelectedMeal(meal.id)}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-serif text-lg font-medium">
                        {meal.name}
                        {meal.is_included && " (Recommended)"}
                      </span>
                      {meal.is_included && (
                        <Utensils className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </RadioOption>
                ))}
              </div>
            </div>
          )}

          {/* Section 6: Transportation */}
          {transportationOptions.length > 0 && (
            <div className="overflow-hidden">
              <SectionHeader number={6} title="Transportation" />
              <div className="mt-6 space-y-4">
                {transportationOptions.map((transport: any) => (
                  <RadioOption
                    key={transport.id}
                    selected={selectedTransport === transport.id}
                    onClick={() => setSelectedTransport(transport.id)}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-serif text-lg font-medium">
                        {transport.name}
                        {transport.is_included && " (Recommended)"}
                      </span>
                      {transport.is_included && (
                        <Car className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </RadioOption>
                ))}
              </div>
            </div>
          )}

          {/* Section 7: Additional Requests */}
          <div className="overflow-hidden">
            <SectionHeader number={7} title="Additional Requests" />
            <div className="py-6">
              <p className="mb-4 text-sm text-muted-foreground">
                Let us know if you have any special requests or requirements for
                your trip
              </p>
              <Textarea
                value={additionalRequests}
                onChange={(e) => setAdditionalRequests(e.target.value)}
                placeholder="Lorem ipsum dolor..."
                className="min-h-[100px] border-2 border-gray-200 bg-gray-50"
              />
            </div>
          </div>
        </div>

        {/* Right Column - Confirmation Sidebar */}
        <div className="lg:w-80">
          <div className="sticky top-24">
            {/* Confirmation Card */}
            <div className="border border-x-3 border-b-3 border-[#3D5A80]">
              <div className="relative flex">
                <div className="absolute left-[-3px] top-0 h-[45px] w-[48px] bg-[#14184E] z-10" />
                <div className="flex-1 bg-[#3D5A80] px-4 h-[45px] flex items-center pl-[60px]">
                  <h3 className="font-serif text-lg text-white">
                    Confirmation
                  </h3>
                </div>
              </div>
              <div className="bg-white p-5">
                <div className="space-y-3 text-sm">
                  {travelDateRange.from && travelDateRange.to && (
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">
                        Reservation for: {format(travelDateRange.from, "MMM d")}{" "}
                        – {format(travelDateRange.to, "MMM d")}
                      </span>
                      <Check className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}

                  {roomType && (
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">
                        {roomType === "single"
                          ? "Single Occupancy"
                          : "Double Occupancy"}
                      </span>
                      <Check className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}

                  {Object.entries(courseRounds)
                    .filter(([_, rounds]) => rounds > 0)
                    .map(([courseId, rounds]) => {
                      const course = golfCourses.find(
                        (c: any) => c.id === courseId,
                      )
                      return course ? (
                        <div key={courseId} className="flex items-center gap-2">
                          <span className="text-muted-foreground">
                            {course.course_name}
                          </span>
                          <Check className="h-4 w-4 text-muted-foreground" />
                        </div>
                      ) : null
                    })}

                  {totalRounds > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">
                        {totalRounds} Rounds
                      </span>
                      <Check className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}

                  {selectedTransportOption && (
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">
                        {selectedTransportOption.name}
                      </span>
                      <Check className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}

                  {selectedMealOption && (
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">
                        {selectedMealOption.name}
                      </span>
                      <Check className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-4">
                  <div className="flex items-baseline gap-1 font-serif text-xl">
                    <span>Total:</span>
                    <span>${calculateTotal()}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="mt-4 w-full text-xl bg-[#14184E] py-3 font-medium text-white transition-colors hover:bg-[#0d0f38] disabled:opacity-50"
                >
                  {submitting ? "Submitting..." : "Book Now"}
                </button>
              </div>
            </div>

            {/* Trip Images */}
            {tripImages.length > 0 && (
              <div className="mt-6">
                <div className="flex gap-3">
                  {/* Main large image */}
                  <div className="relative aspect-[4/3] flex-1 overflow-hidden">
                    <Image
                      src={tripImages[0]?.image_url || "/placeholder.svg"}
                      alt={trip.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  {/* Stacked thumbnails on the right */}
                  {tripImages.length > 1 && (
                    <div className="flex w-20 flex-col gap-3">
                      {tripImages.slice(1, 3).map((img, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            if (idx === 1 && tripImages.length > 2) {
                              setGalleryIndex(0)
                              setGalleryOpen(true)
                            }
                          }}
                          className="relative aspect-square w-full overflow-hidden"
                        >
                          <Image
                            src={img.image_url || "/placeholder.svg"}
                            alt={`${trip.title} ${idx + 2}`}
                            fill
                            className="object-cover"
                          />
                          {idx === 1 && tripImages.length > 2 && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                              <span className="text-sm font-medium text-white">
                                + {tripImages.length - 2} Photos
                              </span>
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="mt-4">
                  <p className="text-sm italic text-muted-foreground">
                    {roomType === "single"
                      ? "Single Occupancy Room"
                      : "Double Occupancy Room"}
                  </p>
                  <p className="font-serif text-lg font-medium">
                    {trip.location}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {galleryOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setGalleryOpen(false)}
        >
          <div
            className="relative h-full w-full flex items-center justify-center p-4 sm:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              type="button"
              onClick={() => setGalleryOpen(false)}
              className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition-all hover:bg-white/20 hover:scale-110 sm:right-8 sm:top-8"
              aria-label="Close gallery"
            >
              <X className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>

            {/* Main image container */}
            <div className="relative w-full max-w-6xl">
              <div className="relative aspect-[16/10] w-full overflow-hidden rounded-lg shadow-2xl">
                <Image
                  src={
                    tripImages[galleryIndex]?.image_url || "/placeholder.svg"
                  }
                  alt={`${trip.title} ${galleryIndex + 1}`}
                  fill
                  className="object-contain"
                  priority
                />
              </div>

              {/* Navigation arrows */}
              {tripImages.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setGalleryIndex((prev) =>
                        prev === 0 ? tripImages.length - 1 : prev - 1,
                      )
                    }
                    className="absolute left-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition-all hover:bg-white/20 hover:scale-110 sm:left-4 sm:h-12 sm:w-12"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setGalleryIndex((prev) =>
                        prev === tripImages.length - 1 ? 0 : prev + 1,
                      )
                    }
                    className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition-all hover:bg-white/20 hover:scale-110 sm:right-4 sm:h-12 sm:w-12"
                    aria-label="Next image"
                  >
                    <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
                  </button>
                </>
              )}

              {/* Image counter and title */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4 sm:p-6">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-sm text-white/80 sm:text-base">
                      {trip.title}
                    </p>
                    <p className="text-xs text-white/60 sm:text-sm">
                      {trip.location}
                    </p>
                  </div>
                  <div className="rounded-full bg-black/40 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm sm:px-4 sm:py-2 sm:text-sm">
                    {galleryIndex + 1} / {tripImages.length}
                  </div>
                </div>
              </div>

              {/* Thumbnail strip for desktop */}
              {tripImages.length > 1 && (
                <div className="mt-4 hidden sm:flex gap-2 justify-center overflow-x-auto pb-2">
                  {tripImages.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setGalleryIndex(idx)}
                      className={`relative h-16 w-24 flex-shrink-0 overflow-hidden rounded transition-all ${
                        idx === galleryIndex
                          ? "ring-2 ring-white ring-offset-2 ring-offset-black/50 scale-105"
                          : "opacity-60 hover:opacity-100"
                      }`}
                    >
                      <Image
                        src={img.image_url || "/placeholder.svg"}
                        alt={`Thumbnail ${idx + 1}`}
                        fill
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </form>
  )
}
