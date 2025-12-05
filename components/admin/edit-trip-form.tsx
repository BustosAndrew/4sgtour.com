"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useRouter } from "next/navigation"
import {
  Upload,
  X,
  Plus,
  Trash2,
  ChevronRight,
  ChevronLeft,
} from "lucide-react"
import Image from "next/image"
import { Card } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"

interface EditTripFormProps {
  trip: {
    id: string
    title: string
    description: string | null
    location: string // Added location
    continent: string | null
    price_regular: number // Added price_regular
    max_guests: number // Added max_guests
    max_days?: number | null
    min_days?: number | null
    min_days_advance?: number | null
    courses_photo_url: string | null
    single_room_photo_url: string | null
    double_room_photo_url: string | null
    highlights?: string[]
    packages?: any[]
    golf_courses?: any[]
    meal_options?: any[]
    transportation_options?: any[]
  }
}

interface TripData {
  title: string
  description: string
  location: string
  continent: string
  price_regular: number
  max_guests: string
  max_days: string
  min_days_advance: string
  min_days: string
}

const CONTINENTS = [
  "Africa",
  "Asia",
  "Europe",
  "North America",
  "South America",
]

const STEPS = [
  {
    id: 1,
    title: "Trip Basics",
    description: "Title, description, and images",
  },
  { id: 2, title: "Packages", description: "Room types and accommodation" },
  {
    id: 3,
    title: "Trip Options",
    description: "Configure golf courses, meals, and transportation",
  },
  { id: 4, title: "Review & Submit", description: "Review and save changes" },
]

export function EditTripForm({ trip }: EditTripFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)

  const [formData, setFormData] = useState<TripData>({
    title: trip.title || "",
    description: trip.description || "",
    location: trip.location || "",
    continent: trip.continent || "",
    price_regular: trip.price_regular || 0,
    max_guests: trip.max_guests?.toString() || "20",
    max_days: trip.max_days?.toString() || "",
    min_days_advance: trip.min_days_advance?.toString() || "0",
    min_days: trip.min_days?.toString() || "1",
  })
  const [highlights, setHighlights] = useState<string[]>(trip.highlights || [])

  const [photos, setPhotos] = useState({
    courses: trip.courses_photo_url || "",
    singleRoom: trip.single_room_photo_url || "",
    doubleRoom: trip.double_room_photo_url || "",
  })
  const [uploadingPhoto, setUploadingPhoto] = useState<string | null>(null)

  const initializePackages = () => {
    const existingPackages = trip.packages || []
    const premiumPkg = existingPackages.find(
      (p: any) =>
        p.name === "Premium" || p.name === "Basic" || p.name === "Regular",
    )
    const upgradePkg = existingPackages.find((p: any) => p.name === "Upgrade")

    const pkgs = []
    // Always include Premium
    if (premiumPkg) {
      pkgs.push({
        ...premiumPkg,
        name: "Premium", // Normalize to "Premium"
        price: premiumPkg.price || 0,
      })
    } else {
      pkgs.push({
        id: "premium",
        name: "Premium",
        description: "",
        price: 0,
        availability: "unlimited",
        quantity: null,
        participants_per_booking: 1,
      })
    }

    // Include Upgrade if it exists
    if (upgradePkg) {
      pkgs.push({
        ...upgradePkg,
        name: "Upgrade", // Normalize to "Upgrade"
        price: upgradePkg.price || 0,
      })
    }

    return pkgs
  }

  const [packages, setPackages] = useState(initializePackages())
  const [hasUpgradePackage, setHasUpgradePackage] = useState(() =>
    (trip.packages || []).some(
      (p: any) => p.name === "Upgrade" || p.name === "Premium",
    ),
  )

  const [golfCourses, setGolfCourses] = useState(() => {
    return (trip.golf_courses || []).map((course: any) => ({
      id: course.id,
      name: course.name || "",
      description: course.description || "",
      max_rounds: course.max_rounds || 5,
    }))
  })
  const [mealOptions, setMealOptions] = useState(trip.meal_options || [])
  const [transportationOptions, setTransportationOptions] = useState(
    trip.transportation_options || [],
  )

  const handlePhotoUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    photoType: "courses" | "singleRoom" | "doubleRoom",
  ) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingPhoto(photoType)

    try {
      // Create form data for upload
      const formData = new FormData()
      formData.append("file", file)

      // Upload to our API endpoint
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) throw new Error("Upload failed")

      const { url } = await response.json()
      setPhotos((prev) => ({ ...prev, [photoType]: url }))
    } catch (error) {
      console.error("Error uploading photo:", error)
      alert("Failed to upload photo")
    } finally {
      setUploadingPhoto(null)
    }
  }

  const handleRemovePhoto = (
    photoType: "courses" | "singleRoom" | "doubleRoom",
  ) => {
    setPhotos((prev) => ({ ...prev, [photoType]: "" }))
  }

  const addUpgradePackage = () => {
    if (!hasUpgradePackage) {
      setPackages([
        ...packages,
        {
          id: "upgrade",
          name: "Upgrade",
          description: "",
          price: 0,
          availability: "unlimited",
          quantity: null,
          participants_per_booking: 1,
        },
      ])
      setHasUpgradePackage(true)
    }
  }

  const removeUpgradePackage = () => {
    setPackages(packages.filter((pkg) => pkg.name !== "Upgrade"))
    setHasUpgradePackage(false)
  }

  const handlePackageChange = (index: number, field: string, value: any) => {
    const updated = [...packages]
    updated[index] = { ...updated[index], [field]: value }
    setPackages(updated)
  }

  const handleAddGolfCourse = () => {
    setGolfCourses([
      ...golfCourses,
      {
        id: `new-${Date.now()}`,
        name: "",
        description: "",
        max_rounds: 5,
      },
    ])
  }

  const handleRemoveGolfCourse = (index: number) => {
    setGolfCourses(golfCourses.filter((_, i) => i !== index))
  }

  const handleGolfCourseChange = (index: number, field: string, value: any) => {
    const updated = [...golfCourses]
    updated[index] = { ...updated[index], [field]: value }
    setGolfCourses(updated)
  }

  const addMealOption = () => {
    setMealOptions([
      ...mealOptions,
      {
        id: `new-${Date.now()}`,
        name: "",
        description: "",
        price: 0,
        is_included: false, // Added is_included field
      },
    ])
  }

  const removeMealOption = (index: number) => {
    setMealOptions(mealOptions.filter((_, i) => i !== index))
  }

  const handleMealOptionChange = (index: number, field: string, value: any) => {
    const updated = [...mealOptions]
    updated[index] = { ...updated[index], [field]: value }
    setMealOptions(updated)
  }

  const addTransportationOption = () => {
    setTransportationOptions([
      ...transportationOptions,
      {
        id: `new-${Date.now()}`,
        name: "",
        description: "",
        price: 0,
        is_included: false, // Added is_included field
      },
    ])
  }

  const removeTransportationOption = (index: number) => {
    setTransportationOptions(
      transportationOptions.filter((_, i) => i !== index),
    )
  }

  const handleTransportationOptionChange = (
    index: number,
    field: string,
    value: any,
  ) => {
    const updated = [...transportationOptions]
    updated[index] = { ...updated[index], [field]: value }
    setTransportationOptions(updated)
  }

  const addHighlight = () => {
    setHighlights([...highlights, ""])
  }

  const updateHighlight = (index: number, value: string) => {
    const updated = [...highlights]
    updated[index] = value
    setHighlights(updated)
  }

  const removeHighlight = (index: number) => {
    setHighlights(highlights.filter((_, i) => i !== index))
  }

  const canProceedToNextStep = () => {
    switch (currentStep) {
      case 1:
        return (
          formData.title &&
          formData.location &&
          formData.continent &&
          formData.min_days &&
          Number(formData.max_guests) > 0 &&
          formData.price_regular !== 0
        )
      case 2:
        const premiumPackage = packages.find((p) => p.name === "Premium")
        return (
          premiumPackage?.price !== undefined &&
          premiumPackage?.price !== null &&
          premiumPackage?.price >= 0
        )
      case 3:
        return true // Trip options are optional
      default:
        return true
    }
  }

  const nextStep = () => {
    if (canProceedToNextStep() && currentStep < 4) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const validateForm = (): { valid: boolean; errors: string[] } => {
    const errors: string[] = []

    // Step 1 validation
    if (!formData.title.trim()) errors.push("Trip title is required (Step 1)")
    if (!formData.location.trim()) errors.push("Location is required (Step 1)")
    if (!formData.continent)
      errors.push("Continent selection is required (Step 1)")
    if (formData.max_days && Number(formData.max_days) <= 0) {
      errors.push("Maximum trip duration must be a positive number (Step 1)")
    }
    if (formData.min_days_advance && Number(formData.min_days_advance) < 0) {
      errors.push("Minimum advance booking period cannot be negative (Step 1)")
    }
    if (!formData.min_days || Number(formData.min_days) <= 0) {
      errors.push("Minimum trip duration must be a positive number (Step 1)")
    }
    // Added validation for max_guests to be a positive number
    if (!formData.max_guests || Number(formData.max_guests) <= 0) {
      errors.push("Maximum guests must be a positive number (Step 1)")
    }

    const premiumPkg = packages.find((p) => p.name === "Premium")
    if (!premiumPkg) {
      errors.push("Premium package is required (Step 2)")
    }
    if (premiumPkg && (!premiumPkg.price || Number(premiumPkg.price) < 0)) {
      errors.push("Premium package price cannot be negative (Step 2)")
    }

    if (hasUpgradePackage) {
      const upgradePkg = packages.find((p) => p.name === "Upgrade")
      if (upgradePkg && (!upgradePkg.price || Number(upgradePkg.price) < 0)) {
        errors.push("Upgrade package price cannot be negative (Step 2)")
      }
    }

    // Step 3 validation (optional, but can add if needed)

    return { valid: errors.length === 0, errors }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (currentStep !== 4) {
      const { valid, errors } = validateForm()
      if (!valid) {
        alert(`Please fix the following errors:\n\n${errors.join("\n")}`)
        return
      }
      nextStep()
      return
    }

    if (loading) return

    setLoading(true)

    try {
      const response = await fetch(`/api/admin/trips/${trip.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          location: formData.location, // Added location
          continent: formData.continent,
          price_regular: Number(formData.price_regular), // Added price_regular
          max_guests: Number(formData.max_guests), // Added max_guests
          max_days: formData.max_days ? Number(formData.max_days) : null,
          min_days: Number(formData.min_days), // Added min_days
          min_days_advance: Number(formData.min_days_advance), // Removed .toString()
          // is_all_inclusive: formData.is_all_inclusive, // REMOVED is_all_inclusive
          courses_photo_url: photos.courses || null,
          single_room_photo_url: photos.singleRoom || null,
          double_room_photo_url: photos.doubleRoom || null,
          highlights: highlights.filter((h) => h.trim() !== ""),
          packages,
          golf_courses: golfCourses.map((course) => ({
            ...course,
          })),
          meal_options: mealOptions,
          transportation_options: transportationOptions,
        }),
      })

      if (!response.ok) throw new Error("Failed to update trip")

      window.location.href = "/admin"
    } catch (error) {
      console.error("Error updating trip:", error)
      alert("Failed to update trip")
      setLoading(false) // Re-enable button on error
    }
  }

  const handleDelete = async () => {
    setDeleting(true)

    try {
      const response = await fetch(`/api/admin/trips/${trip.id}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete trip")

      router.refresh()
      router.push("/admin") // Updated code here
      alert("Trip deleted successfully")
    } catch (error) {
      console.error("Error deleting trip:", error)
      alert("Failed to delete trip")
    } finally {
      setDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      {showDeleteDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-md rounded-lg bg-card p-6 shadow-lg">
            <h3 className="mb-4 text-lg font-semibold">Delete Trip</h3>
            <p className="mb-6 text-sm text-muted-foreground">
              Are you sure you want to delete this trip? This action cannot be
              undone. All packages, add-ons, and bookings associated with this
              trip will also be deleted.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(false)}
                disabled={deleting}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1"
              >
                {deleting ? "Deleting..." : "Delete Trip"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-8">
        <div className="flex items-center justify-between">
          {STEPS.map((step, idx) => (
            <div key={step.id} className="flex flex-1 items-center">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentStep(step.id)}
                  className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-2 font-semibold transition-colors hover:opacity-80 ${
                    currentStep === step.id
                      ? "border-primary bg-primary text-white"
                      : currentStep > step.id
                      ? "border-primary/70 bg-primary/70 text-white"
                      : "border-muted-foreground/30 text-muted-foreground hover:border-muted-foreground/50"
                  }`}
                >
                  {step.id}
                </button>
                <div className="hidden md:block">
                  <p
                    className={`text-sm font-medium ${
                      currentStep >= step.id
                        ? "text-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    {step.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              </div>
              {idx < STEPS.length - 1 && (
                <div
                  className={`mx-2 h-0.5 flex-1 md:mx-4 ${
                    currentStep > step.id
                      ? "bg-primary/70"
                      : "bg-muted-foreground/30"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold">Trip Basics</h2>
              <p className="text-sm text-muted-foreground">
                Update the basic information about your golf trip
              </p>
            </div>

            {/* Trip Name */}
            <div className="space-y-2">
              <Label htmlFor="title" className="text-base text-foreground">
                Title of place *
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Title of place"
                required
                className="h-12"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label
                htmlFor="description"
                className="text-base text-foreground"
              >
                Description
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Add a description..."
                rows={6}
                className="resize-none"
              />
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location" className="text-base text-foreground">
                Location *
              </Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
                placeholder="e.g., Pebble Beach, California"
                required
                className="h-12"
              />
            </div>

            {/* Highlights */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base text-foreground">
                  Highlights (Optional)
                </Label>
                <Button
                  type="button"
                  onClick={addHighlight}
                  size="sm"
                  variant="outline"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Highlight
                </Button>
              </div>
              {highlights.length > 0 ? (
                <div className="space-y-2">
                  {highlights.map((highlight, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={highlight}
                        onChange={(e) => updateHighlight(index, e.target.value)}
                        placeholder="e.g., Stay at this nice hotel"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeHighlight(index)}
                        className="flex-shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No highlights added yet
                </p>
              )}
            </div>

            {/* Choose Continent */}
            <div className="space-y-3">
              <Label className="text-base text-foreground">
                Choose Continent *
              </Label>
              <div className="flex flex-wrap gap-2">
                {CONTINENTS.map((continent) => (
                  <button
                    key={continent}
                    type="button"
                    onClick={() => setFormData({ ...formData, continent })}
                    className={`rounded-full border px-4 py-2 text-sm transition-colors sm:px-6 ${
                      formData.continent === continent
                        ? "border-primary bg-primary text-white"
                        : "border-muted-foreground/30 bg-background text-foreground hover:border-primary/50"
                    }`}
                  >
                    {continent === "North America"
                      ? "N. America"
                      : continent === "South America"
                      ? "S. America"
                      : continent}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="max_days" className="text-base text-foreground">
                Maximum Trip Duration (Days)
              </Label>
              <Input
                id="max_days"
                type="number"
                min="1"
                value={formData.max_days}
                onChange={(e) =>
                  setFormData({ ...formData, max_days: e.target.value })
                }
                placeholder="e.g., 7"
              />
              <p className="text-xs text-muted-foreground">
                Optional: Set a maximum number of days guests can book for this
                trip
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="min_days" className="text-base text-foreground">
                Minimum Trip Duration (Days)
              </Label>
              <Input
                id="min_days"
                type="number"
                min="1"
                value={formData.min_days}
                onChange={(e) =>
                  setFormData({ ...formData, min_days: e.target.value })
                }
                placeholder="e.g., 3"
              />
              <p className="text-xs text-muted-foreground">
                Minimum number of days guests must select on the calendar
                (default: 1)
              </p>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="min_days_advance"
                className="text-base text-foreground"
              >
                Minimum Advance Booking Period (Days)
              </Label>
              <Input
                id="min_days_advance"
                type="number"
                min="0"
                value={formData.min_days_advance}
                onChange={(e) =>
                  setFormData({ ...formData, min_days_advance: e.target.value })
                }
                placeholder="e.g., 30"
              />
              <p className="text-xs text-muted-foreground">
                Optional: Minimum days in advance required to book (0 = no
                restriction)
              </p>
            </div>

            {/* Max Guests */}
            <div className="space-y-2">
              <Label htmlFor="max_guests" className="text-base text-foreground">
                Max Guests *
              </Label>
              <Input
                id="max_guests"
                type="number"
                min="1"
                value={formData.max_guests}
                onChange={(e) =>
                  setFormData({ ...formData, max_guests: e.target.value })
                }
                placeholder="e.g., 4"
                required
                className="h-12"
              />
            </div>

            {/* Removed All-Inclusive Switch */}

            {/* Upload Photos for Courses */}
            <div className="space-y-3">
              <Label className="text-base text-foreground">
                Upload Photos for Courses
              </Label>
              {photos.courses ? (
                <div className="relative aspect-[3/1] w-full overflow-hidden rounded-lg border-2 border-dashed border-border">
                  <Image
                    src={photos.courses || "/placeholder.svg"}
                    alt="Golf courses"
                    fill
                    className="object-cover"
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="destructive"
                    className="absolute right-2 top-2"
                    onClick={() => handleRemovePhoto("courses")}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <label className="flex aspect-[3/1] w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/20 transition-colors hover:bg-muted/40">
                  <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
                  <p className="text-sm">
                    <span className="text-primary">Click to upload</span>
                    <span className="text-muted-foreground">
                      {" "}
                      or drag and drop
                    </span>
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    JPG, JPEG, PNG less than 1MB
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handlePhotoUpload(e, "courses")}
                    disabled={uploadingPhoto === "courses"}
                  />
                </label>
              )}
            </div>

            {/* Upload Photos for Single Occupancy Room */}
            <div className="space-y-3">
              <Label className="text-base text-foreground">
                Upload Photos for Single Occupancy Room
              </Label>
              {photos.singleRoom ? (
                <div className="relative aspect-[3/1] w-full overflow-hidden rounded-lg border-2 border-dashed border-border">
                  <Image
                    src={photos.singleRoom || "/placeholder.svg"}
                    alt="Single occupancy room"
                    fill
                    className="object-cover"
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="destructive"
                    className="absolute right-2 top-2"
                    onClick={() => handleRemovePhoto("singleRoom")}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <label className="flex aspect-[3/1] w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/20 transition-colors hover:bg-muted/40">
                  <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
                  <p className="text-sm">
                    <span className="text-primary">Click to upload</span>
                    <span className="text-muted-foreground">
                      {" "}
                      or drag and drop
                    </span>
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    JPG, JPEG, PNG less than 1MB
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handlePhotoUpload(e, "singleRoom")}
                    disabled={uploadingPhoto === "singleRoom"}
                  />
                </label>
              )}
            </div>

            {/* Upload Photos for Double Occupancy Room */}
            <div className="space-y-3">
              <Label className="text-base text-foreground">
                Upload Photos for Double Occupancy Room
              </Label>
              {photos.doubleRoom ? (
                <div className="relative aspect-[3/1] w-full overflow-hidden rounded-lg border-2 border-dashed border-border">
                  <Image
                    src={photos.doubleRoom || "/placeholder.svg"}
                    alt="Double occupancy room"
                    fill
                    className="object-cover"
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="destructive"
                    className="absolute right-2 top-2"
                    onClick={() => handleRemovePhoto("doubleRoom")}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <label className="flex aspect-[3/1] w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/20 transition-colors hover:bg-muted/40">
                  <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
                  <p className="text-sm">
                    <span className="text-primary">Click to upload</span>
                    <span className="text-muted-foreground">
                      {" "}
                      or drag and drop
                    </span>
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    JPG, JPEG, PNG less than 1MB
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handlePhotoUpload(e, "doubleRoom")}
                    disabled={uploadingPhoto === "doubleRoom"}
                  />
                </label>
              )}
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold">Packages</h2>
              <p className="text-sm text-muted-foreground">
                Configure room types - Premium is required, Upgrade is optional
              </p>
            </div>

            <div className="space-y-4 rounded-lg border border-border p-6">
              {packages
                .filter((pkg) => pkg.name === "Premium")
                .map((pkg, index) => (
                  <Card key={pkg.id} className="p-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">
                          Premium Package (Required)
                        </h4>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <Label className="text-base text-foreground">
                            Price (USD) *
                          </Label>
                          <Input
                            type="number"
                            value={pkg.price}
                            onChange={(e) =>
                              handlePackageChange(
                                packages.findIndex((p) => p.id === pkg.id),
                                "price",
                                Number(e.target.value),
                              )
                            }
                            placeholder="0"
                            required
                          />
                        </div>
                        <div>
                          <Label className="text-base text-foreground">
                            Participants Per Booking
                          </Label>
                          <Input
                            type="number"
                            value={pkg.participants_per_booking}
                            onChange={(e) =>
                              handlePackageChange(
                                packages.findIndex((p) => p.id === pkg.id),
                                "participants_per_booking",
                                Number(e.target.value),
                              )
                            }
                            placeholder="1"
                            min="1"
                          />
                        </div>
                      </div>
                      <div>
                        <Label className="text-base text-foreground">
                          Description
                        </Label>
                        <Textarea
                          value={pkg.description || ""}
                          onChange={(e) =>
                            handlePackageChange(
                              packages.findIndex((p) => p.id === pkg.id),
                              "description",
                              e.target.value,
                            )
                          }
                          placeholder="Package description (optional)"
                          rows={2}
                        />
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <Label className="text-base text-foreground">
                            Availability
                          </Label>
                          <Select
                            value={pkg.availability}
                            onValueChange={(value) =>
                              handlePackageChange(
                                packages.findIndex((p) => p.id === pkg.id),
                                "availability",
                                value,
                              )
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="unlimited">
                                Unlimited
                              </SelectItem>
                              <SelectItem value="limited">Limited</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {pkg.availability === "limited" && (
                          <div>
                            <Label className="text-base text-foreground">
                              Quantity
                            </Label>
                            <Input
                              type="number"
                              value={pkg.quantity || ""}
                              onChange={(e) =>
                                handlePackageChange(
                                  packages.findIndex((p) => p.id === pkg.id),
                                  "quantity",
                                  Number(e.target.value),
                                )
                              }
                              placeholder="0"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}

              {hasUpgradePackage ? (
                packages
                  .filter((pkg) => pkg.name === "Upgrade")
                  .map((pkg) => (
                    <Card key={pkg.id} className="p-4">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">
                            Upgrade Package (Optional)
                          </h4>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={removeUpgradePackage}
                            className="text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div>
                            <Label className="text-base text-foreground">
                              Price (USD) *
                            </Label>
                            <Input
                              type="number"
                              value={pkg.price}
                              onChange={(e) =>
                                handlePackageChange(
                                  packages.findIndex((p) => p.id === pkg.id),
                                  "price",
                                  Number(e.target.value),
                                )
                              }
                              placeholder="0"
                              required
                            />
                          </div>
                          <div>
                            <Label className="text-base text-foreground">
                              Participants Per Booking
                            </Label>
                            <Input
                              type="number"
                              value={pkg.participants_per_booking}
                              onChange={(e) =>
                                handlePackageChange(
                                  packages.findIndex((p) => p.id === pkg.id),
                                  "participants_per_booking",
                                  Number(e.target.value),
                                )
                              }
                              placeholder="1"
                              min="1"
                            />
                          </div>
                        </div>
                        <div>
                          <Label className="text-base text-foreground">
                            Description
                          </Label>
                          <Textarea
                            value={pkg.description || ""}
                            onChange={(e) =>
                              handlePackageChange(
                                packages.findIndex((p) => p.id === pkg.id),
                                "description",
                                e.target.value,
                              )
                            }
                            placeholder="Package description (optional)"
                            rows={2}
                          />
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div>
                            <Label className="text-base text-foreground">
                              Availability
                            </Label>
                            <Select
                              value={pkg.availability}
                              onValueChange={(value) =>
                                handlePackageChange(
                                  packages.findIndex((p) => p.id === pkg.id),
                                  "availability",
                                  value,
                                )
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="unlimited">
                                  Unlimited
                                </SelectItem>
                                <SelectItem value="limited">Limited</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          {pkg.availability === "limited" && (
                            <div>
                              <Label className="text-base text-foreground">
                                Quantity
                              </Label>
                              <Input
                                type="number"
                                value={pkg.quantity || ""}
                                onChange={(e) =>
                                  handlePackageChange(
                                    packages.findIndex((p) => p.id === pkg.id),
                                    "quantity",
                                    Number(e.target.value),
                                  )
                                }
                                placeholder="0"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))
              ) : (
                <div className="py-8 text-center">
                  <p className="mb-4 text-sm text-muted-foreground">
                    Upgrade package not added (optional)
                  </p>
                  <Button
                    type="button"
                    onClick={addUpgradePackage}
                    size="sm"
                    className="bg-primary hover:bg-primary/90"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Upgrade Package
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold">Trip Options</h2>
              <p className="text-sm text-muted-foreground">
                Configure golf courses, meals, and transportation (all optional)
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base text-foreground">
                  Golf Courses
                </Label>
                <Button
                  type="button"
                  onClick={handleAddGolfCourse}
                  variant="outline"
                  size="sm"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Course
                </Button>
              </div>
              {golfCourses.map((course, index) => (
                <Card key={course.id} className="p-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Course {index + 1}</h4>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveGolfCourse(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div>
                        <Label className="text-base text-foreground">
                          Course Name *
                        </Label>
                        <Input
                          value={course.name}
                          onChange={(e) =>
                            handleGolfCourseChange(
                              index,
                              "name",
                              e.target.value,
                            )
                          }
                          placeholder="e.g., Course A"
                          required
                        />
                      </div>
                      <div>
                        <Label className="text-base text-foreground">
                          Max Rounds *
                        </Label>
                        <Input
                          type="number"
                          min="0"
                          value={course.max_rounds || 5}
                          onChange={(e) =>
                            handleGolfCourseChange(
                              index,
                              "max_rounds",
                              Number(e.target.value),
                            )
                          }
                          placeholder="5"
                          required
                        />
                        <p className="text-xs text-muted-foreground">
                          Max rounds (min: 0)
                        </p>
                      </div>
                    </div>
                    <div>
                      <Label className="text-base text-foreground">
                        Description
                      </Label>
                      <Textarea
                        value={course.description || ""}
                        onChange={(e) =>
                          handleGolfCourseChange(
                            index,
                            "description",
                            e.target.value,
                          )
                        }
                        placeholder="Course description (optional)"
                        rows={2}
                      />
                    </div>
                  </div>
                </Card>
              ))}

              {golfCourses.length === 0 && (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  No golf courses added (optional). Click "Add Course" to add
                  courses.
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base text-foreground">
                  Meal Options
                </Label>
                <Button
                  type="button"
                  onClick={addMealOption}
                  variant="outline"
                  size="sm"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Meal Option
                </Button>
              </div>
              {mealOptions.map((meal, index) => (
                <Card key={meal.id} className="p-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Meal Option {index + 1}</h4>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeMealOption(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <Label className="text-base text-foreground">
                          Option Name *
                        </Label>
                        <Input
                          value={meal.name}
                          onChange={(e) =>
                            handleMealOptionChange(
                              index,
                              "name",
                              e.target.value,
                            )
                          }
                          placeholder="e.g., Breakfast Included"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-base text-foreground">
                        Description
                      </Label>
                      <Textarea
                        value={meal.description || ""}
                        onChange={(e) =>
                          handleMealOptionChange(
                            index,
                            "description",
                            e.target.value,
                          )
                        }
                        placeholder="Meal option description"
                        rows={2}
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id={`meal-included-${meal.id}`}
                        checked={meal.is_included}
                        onCheckedChange={(checked: boolean) =>
                          handleMealOptionChange(index, "is_included", checked)
                        }
                      />
                      <Label
                        htmlFor={`meal-included-${meal.id}`}
                        className="text-base text-foreground"
                      >
                        Included by Default
                      </Label>
                    </div>
                  </div>
                </Card>
              ))}

              {mealOptions.length === 0 && (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  No meal options added (optional). Click "Add Meal Option" to
                  add options.
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base text-foreground">
                  Transportation Options
                </Label>
                <Button
                  type="button"
                  onClick={addTransportationOption}
                  variant="outline"
                  size="sm"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Transportation Option
                </Button>
              </div>
              {transportationOptions.map((transport, index) => (
                <Card key={transport.id} className="p-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">
                        Transportation Option {index + 1}
                      </h4>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeTransportationOption(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <Label className="text-base text-foreground">
                          Option Name *
                        </Label>
                        <Input
                          value={transport.name}
                          onChange={(e) =>
                            handleTransportationOptionChange(
                              index,
                              "name",
                              e.target.value,
                            )
                          }
                          placeholder="e.g., Private Car with Driver"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-base text-foreground">
                        Description
                      </Label>
                      <Textarea
                        value={transport.description || ""}
                        onChange={(e) =>
                          handleTransportationOptionChange(
                            index,
                            "description",
                            e.target.value,
                          )
                        }
                        placeholder="Transportation option description"
                        rows={2}
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id={`transport-included-${transport.id}`}
                        checked={transport.is_included}
                        onCheckedChange={(checked: boolean) =>
                          handleTransportationOptionChange(
                            index,
                            "is_included",
                            checked,
                          )
                        }
                      />
                      <Label
                        htmlFor={`transport-included-${transport.id}`}
                        className="text-base text-foreground"
                      >
                        Included by Default
                      </Label>
                    </div>
                  </div>
                </Card>
              ))}

              {transportationOptions.length === 0 && (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  No transportation options added (optional). Click "Add
                  Transportation Option" to add options.
                </div>
              )}
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold">Review & Submit</h2>
              <p className="text-sm text-muted-foreground">
                Review all changes before saving
              </p>
            </div>

            <div className="space-y-6">
              {/* Trip Basics Summary */}
              <div className="rounded-lg border border-border p-6">
                <h3 className="mb-4 text-lg font-semibold">Trip Basics</h3>
                <div className="grid gap-4 text-sm">
                  <div>
                    <span className="font-medium">Title:</span>{" "}
                    {formData.title || "Not set"}
                  </div>
                  <div>
                    <span className="font-medium">Location:</span>{" "}
                    {formData.location || "Not set"}
                  </div>
                  <div>
                    <span className="font-medium">Continent:</span>{" "}
                    {formData.continent || "Not set"}
                  </div>
                  <div>
                    <span className="font-medium">Price:</span> $
                    {formData.price_regular}
                  </div>
                  <div>
                    <span className="font-medium">Max Guests:</span>{" "}
                    {formData.max_guests}
                  </div>
                  <div>
                    <span className="font-medium">Description:</span>{" "}
                    {formData.description ? (
                      <span className="text-muted-foreground">
                        {formData.description}
                      </span>
                    ) : (
                      "Not set"
                    )}
                  </div>
                  {highlights.length > 0 && (
                    <div>
                      <span className="font-medium">Highlights:</span>
                      <ul className="mt-2 list-inside list-disc space-y-1 text-muted-foreground">
                        {highlights
                          .filter((h) => h.trim())
                          .map((highlight, idx) => (
                            <li key={idx}>{highlight}</li>
                          ))}
                      </ul>
                    </div>
                  )}
                  {formData.max_days && (
                    <div>
                      <span className="font-medium">Max Days:</span>{" "}
                      {formData.max_days}
                    </div>
                  )}
                  {formData.min_days && (
                    <div>
                      <span className="font-medium">Min Days:</span>{" "}
                      {formData.min_days}
                    </div>
                  )}
                  {formData.min_days_advance &&
                    Number(formData.min_days_advance) > 0 && (
                      <p>
                        <span className="font-medium">
                          Min Advance Booking:
                        </span>{" "}
                        {formData.min_days_advance} days
                      </p>
                    )}
                  {/* Removed All-Inclusive Summary */}
                  <div className="flex flex-wrap gap-4">
                    {photos.courses && (
                      <div>
                        <p className="mb-1 font-medium">Courses Photo</p>
                        <div className="relative h-20 w-32 overflow-hidden rounded border">
                          <Image
                            src={photos.courses || "/placeholder.svg"}
                            alt="Courses"
                            fill
                            className="object-cover"
                          />
                        </div>
                      </div>
                    )}
                    {photos.singleRoom && (
                      <div>
                        <p className="mb-1 font-medium">Single Room Photo</p>
                        <div className="relative h-20 w-32 overflow-hidden rounded border">
                          <Image
                            src={photos.singleRoom || "/placeholder.svg"}
                            alt="Single Room"
                            fill
                            className="object-cover"
                          />
                        </div>
                      </div>
                    )}
                    {photos.doubleRoom && (
                      <div>
                        <p className="mb-1 font-medium">Double Room Photo</p>
                        <div className="relative h-20 w-32 overflow-hidden rounded border">
                          <Image
                            src={photos.doubleRoom || "/placeholder.svg"}
                            alt="Double Room"
                            fill
                            className="object-cover"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Packages Summary */}
              <div className="rounded-lg border border-border p-6">
                <h3 className="mb-4 text-lg font-semibold">
                  Packages ({packages.length})
                </h3>
                {packages.length > 0 ? (
                  <div className="space-y-4">
                    {packages.map((pkg, idx) => (
                      <div
                        key={pkg.id}
                        className="rounded border border-border bg-muted/20 p-4 text-sm"
                      >
                        <p className="mb-2 font-medium">
                          {pkg.name || `Package ${idx + 1}`}
                        </p>
                        {pkg.description && (
                          <p className="mb-2 text-muted-foreground">
                            {pkg.description}
                          </p>
                        )}
                        <div className="grid gap-2 md:grid-cols-2">
                          <div>
                            <span className="font-medium">Price:</span> $
                            {pkg.price}
                          </div>
                          <div>
                            <span className="font-medium">Participants:</span>{" "}
                            {pkg.participants_per_booking}
                          </div>
                          <div>
                            <span className="font-medium">Availability:</span>{" "}
                            {pkg.availability}
                            {pkg.availability === "limited" &&
                              pkg.quantity &&
                              ` (${pkg.quantity} available)`}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No packages added
                  </p>
                )}
              </div>

              {/* Golf Courses Summary */}
              <div className="rounded-lg border border-border p-6">
                <h3 className="mb-4 text-lg font-semibold">
                  Golf Courses ({golfCourses.length})
                </h3>
                {golfCourses.length > 0 ? (
                  <div className="space-y-4">
                    {golfCourses.map((course, idx) => (
                      <div
                        key={course.id}
                        className="rounded border border-border bg-muted/20 p-4 text-sm"
                      >
                        <p className="mb-2 font-medium">
                          {course.name || `Course ${idx + 1}`}
                        </p>
                        {course.description && (
                          <p className="mb-2 text-muted-foreground">
                            {course.description}
                          </p>
                        )}
                        <div>
                          <span className="font-medium">Max Rounds:</span>{" "}
                          {course.max_rounds || 5}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No golf courses added
                  </p>
                )}
              </div>

              {/* Meal Options Summary */}
              <div className="rounded-lg border border-border p-6">
                <h3 className="mb-4 text-lg font-semibold">Meal Options</h3>
                <div className="space-y-4">
                  {mealOptions.map((meal, idx) => (
                    <div
                      key={meal.id}
                      className="rounded border border-border bg-muted/20 p-4 text-sm"
                    >
                      <p className="mb-2 font-medium">
                        {meal.name} {meal.is_included && "(Included)"}
                      </p>
                      {meal.description && (
                        <p className="text-muted-foreground">
                          {meal.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
                {mealOptions.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No meal options added
                  </p>
                )}
              </div>

              {/* Transportation Options Summary */}
              <div className="rounded-lg border border-border p-6">
                <h3 className="mb-4 text-lg font-semibold">
                  Transportation Options
                </h3>
                <div className="space-y-4">
                  {transportationOptions.map((transport, idx) => (
                    <div
                      key={transport.id}
                      className="rounded border border-border bg-muted/20 p-4 text-sm"
                    >
                      <p className="mb-2 font-medium">
                        {transport.name} {transport.is_included && "(Included)"}
                      </p>
                      {transport.description && (
                        <p className="text-muted-foreground">
                          {transport.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
                {transportationOptions.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No transportation options added
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-4 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
              className="w-full sm:w-auto bg-transparent"
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>

            <Button
              type="button"
              variant="destructive"
              onClick={() => setShowDeleteDialog(true)}
              className="w-full sm:w-auto"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Trip
            </Button>
          </div>

          {currentStep < 4 ? (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={!canProceedToNextStep()}
              className="w-full bg-primary hover:bg-primary/90 sm:w-auto"
            >
              Next
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 sm:w-auto"
            >
              {loading ? "Saving Changes..." : "Save Changes"}
            </Button>
          )}
        </div>
      </form>
    </div>
  )
}
