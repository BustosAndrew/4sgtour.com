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
  GripVertical,
} from "lucide-react"
import Image from "next/image"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"

const CONTINENTS = ["World", "Asia", "Europe", "North America", "Latin America"]

type Package = {
  id: string
  name: "Premium" | "Upgrade"
  description: string
  price: string
  availability: string
  quantity: string
  participants_per_booking: string
}

type GolfCourse = {
  id: string
  course_name: string
  max_rounds: string
  num_holes: string
}

type MealOption = {
  id: string
  name: string
  description: string
  is_included: boolean
}

type TransportationOption = {
  id: string
  name: string
  description: string
  is_included: boolean
}

type ServiceOption = {
  id: string
  name: string
  description: string
  is_included: boolean
}

const STEPS = [
  {
    id: 1,
    title: "Trip Basics",
    description: "Title, description, and images",
  },
  { id: 2, title: "Packages", description: "Room types and accommodation" },
  {
    id: 3,
    title: "Booking Options",
    description: "Courses, meals, and transportation",
  },
  { id: 4, title: "Review & Submit", description: "Review and publish trip" },
]

export function CreateTripForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    continent: "",
    max_guests: "20",
    max_days: "",
    min_days_advance: "0",
    min_days: "1",
  })
  const [highlights, setHighlights] = useState<string[]>([])
  const [coursePhotos, setCoursePhotos] = useState<string[]>([])
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [photos, setPhotos] = useState({
    room: "",
  })
  const [uploadingPhoto, setUploadingPhoto] = useState<string | null>(null)

  const [packages, setPackages] = useState<Package[]>([
    {
      id: "premium",
      name: "Premium",
      description: "",
      price: "",
      availability: "unlimited",
      quantity: "",
      participants_per_booking: "1",
    },
  ])

  const [hasUpgradePackage, setHasUpgradePackage] = useState(false)

  const [golfCourses, setGolfCourses] = useState<GolfCourse[]>([])
  // Changed to arrays to allow multiple options
  const [mealOptions, setMealOptions] = useState<MealOption[]>([])
  const [transportationOptions, setTransportationOptions] = useState<
    TransportationOption[]
  >([])
  const [serviceOptions, setServiceOptions] = useState<ServiceOption[]>([
    {
      id: "caddy",
      name: "Caddy",
      description: "",
      is_included: false,
    },
    {
      id: "golf-cart",
      name: "Golf Cart",
      description: "",
      is_included: false,
    },
  ])

  const handlePhotoUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    photoType: "courses" | "room",
  ) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingPhoto(photoType)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const raw = await response.text().catch(() => "")
        let message = "Upload failed"
        try {
          const parsed = raw ? JSON.parse(raw) : {}
          message = parsed?.error || message
        } catch {
          // Non-JSON error (often an HTML error page)
          const snippet = raw.replace(/\s+/g, " ").slice(0, 200)
          message = `Upload failed (${response.status})${
            snippet ? `: ${snippet}` : ""
          }`
        }

        throw new Error(message)
      }

      const { url } = await response.json()
      if (photoType === "courses") {
        setCoursePhotos((prev) => {
          if (prev.length >= 5) return prev
          return [...prev, url]
        })
      } else {
        setPhotos((prev) => ({ ...prev, [photoType]: url }))
      }
    } catch (error) {
      console.error("Error uploading photo:", error)
      alert("Failed to upload photo")
    } finally {
      setUploadingPhoto(null)
    }
  }

  const handleRemovePhoto = (
    photoType: "courses" | "room",
  ) => {
    if (photoType === "courses") {
      setCoursePhotos([])
    } else {
      setPhotos((prev) => ({ ...prev, [photoType]: "" }))
    }
  }

  const validateCurrentStep = (): { valid: boolean; errors: string[] } => {
    const errors: string[] = []

    switch (currentStep) {
      case 1:
        if (!formData.title.trim()) errors.push("Trip title is required")
        if (!formData.location.trim()) errors.push("Location is required")
        if (!formData.continent) errors.push("Continent selection is required")
        if (!formData.max_days || Number(formData.max_days) <= 0) {
          // Updated to check for max_days if present
          errors.push("Maximum trip duration must be a positive number")
        }
        if (
          formData.min_days_advance &&
          Number(formData.min_days_advance) < 0
        ) {
          errors.push("Minimum advance booking period cannot be negative")
        }
        if (!formData.min_days || Number(formData.min_days) <= 0) {
          errors.push("Minimum trip duration must be a positive number")
        }

        break

      case 2:
        const premiumPackage = packages.find((p) => p.name === "Premium")
        if (!premiumPackage) {
          errors.push("Premium package is required") // Updated error message
        } else {
          if (!premiumPackage.price || Number(premiumPackage.price) <= 0)
            errors.push("Premium package price is required")
          if (
            !premiumPackage.participants_per_booking ||
            Number(premiumPackage.participants_per_booking) <= 0
          ) {
            errors.push(
              "Premium package must have valid participants per booking",
            ) // Updated error message
          }
          if (
            premiumPackage.availability === "limited" &&
            (!premiumPackage.quantity || Number(premiumPackage.quantity) <= 0)
          ) {
            errors.push(
              "Premium package must have valid quantity for limited availability",
            ) // Updated error message
          }
        }

        const upgradePkg = packages.find((p) => p.name === "Upgrade")
        if (upgradePkg) {
          if (!upgradePkg.price || Number(upgradePkg.price) <= 0)
            errors.push("Upgrade package price is required")
          if (
            !upgradePkg.participants_per_booking ||
            Number(upgradePkg.participants_per_booking) <= 0
          ) {
            errors.push(
              "Upgrade package must have valid participants per booking",
            )
          }
          if (
            upgradePkg.availability === "limited" &&
            (!upgradePkg.quantity || Number(upgradePkg.quantity) <= 0)
          ) {
            errors.push(
              "Upgrade package must have valid quantity for limited availability",
            )
          }
        }
        break

      case 3:
        golfCourses.forEach((course, idx) => {
          if (!course.course_name.trim())
            errors.push(`Golf course ${idx + 1} name is required`)
          if (!course.max_rounds || Number(course.max_rounds) < 0) {
            errors.push(`Golf course ${idx + 1} must have valid max rounds`)
          }
        })

        mealOptions.forEach((meal, idx) => {
          if (!meal.name.trim())
            errors.push(`Meal option ${idx + 1} name is required`)
        })

        transportationOptions.forEach((transport, idx) => {
          if (!transport.name.trim())
            errors.push(`Transportation option ${idx + 1} name is required`)
        })
        break

      case 4:
        // Review step - no validation needed
        break
    }

    return { valid: errors.length === 0, errors }
  }

  const validateForm = (): { valid: boolean; errors: string[] } => {
    const errors: string[] = []

    // Step 1 validation
    if (!formData.title.trim()) errors.push("Trip title is required (Step 1)")
    if (!formData.location.trim()) errors.push("Location is required (Step 1)")
    if (!formData.continent)
      errors.push("Continent selection is required (Step 1)")
    // Added validation for max_days
    if (formData.max_days && Number(formData.max_days) <= 0) {
      errors.push("Maximum trip duration must be a positive number (Step 1)")
    }
    // Added validation for min_days_advance
    if (formData.min_days_advance && Number(formData.min_days_advance) < 0) {
      errors.push("Minimum advance booking period cannot be negative (Step 1)")
    }
    // Added validation for min_days
    if (!formData.min_days || Number(formData.min_days) <= 0) {
      errors.push("Minimum trip duration must be a positive number (Step 1)")
    }

    const premiumPkg = packages.find((p) => p.name === "Premium")
    if (!premiumPkg) {
      errors.push("Premium package is required (Step 2)") // Updated error message
    } else {
      if (!premiumPkg.price || Number(premiumPkg.price) <= 0) {
        errors.push("Premium package price is required (Step 2)")
      }
      if (
        !premiumPkg.participants_per_booking ||
        Number(premiumPkg.participants_per_booking) <= 0
      ) {
        errors.push(
          "Premium package must have valid participants per booking (Step 2)",
        ) // Updated error message
      }
      if (
        premiumPkg.availability === "limited" &&
        (!premiumPkg.quantity || Number(premiumPkg.quantity) <= 0)
      ) {
        errors.push(
          "Premium package must have valid quantity for limited availability (Step 2)",
        ) // Updated error message
      }
    }

    // Validate Upgrade package if it exists
    const upgradePkg = packages.find((p) => p.name === "Upgrade")
    if (upgradePkg) {
      if (!upgradePkg.price || Number(upgradePkg.price) <= 0) {
        errors.push("Upgrade package price is required (Step 2)")
      }
      if (
        !upgradePkg.participants_per_booking ||
        Number(upgradePkg.participants_per_booking) <= 0
      ) {
        errors.push(
          "Upgrade package must have valid participants per booking (Step 2)",
        )
      }
      if (
        upgradePkg.availability === "limited" &&
        (!upgradePkg.quantity || Number(upgradePkg.quantity) <= 0)
      ) {
        errors.push(
          "Upgrade package must have valid quantity for limited availability (Step 2)",
        )
      }
    }

    // Step 3 validation - all optional but if added must be valid
    golfCourses.forEach((course, idx) => {
      if (!course.course_name.trim())
        errors.push(`Golf course ${idx + 1} name is required (Step 3)`)
      if (!course.max_rounds || Number(course.max_rounds) < 0) {
        errors.push(
          `Golf course ${idx + 1} must have valid max rounds (Step 3)`,
        )
      }
    })

    mealOptions.forEach((meal, idx) => {
      if (!meal.name.trim())
        errors.push(`Meal option ${idx + 1} name is required (Step 3)`)
    })

    transportationOptions.forEach((transport, idx) => {
      if (!transport.name.trim())
        errors.push(
          `Transportation option ${idx + 1} name is required (Step 3)`,
        )
    })

    return { valid: errors.length === 0, errors }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (currentStep !== 4) {
      return
    }

    if (loading) return

    const validation = validateForm()
    if (!validation.valid) {
      setValidationErrors(validation.errors)
      window.scrollTo({ top: 0, behavior: "smooth" })
      return
    }

    setValidationErrors([])
    setLoading(true)

    try {
      console.log("[v0] Submitting trip with data:", {
        ...formData,
        packagesCount: packages.length,
        golfCoursesCount: golfCourses.length,
      })

      const response = await fetch("/api/admin/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          // Removed price_regular from submission
          max_guests: Number(formData.max_guests),
          max_days: formData.max_days ? Number(formData.max_days) : null,
          min_days_advance: formData.min_days_advance
            ? Number(formData.min_days_advance)
            : 0,
          // is_all_inclusive: formData.is_all_inclusive, Removed is_all_inclusive
          // Added min_days to the submission
          min_days: Number(formData.min_days),
          courses_photo_url: coursePhotos[0] || null,
          course_images: coursePhotos,
          room_photo_url: photos.room || null,
          highlights: highlights.filter((h) => h.trim() !== ""),
          packages: packages.map((pkg) => ({
            name: pkg.name,
            description: pkg.description,
            price: Number(pkg.price),
            availability: pkg.availability,
            quantity: pkg.quantity ? Number(pkg.quantity) : null,
            participants_per_booking: Number(pkg.participants_per_booking),
          })),
          golfCourses: golfCourses.map((course) => ({
            course_name: course.course_name,
            max_rounds: Number(course.max_rounds),
            num_holes: Number(course.num_holes) || 18,
          })),
          mealOptions: mealOptions.map((meal) => ({
            name: meal.name,
            description: meal.description,
            is_included: meal.is_included,
          })),
          transportationOptions: transportationOptions.map((transport) => ({
            name: transport.name,
            description: transport.description,
            is_included: transport.is_included,
          })),
          serviceOptions: serviceOptions.map((service) => ({
            name: service.name,
            description: service.description,
            is_included: service.is_included,
          })),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error("[v0] Error creating trip:", errorData)
        throw new Error(errorData.error || "Failed to create trip")
      }

      window.location.href = "/admin"
    } catch (error) {
      console.error("[v0] Error creating trip:", error)
      alert(
        `Failed to create trip: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      )
      setLoading(false)
    }
  }

  const addUpgradePackage = () => {
    if (!hasUpgradePackage) {
      setPackages([
        ...packages,
        {
          id: "upgrade",
          name: "Upgrade",
          description: "",
          price: "",
          availability: "unlimited",
          quantity: "",
          participants_per_booking: "1",
        },
      ])
      setHasUpgradePackage(true)
    }
  }

  const updatePackage = (id: string, field: keyof Package, value: string) => {
    setPackages(
      packages.map((pkg) => (pkg.id === id ? { ...pkg, [field]: value } : pkg)),
    )
  }

  const removeUpgradePackage = () => {
    setPackages(packages.filter((pkg) => pkg.name !== "Upgrade"))
    setHasUpgradePackage(false)
  }

  const addGolfCourse = () => {
    setGolfCourses([
      ...golfCourses,
      {
        id: `course-${Date.now()}`,
        course_name: "",
        max_rounds: "5",
        num_holes: "18",
      },
    ])
  }

  const updateGolfCourse = (
    id: string,
    field: keyof GolfCourse,
    value: string,
  ) => {
    setGolfCourses(
      golfCourses.map((course) =>
        course.id === id ? { ...course, [field]: value } : course,
      ),
    )
  }

  const removeGolfCourse = (id: string) => {
    setGolfCourses(golfCourses.filter((course) => course.id !== id))
  }

  // New functions for meal options
  const addMealOption = () => {
    setMealOptions([
      ...mealOptions,
      {
        id: crypto.randomUUID(),
        name: "",
        description: "",
        is_included: false, // Updated to include is_included
      },
    ])
  }

  const updateMealOption = (
    id: string,
    field: keyof MealOption,
    value: string | boolean,
  ) => {
    setMealOptions(
      mealOptions.map((meal) =>
        meal.id === id ? { ...meal, [field]: value } : meal,
      ),
    )
  }

  const removeMealOption = (id: string) => {
    setMealOptions(mealOptions.filter((meal) => meal.id !== id))
  }

  // New functions for transportation options
  const addTransportationOption = () => {
    setTransportationOptions([
      ...transportationOptions,
      {
        id: crypto.randomUUID(),
        name: "",
        description: "",
        is_included: false, // Updated to include is_included
      },
    ])
  }

  const updateTransportationOption = (
    id: string,
    field: keyof TransportationOption,
    value: string | boolean,
  ) => {
    setTransportationOptions(
      transportationOptions.map((transport) =>
        transport.id === id ? { ...transport, [field]: value } : transport,
      ),
    )
  }

  const removeTransportationOption = (id: string) => {
    setTransportationOptions(
      transportationOptions.filter((transport) => transport.id !== id),
    )
  }

  const handleServiceOptionToggle = (name: string, value: boolean) => {
    setServiceOptions((prev) =>
      prev.map((opt) =>
        opt.name === name ? { ...opt, is_included: value } : opt,
      ),
    )
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
        // Updated to include max_days check if it's provided and invalid
        return (
          formData.title &&
          formData.location &&
          formData.continent &&
          // Removed price_regular check
          formData.max_days && // Ensure max_days is present and valid
          Number(formData.max_days) > 0 &&
          formData.min_days && // Ensure min_days is present and valid
          Number(formData.min_days) > 0 &&
          (!formData.min_days_advance || Number(formData.min_days_advance) >= 0) // Added check for min_days_advance
        )
      case 2:
        // Check if Premium package has valid price before proceeding
        const premiumPackageCheck = packages.find((p) => p.name === "Premium")
        // Updated to check for price > 0
        return (
          premiumPackageCheck?.price !== undefined &&
          premiumPackageCheck?.price !== null &&
          Number(premiumPackageCheck?.price) > 0
        )
      case 3:
        return true
      default:
        return true
    }
  }

  const nextStep = () => {
    const validation = validateCurrentStep()
    if (!validation.valid) {
      setValidationErrors(validation.errors)
      window.scrollTo({ top: 0, behavior: "smooth" })
      return
    }
    setValidationErrors([]) // Clear previous errors if moving forward

    if (canProceedToNextStep() && currentStep < 4) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-2 sm:px-0">
      {validationErrors.length > 0 && (
        <div className="mb-4 rounded-lg border border-red-300 bg-red-50 p-3 sm:mb-6 sm:p-4">
          <h3 className="mb-2 text-sm font-semibold text-red-900 sm:text-base">
            Please fix the following errors:
          </h3>
          <ul className="list-inside list-disc space-y-1 text-xs text-red-800 sm:text-sm">
            {validationErrors.map((error, idx) => (
              <li key={idx}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="mb-6 sm:mb-8">
        <div className="flex items-center justify-between">
          {STEPS.map((step, idx) => (
            <div key={step.id} className="flex flex-1 items-center">
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentStep(step.id)}
                  className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors hover:opacity-80 sm:h-10 sm:w-10 ${
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
                  className={`mx-1 h-0.5 flex-1 sm:mx-2 md:mx-4 ${
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

      <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
        {currentStep === 1 && (
          <div className="space-y-4 sm:space-y-6">
            <div>
              <h2 className="text-xl font-semibold sm:text-2xl">Trip Basics</h2>
              <p className="text-xs text-muted-foreground sm:text-sm">
                Enter the basic information about your golf trip
              </p>
            </div>

            <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-base text-foreground">
                  Trip Title *
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="St. Andrews Golf Experience"
                  required
                />
              </div>

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
                  placeholder="St. Andrews, Scotland"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="description"
                className="text-base text-foreground"
              >
                Trip Overview
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Provide a brief overview of the trip for guests..."
                rows={6}
              />
            </div>

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
                      : continent === "Latin America"
                      ? "L. America"
                      : continent}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label
                  htmlFor="max_guests"
                  className="text-base text-foreground"
                >
                  Max Guests
                </Label>
                <Input
                  id="max_guests"
                  type="number"
                  value={formData.max_guests}
                  onChange={(e) =>
                    setFormData({ ...formData, max_guests: e.target.value })
                  }
                  placeholder="20"
                />
              </div>
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
                restriction, 30 = must book at least 30 days before trip)
              </p>
            </div>

            <div className="space-y-3">
              <Label className="text-base text-foreground">
                Upload Photos for Courses
              </Label>
              {coursePhotos.length > 0 && (
                <div className="grid gap-3 sm:grid-cols-2">
                  {coursePhotos.map((url, index) => (
                    <div
                      key={`${url}-${index}`}
                      draggable
                      onDragStart={() => setDragIndex(index)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => {
                        if (dragIndex !== null && dragIndex !== index) {
                          setCoursePhotos((prev) => {
                            const next = [...prev]
                            const [moved] = next.splice(dragIndex, 1)
                            next.splice(index, 0, moved)
                            return next
                          })
                        }
                        setDragIndex(null)
                      }}
                      onDragEnd={() => setDragIndex(null)}
                      className={`relative aspect-[3/1] w-full overflow-hidden rounded-lg border-2 border-dashed transition-colors ${
                        dragIndex === index ? "border-primary bg-primary/5" : "border-border"
                      } cursor-grab active:cursor-grabbing`}
                    >
                      <div className="absolute left-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded bg-black/50 text-white">
                        <GripVertical className="h-4 w-4" />
                      </div>
                      <Image
                        src={url || "/placeholder.svg"}
                        alt={`Golf course photo ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                      <Button
                        type="button"
                        size="icon"
                        variant="destructive"
                        className="absolute right-2 top-2"
                        onClick={() =>
                          setCoursePhotos((prev) =>
                            prev.filter((_, i) => i !== index),
                          )
                        }
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {coursePhotos.length < 5 && (
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
                    Up to 5 images, JPG/JPEG/PNG under 1MB each
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

            {/* Upload Accommodation Photo */}
            <div className="space-y-3">
              <Label className="text-base text-foreground">
                Upload Accommodation Photo
              </Label>
              {photos.room ? (
                <div className="relative aspect-[3/1] w-full overflow-hidden rounded-lg border-2 border-dashed border-border">
                  <Image
                    src={photos.room || "/placeholder.svg"}
                    alt="Accommodation"
                    fill
                    className="object-cover"
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="destructive"
                    className="absolute right-2 top-2"
                    onClick={() => handleRemovePhoto("room")}
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
                    onChange={(e) => handlePhotoUpload(e, "room")}
                    disabled={uploadingPhoto === "room"}
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
                .filter((pkg) => pkg.name === "Premium") // Updated to check Premium package (was Basic)
                .map((pkg) => (
                  <div
                    key={pkg.id}
                    className="space-y-4 rounded-lg border border-border bg-muted/20 p-4"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">
                        Premium Package (Required)
                      </h4>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-base text-foreground">
                        Package Details (optional)
                      </Label>
                      <Textarea
                        value={pkg.description}
                        onChange={(e) =>
                          updatePackage(pkg.id, "description", e.target.value)
                        }
                        placeholder="What's included in this package..."
                        rows={3}
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label className="text-base text-foreground">
                          Full price per person *
                        </Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={pkg.price}
                          onChange={(e) =>
                            updatePackage(pkg.id, "price", e.target.value)
                          }
                          placeholder="100"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-base text-foreground">
                          Participants per booking *
                        </Label>
                        <Input
                          type="number"
                          value={pkg.participants_per_booking}
                          onChange={(e) =>
                            updatePackage(
                              pkg.id,
                              "participants_per_booking",
                              e.target.value,
                            )
                          }
                          placeholder="2"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label className="text-base text-foreground">
                          Availability
                        </Label>
                        <Select
                          value={pkg.availability}
                          onValueChange={(value) =>
                            updatePackage(pkg.id, "availability", value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="unlimited">Unlimited</SelectItem>
                            <SelectItem value="limited">Limited</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {pkg.availability === "limited" && (
                        <div className="space-y-2">
                          <Label className="text-base text-foreground">
                            Quantity
                          </Label>
                          <Input
                            type="number"
                            value={pkg.quantity}
                            onChange={(e) =>
                              updatePackage(pkg.id, "quantity", e.target.value)
                            }
                            placeholder="10"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}

              {hasUpgradePackage ? (
                packages
                  .filter((pkg) => pkg.name === "Upgrade")
                  .map((pkg) => (
                    <div
                      key={pkg.id}
                      className="space-y-4 rounded-lg border border-border bg-muted/20 p-4"
                    >
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

                      <div className="space-y-2">
                        <Label className="text-base text-foreground">
                          Package Details (optional)
                        </Label>
                        <Textarea
                          value={pkg.description}
                          onChange={(e) =>
                            updatePackage(pkg.id, "description", e.target.value)
                          }
                          placeholder="What's included in this package..."
                          rows={3}
                        />
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label className="text-base text-foreground">
                            Full price per person *
                          </Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={pkg.price}
                            onChange={(e) =>
                              updatePackage(pkg.id, "price", e.target.value)
                            }
                            placeholder="200"
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-base text-foreground">
                            Participants per booking *
                          </Label>
                          <Input
                            type="number"
                            value={pkg.participants_per_booking}
                            onChange={(e) =>
                              updatePackage(
                                pkg.id,
                                "participants_per_booking",
                                e.target.value,
                              )
                            }
                            placeholder="2"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label className="text-base text-foreground">
                            Availability
                          </Label>
                          <Select
                            value={pkg.availability}
                            onValueChange={(value) =>
                              updatePackage(pkg.id, "availability", value)
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
                          <div className="space-y-2">
                            <Label className="text-base text-foreground">
                              Quantity
                            </Label>
                            <Input
                              type="number"
                              value={pkg.quantity}
                              onChange={(e) =>
                                updatePackage(
                                  pkg.id,
                                  "quantity",
                                  e.target.value,
                                )
                              }
                              placeholder="10"
                            />
                          </div>
                        )}
                      </div>
                    </div>
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
              <h2 className="text-2xl font-semibold">Booking Options</h2>
              <p className="text-sm text-muted-foreground">
                Configure golf courses, meals, transportation, and service
                options like Caddy and Golf Cart (all optional)
              </p>
            </div>

            {/* Golf Courses Section */}
            <div className="space-y-4 rounded-lg border border-border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">
                    Golf Courses & Rounds
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Add available golf courses with pricing per round (optional)
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={addGolfCourse}
                  size="sm"
                  className="bg-primary hover:bg-primary/90"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Course
                </Button>
              </div>

              {golfCourses.map((course, index) => (
                <div
                  key={course.id}
                  className="space-y-4 rounded-lg border border-border bg-muted/20 p-4"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">
                      Course {String.fromCharCode(65 + index)}
                    </h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeGolfCourse(course.id)}
                      className="text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label className="text-base text-foreground">
                        Course Name *
                      </Label>
                      <Input
                        value={course.course_name}
                        onChange={(e) =>
                          updateGolfCourse(
                            course.id,
                            "course_name",
                            e.target.value,
                          )
                        }
                        placeholder="Course A"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-base text-foreground">
                        Max Rounds *
                      </Label>
                      <Input
                        type="number"
                        min="0"
                        value={course.max_rounds}
                        onChange={(e) =>
                          updateGolfCourse(
                            course.id,
                            "max_rounds",
                            e.target.value,
                          )
                        }
                        placeholder="5"
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        Maximum rounds available (min: 0)
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-base text-foreground">
                        Number of Holes *
                      </Label>
                      <Input
                        type="number"
                        min="1"
                        value={course.num_holes}
                        onChange={(e) =>
                          updateGolfCourse(
                            course.id,
                            "num_holes",
                            e.target.value,
                          )
                        }
                        placeholder="18"
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        Number of holes per round (e.g., 9, 18)
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {golfCourses.length === 0 && (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  No golf courses added. Click "Add Course" to add courses
                  (optional).
                </div>
              )}
            </div>

            <div className="space-y-4 rounded-lg border border-border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Meals</h3>
                  <p className="text-sm text-muted-foreground">
                    Add meal options for this trip (optional)
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={addMealOption}
                  size="sm"
                  className="bg-primary hover:bg-primary/90"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Meal Option
                </Button>
              </div>

              {mealOptions.map((meal, index) => (
                <div
                  key={meal.id}
                  className="space-y-4 rounded-lg border border-border bg-muted/20 p-4"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Meal Option {index + 1}</h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeMealOption(meal.id)}
                      className="text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-base text-foreground">
                        Option Name *
                      </Label>
                      <Input
                        value={meal.name}
                        onChange={(e) =>
                          updateMealOption(meal.id, "name", e.target.value)
                        }
                        placeholder="e.g., Breakfast Included"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-base text-foreground">
                      Description
                    </Label>
                    <Textarea
                      value={meal.description}
                      onChange={(e) =>
                        updateMealOption(meal.id, "description", e.target.value)
                      }
                      placeholder="Describe this meal option..."
                      rows={2}
                    />
                  </div>
                  <div className="flex items-center justify-start gap-2">
                    <Switch
                      id={`meal-included-${meal.id}`}
                      checked={meal.is_included}
                      onCheckedChange={(checked) =>
                        updateMealOption(meal.id, "is_included", checked)
                      }
                    />
                    <Label
                      htmlFor={`meal-included-${meal.id}`}
                      className="text-base text-foreground"
                    >
                      Included in Package
                    </Label>
                  </div>
                </div>
              ))}

              {mealOptions.length === 0 && (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  No meal options added. Click "Add Meal Option" to add options
                  (optional).
                </div>
              )}
            </div>

            <div className="space-y-4 rounded-lg border border-border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Transportation</h3>
                  <p className="text-sm text-muted-foreground">
                    Add transportation options for this trip (optional)
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={addTransportationOption}
                  size="sm"
                  className="bg-primary hover:bg-primary/90"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Transportation Option
                </Button>
              </div>

              {transportationOptions.map((transport, index) => (
                <div
                  key={transport.id}
                  className="space-y-4 rounded-lg border border-border bg-muted/20 p-4"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">
                      Transportation Option {index + 1}
                    </h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeTransportationOption(transport.id)}
                      className="text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-base text-foreground">
                        Option Name *
                      </Label>
                      <Input
                        value={transport.name}
                        onChange={(e) =>
                          updateTransportationOption(
                            transport.id,
                            "name",
                            e.target.value,
                          )
                        }
                        placeholder="e.g., Private Car with Driver"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-base text-foreground">
                      Description
                    </Label>
                    <Textarea
                      value={transport.description}
                      onChange={(e) =>
                        updateTransportationOption(
                          transport.id,
                          "description",
                          e.target.value,
                        )
                      }
                      placeholder="Describe this transportation option..."
                      rows={2}
                    />
                  </div>
                  <div className="flex items-center justify-start gap-2">
                    <Switch
                      id={`transport-included-${transport.id}`}
                      checked={transport.is_included}
                      onCheckedChange={(checked) =>
                        updateTransportationOption(
                          transport.id,
                          "is_included",
                          checked,
                        )
                      }
                    />
                    <Label
                      htmlFor={`transport-included-${transport.id}`}
                      className="text-base text-foreground"
                    >
                      Included in Package
                    </Label>
                  </div>
                </div>
              ))}

              {transportationOptions.length === 0 && (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  No transportation options added. Click "Add Transportation
                  Option" to add options (optional).
                </div>
              )}
            </div>

            {/* Service Options Section */}
            <div className="space-y-4 rounded-lg border border-border p-6">
              <div>
                <h3 className="text-lg font-semibold">Service Options</h3>
                <p className="text-sm text-muted-foreground">
                  Toggle on if these services are included by default.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-center justify-between rounded-lg border border-border bg-muted/20 p-4">
                  <div>
                    <p className="text-sm font-medium">Caddy Included</p>
                    <p className="text-xs text-muted-foreground">
                      Toggle on if a caddy is included for players.
                    </p>
                  </div>
                  <Switch
                    checked={
                      serviceOptions.find((opt) => opt.name === "Caddy")
                        ?.is_included || false
                    }
                    onCheckedChange={(checked) =>
                      handleServiceOptionToggle("Caddy", checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between rounded-lg border border-border bg-muted/20 p-4">
                  <div>
                    <p className="text-sm font-medium">Golf Cart Included</p>
                    <p className="text-xs text-muted-foreground">
                      Toggle on if a golf cart is included for players.
                    </p>
                  </div>
                  <Switch
                    checked={
                      serviceOptions.find((opt) => opt.name === "Golf Cart")
                        ?.is_included || false
                    }
                    onCheckedChange={(checked) =>
                      handleServiceOptionToggle("Golf Cart", checked)
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold">Review & Submit</h2>
              <p className="text-sm text-muted-foreground">
                Review all trip details before publishing
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
                  {/* Removed Basic Price display */}
                  <div className="grid gap-2 md:grid-cols-2">
                    <div>
                      <span className="font-medium">Max Guests:</span>{" "}
                      {formData.max_guests}
                    </div>
                    {formData.max_days && (
                      <div>
                        <span className="font-medium">Max Days:</span>{" "}
                        {formData.max_days}
                      </div>
                    )}
                    {/* Added min_days display */}
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
                    {/* Removed All-Inclusive display */}
                  </div>
                  <div className="flex flex-wrap gap-4">
                    {coursePhotos.length > 0 && (
                      <div>
                        <p className="mb-1 font-medium">Courses Photos</p>
                        <div className="flex flex-wrap gap-2">
                          {coursePhotos.map((url, index) => (
                            <div
                              key={`${url}-${index}`}
                              className="relative h-20 w-32 overflow-hidden rounded border"
                            >
                              <Image
                                src={url || "/placeholder.svg"}
                                alt={`Course photo ${index + 1}`}
                                fill
                                className="object-cover"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {photos.room && (
                      <div>
                        <p className="mb-1 font-medium">Accommodation Photo</p>
                        <div className="relative h-20 w-32 overflow-hidden rounded border">
                          <Image
                            src={photos.room || "/placeholder.svg"}
                            alt="Accommodation"
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

              <div className="rounded-lg border border-border p-6">
                <h3 className="mb-4 text-lg font-semibold">
                  Golf Courses ({golfCourses.length})
                </h3>
                {golfCourses.length > 0 ? (
                  <div className="space-y-2">
                    {golfCourses.map((course, idx) => (
                      <div
                        key={course.id}
                        className="flex justify-between text-sm"
                      >
                        <span>
                          {course.course_name ||
                            `Course ${String.fromCharCode(65 + idx)}`}
                        </span>
                        <span className="font-medium">
                          {course.num_holes || 18} holes | Max rounds: {course.max_rounds}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No golf courses added
                  </p>
                )}
              </div>

              <div className="rounded-lg border border-border p-6">
                <h3 className="mb-4 text-lg font-semibold">
                  Meal Options ({mealOptions.length})
                </h3>
                {mealOptions.length > 0 ? (
                  <div className="space-y-2">
                    {mealOptions.map((meal) => (
                      <div
                        key={meal.id}
                        className="flex justify-between text-sm"
                      >
                        <span>
                          {meal.name} {meal.is_included && "(Included)"}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No meal options added
                  </p>
                )}
              </div>

              <div className="rounded-lg border border-border p-6">
                <h3 className="mb-4 text-lg font-semibold">
                  Transportation Options ({transportationOptions.length})
                </h3>
                {transportationOptions.length > 0 ? (
                  <div className="space-y-2">
                    {transportationOptions.map((transport) => (
                      <div
                        key={transport.id}
                        className="flex justify-between text-sm"
                      >
                        <span>
                          {transport.name}{" "}
                          {transport.is_included && "(Included)"}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No transportation options added
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-4 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
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

          {currentStep < 4 ? (
            <Button
              type="button"
              onClick={nextStep}
              disabled={!canProceedToNextStep()}
              className="w-full bg-primary hover:bg-primary/90 sm:w-auto"
            >
              Next
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 sm:w-auto"
            >
              {loading ? "Creating Trip..." : "Publish Trip"}
            </Button>
          )}
        </div>
      </form>
    </div>
  )
}
