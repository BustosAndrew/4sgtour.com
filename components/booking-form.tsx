"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { format, differenceInDays, addDays } from "date-fns"
import { CalendarIcon, Minus, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Trip } from "@/lib/types/database"

interface BookingFormProps {
  trip: Trip & { images?: Array<{ image_url: string }> }
  userType: string
}

export function BookingForm({ trip, userType }: BookingFormProps) {
  const [roomType, setRoomType] = useState<"single" | "double">("double")
  const [startDate, setStartDate] = useState<Date>()
  const [endDate, setEndDate] = useState<Date>()
  const [selectedCourses, setSelectedCourses] = useState<string[]>([])
  const [numRounds, setNumRounds] = useState(2)
  const [includesBreakfast, setIncludesBreakfast] = useState(trip.includes_breakfast)
  const [includesTransport, setIncludesTransport] = useState(trip.includes_transport)
  const [additionalRequests, setAdditionalRequests] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const basePrice = trip.price_regular

  const coursesPrice = selectedCourses.reduce((sum, courseName) => {
    const course = (trip.available_courses as Array<{ name: string; price: number }>).find((c) => c.name === courseName)
    return sum + (course?.price || 0)
  }, 0)

  const roundsPrice = numRounds * 20
  const roomPrice = roomType === "single" ? basePrice * 1.5 : basePrice
  const totalPrice = roomPrice + coursesPrice + roundsPrice

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    if (!startDate || !endDate) {
      setError("Please select travel dates")
      setIsLoading(false)
      return
    }

    const supabase = createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push("/auth/login")
      return
    }

    try {
      const { error: bookingError } = await supabase.from("bookings").insert({
        user_id: user.id,
        trip_id: trip.id,
        start_date: format(startDate, "yyyy-MM-dd"),
        end_date: format(endDate, "yyyy-MM-dd"),
        num_guests: roomType === "double" ? 2 : 1,
        room_type: roomType,
        selected_courses: selectedCourses.map((name) => {
          const course = (trip.available_courses as Array<{ name: string; price: number }>).find((c) => c.name === name)
          return { name, price: course?.price || 0 }
        }),
        num_rounds: numRounds,
        includes_breakfast: includesBreakfast,
        includes_transport: includesTransport,
        additional_requests: additionalRequests || null,
        total_price: totalPrice,
        status: "pending",
      })

      if (bookingError) throw bookingError

      router.push("/bookings?success=true")
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCourseToggle = (courseName: string) => {
    setSelectedCourses((prev) =>
      prev.includes(courseName) ? prev.filter((c) => c !== courseName) : [...prev, courseName],
    )
  }

  const nights = startDate && endDate ? differenceInDays(endDate, startDate) : 0

  return (
    <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-3">
      <div className="space-y-8 lg:col-span-2">
        {/* Step 1: Room Type */}
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-accent text-sm font-semibold">1</div>
            <h2 className="text-lg font-semibold">Select Room Type</h2>
          </div>
          <RadioGroup value={roomType} onValueChange={(value) => setRoomType(value as "single" | "double")}>
            <div className="space-y-3">
              <div className="flex items-start gap-3 rounded-lg border border-border p-4">
                <RadioGroupItem value="double" id="double" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="double" className="cursor-pointer font-semibold">
                    Double Occupancy 👥
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt
                  </p>
                  <p className="mt-2 font-semibold">${basePrice.toFixed(2)}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-lg border border-border p-4">
                <RadioGroupItem value="single" id="single" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="single" className="cursor-pointer font-semibold">
                    Single Occupancy 👤
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt
                  </p>
                  <p className="mt-2 font-semibold">${(basePrice * 1.5).toFixed(2)}</p>
                </div>
              </div>
            </div>
          </RadioGroup>
        </div>

        {/* Step 2: Travel Duration */}
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-accent text-sm font-semibold">2</div>
            <h2 className="text-lg font-semibold">Travel Duration</h2>
          </div>
          <div className="space-y-4">
            <div>
              <Label>Select Dates</Label>
              <p className="text-sm text-muted-foreground">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
              </p>
              <p className="mt-2 text-sm text-muted-foreground">Maximum stay: {trip.duration_nights} nights</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Check-in Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !startDate && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={(date) => {
                        setStartDate(date)
                        if (date && (!endDate || endDate <= date)) {
                          setEndDate(addDays(date, trip.duration_nights))
                        }
                      }}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label>Check-out Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn("w-full justify-start text-left font-normal", !endDate && "text-muted-foreground")}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      disabled={(date) => !startDate || date <= startDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            {startDate && endDate && (
              <div className="rounded-lg bg-muted p-4">
                <p className="text-sm">
                  Reservation for:{" "}
                  <span className="font-semibold">
                    {format(startDate, "MMM d")} – {format(endDate, "MMM d, yyyy")}
                  </span>
                </p>
                <p className="text-sm">
                  Duration: <span className="font-semibold">{nights} nights</span>
                </p>
                <p className="text-sm font-semibold">${(nights * 10).toFixed(2)}</p>
              </div>
            )}
          </div>
        </div>

        {/* Step 3: Golf Courses & Rounds */}
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-accent text-sm font-semibold">3</div>
            <h2 className="text-lg font-semibold">Golf Courses & Rounds</h2>
          </div>
          <div className="space-y-4">
            <div>
              <Label>Select Courses</Label>
              <p className="text-sm text-muted-foreground">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt
              </p>
            </div>
            <div className="space-y-2">
              {(trip.available_courses as Array<{ name: string; price: number }>).map((course) => (
                <div
                  key={course.name}
                  className="flex items-center justify-between rounded-lg border border-border p-4"
                >
                  <div className="flex items-center gap-3">
                    <Checkbox
                      id={course.name}
                      checked={selectedCourses.includes(course.name)}
                      onCheckedChange={() => handleCourseToggle(course.name)}
                    />
                    <Label htmlFor={course.name} className="cursor-pointer font-medium">
                      {course.name}
                    </Label>
                  </div>
                  <span className="font-semibold">${course.price.toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="mt-6">
              <Label>Select Rounds</Label>
              <p className="text-sm text-muted-foreground">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt
              </p>
              <div className="mt-4 flex items-center gap-4">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setNumRounds(Math.max(1, numRounds - 1))}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="text-2xl font-semibold">{numRounds}</span>
                <Button type="button" variant="outline" size="icon" onClick={() => setNumRounds(numRounds + 1)}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <p className="mt-2 text-sm">
                Number of Rounds: <span className="font-semibold">{numRounds}</span>
              </p>
              <p className="text-sm font-semibold">${roundsPrice.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Step 4: Meals */}
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-accent text-sm font-semibold">4</div>
            <h2 className="text-lg font-semibold">Meals</h2>
          </div>
          <RadioGroup
            value={includesBreakfast ? "included" : "not-included"}
            onValueChange={(value) => setIncludesBreakfast(value === "included")}
          >
            <div className="space-y-3">
              <div className="flex items-center gap-3 rounded-lg border border-border p-4">
                <RadioGroupItem value="included" id="breakfast-included" />
                <Label htmlFor="breakfast-included" className="cursor-pointer font-medium">
                  Breakfast Included (Recommended) 🍳
                </Label>
              </div>
              <div className="flex items-center gap-3 rounded-lg border border-border p-4">
                <RadioGroupItem value="not-included" id="breakfast-not-included" />
                <Label htmlFor="breakfast-not-included" className="cursor-pointer font-medium">
                  Breakfast not Included
                </Label>
              </div>
            </div>
          </RadioGroup>
        </div>

        {/* Step 5: Transportation */}
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-accent text-sm font-semibold">5</div>
            <h2 className="text-lg font-semibold">Transportation</h2>
          </div>
          <RadioGroup
            value={includesTransport ? "private" : "self"}
            onValueChange={(value) => setIncludesTransport(value === "private")}
          >
            <div className="space-y-3">
              <div className="flex items-center gap-3 rounded-lg border border-border p-4">
                <RadioGroupItem value="private" id="private-car" />
                <Label htmlFor="private-car" className="cursor-pointer font-medium">
                  Private Car with Driver (Recommended) 🚗
                </Label>
              </div>
              <div className="flex items-center gap-3 rounded-lg border border-border p-4">
                <RadioGroupItem value="self" id="drive-yourself" />
                <Label htmlFor="drive-yourself" className="cursor-pointer font-medium">
                  Drive Yourself
                </Label>
              </div>
            </div>
          </RadioGroup>
        </div>

        {/* Step 6: Additional Requests */}
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-accent text-sm font-semibold">6</div>
            <h2 className="text-lg font-semibold">Additional Requests</h2>
          </div>
          <div>
            <Label htmlFor="requests">Special requests or requirements</Label>
            <Textarea
              id="requests"
              placeholder="Lorem ipsum dolor..."
              value={additionalRequests}
              onChange={(e) => setAdditionalRequests(e.target.value)}
              className="mt-2 min-h-[100px]"
            />
          </div>
        </div>

        {error && <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive">{error}</div>}
      </div>

      {/* Confirmation Summary */}
      <div className="lg:col-span-1">
        <div className="sticky top-24 rounded-lg border border-border bg-card p-6">
          <h3 className="mb-4 text-lg font-semibold">Confirmation</h3>
          <div className="space-y-3 text-sm">
            {startDate && endDate && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Reservation for: {format(startDate, "MMM d")} – {format(endDate, "MMM d, yyyy")}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">{roomType === "single" ? "Single" : "Double"} Occupancy ✓</span>
              <span className="font-semibold">${roomPrice.toFixed(2)}</span>
            </div>
            {selectedCourses.map((courseName) => {
              const course = (trip.available_courses as Array<{ name: string; price: number }>).find(
                (c) => c.name === courseName,
              )
              return (
                <div key={courseName} className="flex justify-between">
                  <span className="text-muted-foreground">{courseName} ✓</span>
                  <span className="font-semibold">${course?.price.toFixed(2)}</span>
                </div>
              )
            })}
            <div className="flex justify-between">
              <span className="text-muted-foreground">{numRounds} Rounds ✓</span>
              <span className="font-semibold">${roundsPrice.toFixed(2)}</span>
            </div>
            {includesTransport && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Private Car with Driver ✓</span>
              </div>
            )}
            {includesBreakfast && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Breakfast Included ✓</span>
              </div>
            )}
            <div className="border-t border-border pt-3">
              <div className="flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span>${totalPrice.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <Button type="submit" className="mt-6 w-full" disabled={isLoading || !startDate || !endDate}>
            {isLoading ? "Processing..." : "Book Now"}
          </Button>

          {/* Trip Preview */}
          <div className="mt-6 space-y-4 border-t border-border pt-6">
            <div className="space-y-2">
              <p className="text-sm font-medium">{roomType === "single" ? "Single" : "Double"} Occupancy Room</p>
              <h4 className="font-semibold">{trip.title}</h4>
            </div>
            {trip.images && trip.images[0] && (
              <img
                src={trip.images[0].image_url || "/placeholder.svg"}
                alt={trip.title}
                className="h-32 w-full rounded-lg object-cover"
              />
            )}
            <p className="text-sm text-muted-foreground">{trip.location}</p>
          </div>
        </div>
      </div>
    </form>
  )
}
