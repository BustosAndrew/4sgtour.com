"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Calendar } from "@/components/ui/calendar"
import { Users, User, Minus, Plus } from "lucide-react"
import type { WeTravelPackage, WeTravelOption } from "@/lib/wetravel/types"

interface BookingFormProps {
  trip: any
}

export function BookingForm({ trip }: BookingFormProps) {
  const [packages, setPackages] = useState<WeTravelPackage[]>([])
  const [options, setOptions] = useState<WeTravelOption[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false) // Added loading state for payment link creation

  // Form state
  const [selectedPackage, setSelectedPackage] = useState<string>("")
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  })
  const [selectedCourses, setSelectedCourses] = useState<string[]>([])
  const [rounds, setRounds] = useState(2)
  const [selectedMeal, setSelectedMeal] = useState<string>("")
  const [selectedTransport, setSelectedTransport] = useState<string>("")
  const [additionalRequests, setAdditionalRequests] = useState("")

  useEffect(() => {
    async function fetchData() {
      try {
        const [packagesRes, optionsRes] = await Promise.all([
          fetch(`/api/trips/${trip.wetravel_uuid}/packages`),
          fetch(`/api/trips/${trip.wetravel_uuid}/options`),
        ])

        const packagesData = await packagesRes.json()
        const optionsData = await optionsRes.json()

        setPackages(packagesData.data || [])
        setOptions(optionsData.data || [])
      } catch (error) {
        console.error("[v0] Error fetching trip data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [trip.wetravel_uuid])

  // Calculate total price
  const calculateTotal = () => {
    let total = 0

    // Package price
    const pkg = packages.find((p) => p.id === selectedPackage)
    if (pkg) total += pkg.price

    // Course prices
    selectedCourses.forEach((courseId) => {
      const course = options.find((o) => o.id === courseId)
      if (course) total += course.price
    })

    // Rounds price
    const roundsOption = options.find((o) => o.name.toLowerCase().includes("round"))
    if (roundsOption) total += roundsOption.price * rounds

    // Meal price
    const meal = options.find((o) => o.id === selectedMeal)
    if (meal) total += meal.price

    // Transport price
    const transport = options.find((o) => o.id === selectedTransport)
    if (transport) total += transport.price

    return total
  }

  const handleBookNow = async () => {
    if (!dateRange.from || !dateRange.to) {
      alert("Please select travel dates")
      return
    }

    if (!selectedPackage) {
      alert("Please select a room type")
      return
    }

    setCreating(true)

    try {
      const total = calculateTotal()

      // Format dates for API
      const startDate = dateRange.from.toISOString().split("T")[0]
      const endDate = dateRange.to.toISOString().split("T")[0]

      // Create payment link
      const response = await fetch("/api/payment-link/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: trip.title,
          startDate,
          endDate,
          totalPrice: total,
          currency: "USD",
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to create payment link")
      }

      const data = await response.json()

      console.log("[v0] Payment link created:", data)

      // Redirect to WeTravel payment page
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl
      }
    } catch (error) {
      console.error("[v0] Error creating payment link:", error)
      alert("Failed to create booking. Please try again.")
    } finally {
      setCreating(false)
    }
  }

  if (loading) {
    return <div className="py-8 text-center">Loading booking options...</div>
  }

  // Categorize options
  const courseOptions = options.filter((o) => o.name.toLowerCase().includes("course"))
  const mealOptions = options.filter(
    (o) => o.name.toLowerCase().includes("breakfast") || o.name.toLowerCase().includes("meal"),
  )
  const transportOptions = options.filter(
    (o) => o.name.toLowerCase().includes("car") || o.name.toLowerCase().includes("transport"),
  )

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
            {packages.map((pkg) => (
              <Card key={pkg.id} className="relative cursor-pointer p-4 transition-colors hover:bg-accent">
                <RadioGroupItem value={pkg.id} id={pkg.id} className="absolute right-4 top-4" />
                <label htmlFor={pkg.id} className="flex cursor-pointer items-start gap-3">
                  {pkg.name.toLowerCase().includes("double") ? (
                    <Users className="mt-1 h-5 w-5" />
                  ) : (
                    <User className="mt-1 h-5 w-5" />
                  )}
                  <div className="flex-1">
                    <div className="font-bold">{pkg.name}</div>
                    <div className="text-sm text-muted-foreground">{pkg.description}</div>
                  </div>
                  <div className="text-right font-bold">${pkg.price}</div>
                </label>
              </Card>
            ))}
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
                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt
              </p>
              <div className="flex gap-4">
                <div className="flex-1">
                  <Calendar
                    mode="range"
                    selected={dateRange}
                    onSelect={(range: any) => setDateRange(range || { from: undefined, to: undefined })}
                    className="rounded-md border"
                  />
                </div>
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
          <div className="space-y-6">
            <div>
              <h3 className="mb-2 font-medium">Select Courses</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt
              </p>
              <div className="space-y-2">
                {courseOptions.map((course) => (
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
              <p className="mb-4 text-sm text-muted-foreground">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt
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
          <RadioGroup value={selectedMeal} onValueChange={setSelectedMeal} className="space-y-2">
            {mealOptions.map((meal) => (
              <Card key={meal.id} className="relative cursor-pointer p-4 transition-colors hover:bg-accent">
                <RadioGroupItem value={meal.id} id={meal.id} className="absolute right-4 top-4" />
                <label htmlFor={meal.id} className="flex cursor-pointer items-center justify-between">
                  <span className="font-medium">{meal.name}</span>
                  {meal.price > 0 && <span className="font-bold">${meal.price}</span>}
                </label>
              </Card>
            ))}
          </RadioGroup>
        </Card>

        {/* Step 5: Transportation */}
        <Card className="bg-[#E8DCC4] p-6">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-[#C9B896] text-sm font-bold">5</div>
            <h2 className="text-lg font-bold">Transportation</h2>
          </div>
          <RadioGroup value={selectedTransport} onValueChange={setSelectedTransport} className="space-y-2">
            {transportOptions.map((transport) => (
              <Card key={transport.id} className="relative cursor-pointer p-4 transition-colors hover:bg-accent">
                <RadioGroupItem value={transport.id} id={transport.id} className="absolute right-4 top-4" />
                <label htmlFor={transport.id} className="flex cursor-pointer items-center justify-between">
                  <span className="font-medium">{transport.name}</span>
                  {transport.price > 0 && <span className="font-bold">${transport.price}</span>}
                </label>
              </Card>
            ))}
          </RadioGroup>
        </Card>

        {/* Step 6: Additional Requests */}
        <Card className="bg-[#E8DCC4] p-6">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-[#C9B896] text-sm font-bold">6</div>
            <h2 className="text-lg font-bold">Additional Requests</h2>
          </div>
          <Textarea
            placeholder="Lorem ipsum dolor..."
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
                <span className="text-muted-foreground">{packages.find((p) => p.id === selectedPackage)?.name}</span>
                <span>${packages.find((p) => p.id === selectedPackage)?.price}</span>
              </div>
            )}
            {selectedCourses.map((courseId) => {
              const course = options.find((o) => o.id === courseId)
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
                <span>${(options.find((o) => o.name.toLowerCase().includes("round"))?.price || 0) * rounds}</span>
              </div>
            )}
            {selectedMeal && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">{options.find((o) => o.id === selectedMeal)?.name}</span>
                <span>${options.find((o) => o.id === selectedMeal)?.price}</span>
              </div>
            )}
            {selectedTransport && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">{options.find((o) => o.id === selectedTransport)?.name}</span>
                <span>${options.find((o) => o.id === selectedTransport)?.price}</span>
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
            onClick={handleBookNow}
            disabled={creating || !dateRange.from || !dateRange.to || !selectedPackage}
          >
            {creating ? "Creating Booking..." : "Book Now"}
          </Button>
        </Card>

        {/* Trip Images */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          {trip.images?.slice(0, 4).map((img: any, idx: number) => (
            <div key={idx} className="aspect-square overflow-hidden rounded-lg bg-muted">
              <img src={img.image_url || "/placeholder.svg"} alt={trip.title} className="h-full w-full object-cover" />
            </div>
          ))}
        </div>

        <Card className="mt-4 bg-muted/50 p-4">
          <h3 className="font-bold">{trip.title}</h3>
          <p className="mt-2 text-sm text-muted-foreground">Location (Google Maps)</p>
        </Card>
      </div>
    </div>
  )
}
