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
  Languages,
  Loader2,
  CreditCard,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface EditTripFormProps {
  trip: {
    id: string
    title: string
    title_ko?: string | null
    title_de?: string | null
    description: string | null
    description_ko?: string | null
    description_de?: string | null
    overview_content?: string | null
    overview_content_ko?: string | null
    overview_content_de?: string | null
    refund_policy?: string | null
    refund_policy_ko?: string | null
    refund_policy_de?: string | null
    location: string
    location_ko?: string | null
    location_de?: string | null
    highlights?: string[]
    highlights_ko?: string[] | null
    highlights_de?: string[] | null
    continent: string | null
    price_regular: number
    max_guests: number
    max_days?: number | null
    min_days?: number | null
    min_days_advance?: number | null
    courses_photo_url: string | null
    room_photo_url: string | null
    show_from_price?: boolean
    deposit_percentage?: number | null
    images?: { id: string; image_url: string; display_order: number | null }[]
    packages?: any[]
    golf_courses?: any[]
    meal_options?: any[]
    transportation_options?: any[]
    service_options?: any[]
  }
}

interface TripData {
  title: string
  title_ko: string
  title_de: string
  description: string
  description_ko: string
  description_de: string
  overview_content: string
  overview_content_ko: string
  overview_content_de: string
  refund_policy: string
  refund_policy_ko: string
  refund_policy_de: string
  location: string
  location_ko: string
  location_de: string
  continent: string
  price_regular: number
  max_guests: string
  max_days: string
  min_days_advance: string
  min_days: string
}

type Lang = "en" | "ko" | "de"

const CONTINENTS = ["World", "Asia", "Europe", "North America", "Latin America"]

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
  const [activeLang, setActiveLang] = useState<Lang>("en")

  const [formData, setFormData] = useState<TripData>({
    title: trip.title || "",
    title_ko: trip.title_ko || "",
    title_de: trip.title_de || "",
    description: trip.description || "",
    description_ko: trip.description_ko || "",
    description_de: trip.description_de || "",
    overview_content: trip.overview_content || "",
    overview_content_ko: trip.overview_content_ko || "",
    overview_content_de: trip.overview_content_de || "",
    refund_policy: trip.refund_policy || "",
    refund_policy_ko: trip.refund_policy_ko || "",
    refund_policy_de: trip.refund_policy_de || "",
    location: trip.location || "",
    location_ko: trip.location_ko || "",
    location_de: trip.location_de || "",
    continent: trip.continent || "",
    price_regular: trip.price_regular || 0,
    max_guests: trip.max_guests?.toString() || "20",
    max_days: trip.max_days?.toString() || "",
    min_days_advance: trip.min_days_advance?.toString() || "0",
    min_days: trip.min_days?.toString() || "1",
  })
  const [highlights, setHighlights] = useState<string[]>(trip.highlights || [])
  const [highlights_ko, setHighlights_ko] = useState<string[]>(trip.highlights_ko || [])
  const [highlights_de, setHighlights_de] = useState<string[]>(trip.highlights_de || [])
  const [coursePhotos, setCoursePhotos] = useState<string[]>(() => {
    const existing: string[] = []
    if (trip.courses_photo_url) existing.push(trip.courses_photo_url)
    if (trip.images && trip.images.length > 0) {
      const sorted = [...trip.images].sort(
        (a, b) => (a.display_order ?? 0) - (b.display_order ?? 0),
      )
      for (const img of sorted) {
        if (img.image_url && !existing.includes(img.image_url)) {
          existing.push(img.image_url)
        }
      }
    }
    return existing.slice(0, 5)
  })

  const [showFromPrice, setShowFromPrice] = useState(trip.show_from_price ?? false)
  const [depositPercentage, setDepositPercentage] = useState(trip.deposit_percentage ?? 30)
  const [photos, setPhotos] = useState({
    room: trip.room_photo_url || "",
  })
  const [uploadingPhoto, setUploadingPhoto] = useState<string | null>(null)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  
  // Translation state
  const [translateSource, setTranslateSource] = useState<"en" | "ko" | "de">("en")
  const [translateTargets, setTranslateTargets] = useState<("en" | "ko" | "de")[]>([])
  const [isTranslating, setIsTranslating] = useState(false)
  const [translateResult, setTranslateResult] = useState<{ success: boolean; partial?: boolean; message: string } | null>(null)
  const [translateProgress, setTranslateProgress] = useState<{ done: number; total: number; label: string } | null>(null)
  
  // Stripe state
  const [generatingStripe, setGeneratingStripe] = useState(false)
  const [stripeResult, setStripeResult] = useState<{ success: boolean; message: string } | null>(null)
  
  // Determine which languages have content
  const getAvailableSourceLanguages = (): ("en" | "ko" | "de")[] => {
    const langs: ("en" | "ko" | "de")[] = []
    if (formData.title?.trim()) langs.push("en")
    if (formData.title_ko?.trim()) langs.push("ko")
    if (formData.title_de?.trim()) langs.push("de")
    return langs.length > 0 ? langs : ["en"]
  }

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
        price_per_extra_night: premiumPkg.price_per_extra_night || null,
      })
    } else {
      pkgs.push({
        id: "premium",
        name: "Premium",
        description: "",
        price: 0,
        price_per_extra_night: null,
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
        price_per_extra_night: upgradePkg.price_per_extra_night || null,
      })
    }

    return pkgs
  }

  const [packages, setPackages] = useState(initializePackages())
  const [hasUpgradePackage, setHasUpgradePackage] = useState(() =>
    (trip.packages || []).some(
      (p: any) => p.name === "Upgrade",
    ),
  )

  const [golfCourses, setGolfCourses] = useState(() => {
    return (trip.golf_courses || []).map((course: any) => ({
      id: course.id,
      name: course.course_name || course.name || "",
      name_ko: course.course_name_ko || "",
      name_de: course.course_name_de || "",
      description: course.description || "",
      description_ko: course.description_ko || "",
      description_de: course.description_de || "",
      max_rounds: course.max_rounds || 5,
      num_holes: course.num_holes || 18,
    }))
  })
  const [mealOptions, setMealOptions] = useState(() => {
    return (trip.meal_options || []).map((meal: any) => ({
      id: meal.id,
      name: meal.name || "",
      name_ko: meal.name_ko || "",
      name_de: meal.name_de || "",
      description: meal.description || "",
      description_ko: meal.description_ko || "",
      description_de: meal.description_de || "",
      is_included: meal.is_included || false,
    }))
  })
  const [transportationOptions, setTransportationOptions] = useState(() => {
    return (trip.transportation_options || []).map((transport: any) => ({
      id: transport.id,
      name: transport.name || "",
      name_ko: transport.name_ko || "",
      name_de: transport.name_de || "",
      description: transport.description || "",
      description_ko: transport.description_ko || "",
      description_de: transport.description_de || "",
      is_included: transport.is_included || false,
    }))
  })
  const [serviceOptions, setServiceOptions] = useState(() => {
    const defaultServices = [
      {
        id: `caddy-${Date.now()}`,
        name: "Caddy",
        name_ko: "",
        name_de: "",
        description: "",
        description_ko: "",
        description_de: "",
        is_included: false,
      },
      {
        id: `golf-cart-${Date.now()}`,
        name: "Golf Cart",
        name_ko: "",
        name_de: "",
        description: "",
        description_ko: "",
        description_de: "",
        is_included: false,
      },
    ]
    if (!trip.service_options?.length) return defaultServices
    return trip.service_options.map((service: any) => ({
      id: service.id,
      name: service.name || "",
      name_ko: service.name_ko || "",
      name_de: service.name_de || "",
      description: service.description || "",
      description_ko: service.description_ko || "",
      description_de: service.description_de || "",
      is_included: service.is_included || false,
    }))
  })

  const handlePhotoUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    photoType: "courses" | "room",
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

      if (!response.ok) {
        const raw = await response.text().catch(() => "")
        let message = "Upload failed"
        try {
          const parsed = raw ? JSON.parse(raw) : {}
          message = parsed?.error || message
        } catch {
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

  const addUpgradePackage = () => {
    if (!hasUpgradePackage) {
      setPackages([
        ...packages,
        {
          id: "upgrade",
          name: "Upgrade",
          description: "",
          price: 0,
          price_per_extra_night: null,
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
        name_ko: "",
        name_de: "",
        description: "",
        description_ko: "",
        description_de: "",
        num_holes: 18,
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
        name_ko: "",
        name_de: "",
        description: "",
        description_ko: "",
        description_de: "",
        is_included: false,
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
        name_ko: "",
        name_de: "",
        description: "",
        description_ko: "",
        description_de: "",
        is_included: false,
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

  const handleServiceOptionToggle = (name: string, value: boolean) => {
    let updated = [...serviceOptions]
    const existingIndex = updated.findIndex((opt) => opt.name === name)

    if (existingIndex >= 0) {
      updated[existingIndex] = {
        ...updated[existingIndex],
        is_included: value,
      }
    } else {
      updated.push({
        id: `${name.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`,
        name,
        name_ko: "",
        name_de: "",
        description: "",
        description_ko: "",
        description_de: "",
        is_included: value,
      })
    }

    setServiceOptions(updated)
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
          Number(formData.max_guests) > 0
          // price_regular is optional - removed the !== 0 check that was blocking
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
          // Only send Korean if user explicitly entered it, otherwise let auto-translate handle it
          ...(formData.title_ko?.trim() && { title_ko: formData.title_ko }),
          description: formData.description,
          ...(formData.description_ko?.trim() && { description_ko: formData.description_ko }),
          overview_content: formData.overview_content || null,
          ...(formData.overview_content_ko?.trim() && { overview_content_ko: formData.overview_content_ko }),
          refund_policy: formData.refund_policy || null,
          ...(formData.refund_policy_ko?.trim() && { refund_policy_ko: formData.refund_policy_ko }),
          location: formData.location,
          ...(formData.location_ko?.trim() && { location_ko: formData.location_ko }),
          continent: formData.continent,
          price_regular: Number(formData.price_regular),
          max_guests: Number(formData.max_guests),
          max_days: formData.max_days ? Number(formData.max_days) : null,
          min_days: Number(formData.min_days),
          min_days_advance: Number(formData.min_days_advance),
          courses_photo_url: coursePhotos[0] || null,
          course_images: coursePhotos,
      room_photo_url: photos.room || null,
      show_from_price: showFromPrice,
      deposit_percentage: depositPercentage,
      highlights: highlights.filter((h) => h.trim() !== ""),
          // Only send Korean highlights if any were entered
          ...(highlights_ko.some((h) => h.trim()) && { highlights_ko: highlights_ko.filter((h) => h.trim() !== "") }),
          packages,
          golf_courses: golfCourses.map((course) => ({
            ...course,
            course_name: course.name,
            course_name_ko: course.name_ko || null,
            course_name_de: course.name_de || null,
            description_ko: course.description_ko || null,
            description_de: course.description_de || null,
          })),
          meal_options: mealOptions.map((meal) => ({
            ...meal,
            name_ko: meal.name_ko || null,
            name_de: meal.name_de || null,
            description_ko: meal.description_ko || null,
            description_de: meal.description_de || null,
          })),
          transportation_options: transportationOptions.map((transport) => ({
            ...transport,
            name_ko: transport.name_ko || null,
            name_de: transport.name_de || null,
            description_ko: transport.description_ko || null,
            description_de: transport.description_de || null,
          })),
          service_options: serviceOptions.map((service) => ({
            ...service,
            name_ko: service.name_ko || null,
            name_de: service.name_de || null,
            description_ko: service.description_ko || null,
            description_de: service.description_de || null,
          })),
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

  const handleTranslate = async () => {
    if (translateTargets.length === 0 || isTranslating) return
    
    setIsTranslating(true)
    setTranslateResult(null)
    setTranslateProgress(null)
    
    try {
      const response = await fetch(`/api/admin/translate-trip/${trip.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceLanguage: translateSource,
          targetLanguages: translateTargets,
        }),
      })
      
      if (!response.ok) {
        // Non-streaming error response
        const data = await response.json().catch(() => ({}))
        let errorMessage = data.error || "Translation failed"
        
        if (data.code === "CREDITS_EXHAUSTED" || response.status === 402) {
          errorMessage = "AI Gateway credits exhausted. Please refill your AI Gateway credits in the Vercel dashboard to continue translating."
        } else if (data.code === "RATE_LIMIT" || response.status === 429) {
          errorMessage = "Rate limit exceeded. Please wait a moment and try again."
        } else if (data.code === "AUTH_ERROR" || response.status === 401) {
          errorMessage = "AI Gateway authentication failed. Please check your API configuration."
        }
        
        setTranslateResult({ success: false, message: errorMessage })
        setIsTranslating(false)
        return
      }
      
      // Parse NDJSON stream
      const reader = response.body?.getReader()
      if (!reader) throw new Error("No response body")
      
      const decoder = new TextDecoder()
      let buffer = ""
      
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n")
        buffer = lines.pop() || ""
        
        for (const line of lines) {
          if (!line.trim()) continue
          try {
            const event = JSON.parse(line)
            if (event.type === "start") {
              setTranslateProgress({ done: 0, total: event.total, label: "Starting..." })
            } else if (event.type === "progress") {
              setTranslateProgress({ done: event.done, total: event.total, label: event.label || "" })
            } else if (event.type === "complete") {
              const partial = event.applied < event.requested
              setTranslateResult({
                success: true,
                partial,
                message: partial
                  ? `Translated ${event.applied} of ${event.requested} fields. Some fields may need manual review.`
                  : `Successfully translated ${event.applied} fields.`,
              })
              router.refresh()
            } else if (event.type === "error") {
              setTranslateResult({ success: false, message: event.error || "Translation failed" })
            }
          } catch {
            // Skip invalid JSON lines
          }
        }
      }
    } catch (error) {
      setTranslateResult({ success: false, message: "Failed to connect to translation service. Please check your network connection." })
    } finally {
      setIsTranslating(false)
      setTranslateProgress(null)
    }
  }

  const handleGenerateStripe = async () => {
    if (generatingStripe) return
    
    setGeneratingStripe(true)
    setStripeResult(null)
    
    try {
      const response = await fetch("/api/admin/stripe/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tripId: trip.id }),
      })
      
      const data = await response.json()
      
      if (response.ok) {
        const created = data.results.filter((r: any) => r.status === "created").length
        const skipped = data.results.filter((r: any) => r.status === "skipped").length
        const errors = data.results.filter((r: any) => r.status === "error").length
        
        let message = `Stripe configuration complete. `
        if (created > 0) message += `${created} package(s) configured. `
        if (skipped > 0) message += `${skipped} already configured. `
        if (errors > 0) message += `${errors} error(s).`
        
        setStripeResult({ success: errors === 0, message: message.trim() })
        router.refresh()
      } else {
        setStripeResult({ success: false, message: data.error || "Failed to generate Stripe configuration" })
      }
    } catch (error) {
      setStripeResult({ success: false, message: "Failed to connect to server. Please try again." })
    } finally {
      setGeneratingStripe(false)
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
    <div className="mx-auto max-w-5xl px-2 sm:px-0">
      {showDeleteDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-card p-4 shadow-lg sm:p-6">
            <h3 className="mb-3 text-base font-semibold sm:mb-4 sm:text-lg">
              Delete Trip
            </h3>
            <p className="mb-4 text-xs text-muted-foreground sm:mb-6 sm:text-sm">
              Are you sure you want to delete this trip? This action cannot be
              undone. All packages, add-ons, and bookings associated with this
              trip will also be deleted.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(false)}
                disabled={deleting}
                className="flex-1 text-sm"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 text-sm"
              >
                {deleting ? "Deleting..." : "Delete Trip"}
              </Button>
            </div>
          </div>
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
                Update the basic information about your golf trip
              </p>
            </div>

            {/* Language Tabs */}
            <div className="flex gap-1 rounded-lg border border-border bg-muted p-1 w-fit">
              {(["en", "ko", "de"] as Lang[]).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setActiveLang(lang)}
                  className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                    activeLang === lang
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {lang === "en" ? "English" : lang === "ko" ? "Korean" : "German"}
                </button>
              ))}
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm text-foreground sm:text-base">
                Title of place {activeLang === "en" && "*"}
                {activeLang !== "en" && <span className="ml-1 text-xs text-muted-foreground">({activeLang.toUpperCase()} translation)</span>}
              </Label>
              <Input
                id="title"
                value={activeLang === "en" ? formData.title : activeLang === "ko" ? formData.title_ko : formData.title_de}
                onChange={(e) => setFormData({ ...formData, [`title${activeLang === "en" ? "" : `_${activeLang}`}`]: e.target.value })}
                placeholder={activeLang === "en" ? "Title of place" : activeLang === "ko" ? "장소 이름" : "Ortsname"}
                required={activeLang === "en"}
                className="h-10 sm:h-12"
              />
            </div>

            {/* Trip Overview */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm text-foreground sm:text-base">
                Trip Overview
                {activeLang !== "en" && <span className="ml-1 text-xs text-muted-foreground">({activeLang.toUpperCase()} translation)</span>}
              </Label>
              <Textarea
                id="description"
                value={activeLang === "en" ? formData.description : activeLang === "ko" ? formData.description_ko : formData.description_de}
                onChange={(e) => setFormData({ ...formData, [`description${activeLang === "en" ? "" : `_${activeLang}`}`]: e.target.value })}
                placeholder={activeLang === "en" ? "Provide a brief overview of the trip for guests..." : activeLang === "ko" ? "한국어로 여행 개요를 입력하세요..." : "Reisebeschreibung auf Deutsch..."}
                rows={6}
                className="resize-none"
              />
            </div>

            {/* Overview Content - Detailed overview shown on trip detail page */}
            <div className="space-y-2">
              <Label htmlFor="overview_content" className="text-sm text-foreground sm:text-base">
                Detailed Overview (Optional)
                {activeLang !== "en" && <span className="ml-1 text-xs text-muted-foreground">({activeLang.toUpperCase()} translation)</span>}
              </Label>
              <Textarea
                id="overview_content"
                value={activeLang === "en" ? formData.overview_content : activeLang === "ko" ? formData.overview_content_ko : formData.overview_content_de}
                onChange={(e) => setFormData({ ...formData, [`overview_content${activeLang === "en" ? "" : `_${activeLang}`}`]: e.target.value })}
                placeholder={activeLang === "en" ? "Provide a detailed overview shown on the trip detail page..." : activeLang === "ko" ? "한국어로 상세한 여행 개요를 입력하세요..." : "Detaillierte Reisebeschreibung auf Deutsch..."}
                rows={8}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                This detailed overview will be displayed on the trip detail page. If empty, the Trip Overview above will be used.
              </p>
            </div>

            {/* Refund Policy */}
            <div className="space-y-2">
              <Label htmlFor="refund_policy" className="text-sm text-foreground sm:text-base">
                Refund Policy (Optional)
                {activeLang !== "en" && <span className="ml-1 text-xs text-muted-foreground">({activeLang.toUpperCase()} translation)</span>}
              </Label>
              <Textarea
                id="refund_policy"
                value={activeLang === "en" ? formData.refund_policy : activeLang === "ko" ? formData.refund_policy_ko : formData.refund_policy_de}
                onChange={(e) => setFormData({ ...formData, [`refund_policy${activeLang === "en" ? "" : `_${activeLang}`}`]: e.target.value })}
                placeholder={activeLang === "en" ? "Enter the refund policy specific to this trip..." : activeLang === "ko" ? "한국어로 환불 정책을 입력하세요..." : "Rückerstattungsrichtlinie auf Deutsch..."}
                rows={4}
                className="resize-none"
              />
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location" className="text-base text-foreground">
                Location {activeLang === "en" && "*"}
                {activeLang !== "en" && <span className="ml-1 text-xs text-muted-foreground">({activeLang.toUpperCase()} translation)</span>}
              </Label>
              <Input
                id="location"
                value={activeLang === "en" ? formData.location : activeLang === "ko" ? formData.location_ko : formData.location_de}
                onChange={(e) => setFormData({ ...formData, [`location${activeLang === "en" ? "" : `_${activeLang}`}`]: e.target.value })}
                placeholder={activeLang === "en" ? "e.g., Pebble Beach, California" : activeLang === "ko" ? "예: 페블 비치, 캘리포니아" : "z.B. Pebble Beach, Kalifornien"}
                required={activeLang === "en"}
                className="h-12"
              />
            </div>

            {/* Highlights */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base text-foreground">
                  Highlights (Optional)
                  {activeLang !== "en" && <span className="ml-1 text-xs text-muted-foreground">({activeLang.toUpperCase()} translation)</span>}
                </Label>
                <Button
                  type="button"
                  onClick={() => {
                    if (activeLang === "en") setHighlights([...highlights, ""])
                    else if (activeLang === "ko") setHighlights_ko([...highlights_ko, ""])
                    else setHighlights_de([...highlights_de, ""])
                  }}
                  size="sm"
                  variant="outline"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Highlight
                </Button>
              </div>
              {(() => {
                const activeHighlights = activeLang === "en" ? highlights : activeLang === "ko" ? highlights_ko : highlights_de
                const setActive = activeLang === "en" ? setHighlights : activeLang === "ko" ? setHighlights_ko : setHighlights_de
                return activeHighlights.length > 0 ? (
                  <div className="space-y-2">
                    {activeHighlights.map((highlight, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={highlight}
                          onChange={(e) => {
                            const updated = [...activeHighlights]
                            updated[index] = e.target.value
                            setActive(updated)
                          }}
                          placeholder={activeLang === "ko" ? "예: 멋진 호텔 숙박" : "e.g., Stay at this nice hotel"}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setActive(activeHighlights.filter((_, i) => i !== index))}
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
                )
              })()}
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
                      : continent === "Latin America"
                      ? "L. America"
                      : continent}
                  </button>
                ))}
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

            {/* Upload Photo for Accommodation */}
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

            {/* Language Tabs for Packages */}
            <div className="flex items-center gap-3">
              <Languages className="h-5 w-5 text-muted-foreground" />
              <Tabs value={activeLang} onValueChange={(v) => setActiveLang(v as Lang)}>
                <TabsList className="grid w-fit grid-cols-3">
                  <TabsTrigger value="en" className="text-sm">
                    English
                  </TabsTrigger>
                  <TabsTrigger value="ko" className="text-sm">
                    Korean
                  </TabsTrigger>
                  <TabsTrigger value="de" className="text-sm">
                    German
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              <p className="text-xs text-muted-foreground">
                {activeLang === "en" && "Editing English content"}
                {activeLang === "ko" && "Editing Korean translation"}
                {activeLang === "de" && "Editing German translation"}
              </p>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border p-4">
              <div>
                <Label className="text-base font-medium text-foreground">
                  {'Show "From" before price'}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {'Displays "From $X" on the trip card instead of a fixed price'}
                </p>
              </div>
              <Switch
                checked={showFromPrice}
                onCheckedChange={setShowFromPrice}
              />
            </div>

            {/* Deposit Percentage Setting */}
            <div className="space-y-4 rounded-lg border border-border p-4">
              <div>
                <Label className="text-base font-medium text-foreground">
                  Deposit Percentage
                </Label>
                <p className="text-sm text-muted-foreground">
                  Configure the deposit percentage customers can pay when booking. They can choose between this percentage or full payment.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setDepositPercentage(30)}
                  className={`px-4 py-2 text-sm font-medium rounded-md border transition-colors ${
                    depositPercentage === 30
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background text-foreground border-border hover:bg-muted'
                  }`}
                >
                  30%
                </button>
                <button
                  type="button"
                  onClick={() => setDepositPercentage(50)}
                  className={`px-4 py-2 text-sm font-medium rounded-md border transition-colors ${
                    depositPercentage === 50
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background text-foreground border-border hover:bg-muted'
                  }`}
                >
                  50%
                </button>
                <button
                  type="button"
                  onClick={() => setDepositPercentage(100)}
                  className={`px-4 py-2 text-sm font-medium rounded-md border transition-colors ${
                    depositPercentage === 100
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background text-foreground border-border hover:bg-muted'
                  }`}
                >
                  100% (Full)
                </button>
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Custom: {depositPercentage}%</Label>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={depositPercentage}
                  onChange={(e) => setDepositPercentage(Number(e.target.value))}
                  className="w-full"
                />
              </div>
              {depositPercentage < 100 && (
                <p className="text-xs text-muted-foreground">
                  Customers will be able to choose between paying {depositPercentage}% deposit or 100% full payment at checkout.
                </p>
              )}
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
                            Price Per Extra Night
                          </Label>
                          <Input
                            type="number"
                            value={pkg.price_per_extra_night || ""}
                            onChange={(e) =>
                              handlePackageChange(
                                packages.findIndex((p) => p.id === pkg.id),
                                "price_per_extra_night",
                                e.target.value ? Number(e.target.value) : null,
                              )
                            }
                            placeholder="0"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Extra cost per night beyond minimum stay (optional)
                          </p>
                        </div>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
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
                      </div>
                      <div>
                        <Label className="text-base text-foreground">
                          Package Details {activeLang === "ko" && <span className="text-xs text-muted-foreground">(Korean)</span>}{activeLang === "de" && <span className="text-xs text-muted-foreground">(German)</span>}
                        </Label>
                        <Textarea
                          value={activeLang === "en" ? (pkg.description || "") : activeLang === "ko" ? (pkg.description_ko || "") : (pkg.description_de || "")}
                          onChange={(e) => {
                            const fieldName = activeLang === "en" ? "description" : activeLang === "ko" ? "description_ko" : "description_de"
                            handlePackageChange(
                              packages.findIndex((p) => p.id === pkg.id),
                              fieldName,
                              e.target.value,
                            )
                          }}
                          placeholder="What's included in this package..."
                          rows={2}
                        />
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
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
                            Package Details {activeLang === "ko" && <span className="text-xs text-muted-foreground">(Korean)</span>}{activeLang === "de" && <span className="text-xs text-muted-foreground">(German)</span>}
                          </Label>
                          <Textarea
                            value={activeLang === "en" ? (pkg.description || "") : activeLang === "ko" ? (pkg.description_ko || "") : (pkg.description_de || "")}
                            onChange={(e) => {
                              const fieldName = activeLang === "en" ? "description" : activeLang === "ko" ? "description_ko" : "description_de"
                              handlePackageChange(
                                packages.findIndex((p) => p.id === pkg.id),
                                fieldName,
                                e.target.value,
                              )
                            }}
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
                Configure golf courses, meals, transportation, and service
                options like Caddy and Golf Cart (all optional)
              </p>
            </div>

            {/* Language Tabs for Booking Options */}
            <div className="flex items-center gap-3">
              <Languages className="h-5 w-5 text-muted-foreground" />
              <Tabs value={activeLang} onValueChange={(v) => setActiveLang(v as Lang)}>
                <TabsList className="grid w-fit grid-cols-3">
                  <TabsTrigger value="en" className="text-sm">
                    English
                  </TabsTrigger>
                  <TabsTrigger value="ko" className="text-sm">
                    Korean
                  </TabsTrigger>
                  <TabsTrigger value="de" className="text-sm">
                    German
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              <p className="text-xs text-muted-foreground">
                {activeLang === "en" && "Editing English content"}
                {activeLang === "ko" && "Editing Korean translation"}
                {activeLang === "de" && "Editing German translation"}
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
                          Course Name {activeLang === "en" && "*"}
                        </Label>
                        <Input
                          value={
                            activeLang === "en"
                              ? (course.name || "")
                              : activeLang === "ko"
                                ? (course.name_ko || "")
                                : (course.name_de || "")
                          }
                          onChange={(e) =>
                            handleGolfCourseChange(
                              index,
                              activeLang === "en"
                                ? "name"
                                : activeLang === "ko"
                                  ? "name_ko"
                                  : "name_de",
                              e.target.value,
                            )
                          }
                          placeholder={
                            activeLang === "en"
                              ? "e.g., Course A"
                              : activeLang === "ko"
                                ? "예: 코스 A"
                                : "z.B. Platz A"
                          }
                          required={activeLang === "en"}
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
                      <div>
                        <Label className="text-base text-foreground">
                          Number of Holes *
                        </Label>
                        <Input
                          type="number"
                          min="1"
                          value={course.num_holes || 18}
                          onChange={(e) =>
                            handleGolfCourseChange(
                              index,
                              "num_holes",
                              Number(e.target.value),
                            )
                          }
                          placeholder="18"
                          required
                        />
                        <p className="text-xs text-muted-foreground">
                          Holes per round (e.g., 9, 18)
                        </p>
                      </div>
                    </div>
                    <div>
                      <Label className="text-base text-foreground">
                        Course Details
                      </Label>
                      <Textarea
                        value={
                          activeLang === "en"
                            ? (course.description || "")
                            : activeLang === "ko"
                              ? (course.description_ko || "")
                              : (course.description_de || "")
                        }
                        onChange={(e) =>
                          handleGolfCourseChange(
                            index,
                            activeLang === "en"
                              ? "description"
                              : activeLang === "ko"
                                ? "description_ko"
                                : "description_de",
                            e.target.value,
                          )
                        }
                        placeholder={
                          activeLang === "en"
                            ? "Course description (optional)"
                            : activeLang === "ko"
                              ? "코스 설명 (선택사항)"
                              : "Platzbeschreibung (optional)"
                        }
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
                          Option Name {activeLang === "en" && "*"}
                        </Label>
                        <Input
                          value={
                            activeLang === "en"
                              ? (meal.name || "")
                              : activeLang === "ko"
                                ? (meal.name_ko || "")
                                : (meal.name_de || "")
                          }
                          onChange={(e) =>
                            handleMealOptionChange(
                              index,
                              activeLang === "en"
                                ? "name"
                                : activeLang === "ko"
                                  ? "name_ko"
                                  : "name_de",
                              e.target.value,
                            )
                          }
                          placeholder={
                            activeLang === "en"
                              ? "e.g., Breakfast Included"
                              : activeLang === "ko"
                                ? "예: 조식 포함"
                                : "z.B. Frühstück inklusive"
                          }
                          required={activeLang === "en"}
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-base text-foreground">
                        Description
                      </Label>
                      <Textarea
                        value={
                          activeLang === "en"
                            ? (meal.description || "")
                            : activeLang === "ko"
                              ? (meal.description_ko || "")
                              : (meal.description_de || "")
                        }
                        onChange={(e) =>
                          handleMealOptionChange(
                            index,
                            activeLang === "en"
                              ? "description"
                              : activeLang === "ko"
                                ? "description_ko"
                                : "description_de",
                            e.target.value,
                          )
                        }
                        placeholder={
                          activeLang === "en"
                            ? "Meal option description"
                            : activeLang === "ko"
                              ? "식사 옵션 설명"
                              : "Beschreibung der Mahlzeitoption"
                        }
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
                          Option Name {activeLang === "en" && "*"}
                        </Label>
                        <Input
                          value={
                            activeLang === "en"
                              ? (transport.name || "")
                              : activeLang === "ko"
                                ? (transport.name_ko || "")
                                : (transport.name_de || "")
                          }
                          onChange={(e) =>
                            handleTransportationOptionChange(
                              index,
                              activeLang === "en"
                                ? "name"
                                : activeLang === "ko"
                                  ? "name_ko"
                                  : "name_de",
                              e.target.value,
                            )
                          }
                          placeholder={
                            activeLang === "en"
                              ? "e.g., Private Car with Driver"
                              : activeLang === "ko"
                                ? "예: 기사가 있는 개인 차량"
                                : "z.B. Privatauto mit Fahrer"
                          }
                          required={activeLang === "en"}
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-base text-foreground">
                        Description
                      </Label>
                      <Textarea
                        value={
                          activeLang === "en"
                            ? (transport.description || "")
                            : activeLang === "ko"
                              ? (transport.description_ko || "")
                              : (transport.description_de || "")
                        }
                        onChange={(e) =>
                          handleTransportationOptionChange(
                            index,
                            activeLang === "en"
                              ? "description"
                              : activeLang === "ko"
                                ? "description_ko"
                                : "description_de",
                            e.target.value,
                          )
                        }
                        placeholder={
                          activeLang === "en"
                            ? "Transportation option description"
                            : activeLang === "ko"
                              ? "교통편 옵션 설명"
                              : "Beschreibung der Transportoption"
                        }
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

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base text-foreground">
                  Service Options
                </Label>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Card className="p-4 flex items-center justify-between">
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
                </Card>

                <Card className="p-4 flex items-center justify-between">
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
                </Card>
              </div>
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold">Review & Submit</h2>
                <p className="text-sm text-muted-foreground">
                  Review all changes before saving
                </p>
              </div>
              {/* Language Tabs for Preview */}
              <div className="flex gap-1 rounded-lg border border-border bg-muted p-1">
                {(["en", "ko", "de"] as Lang[]).map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setActiveLang(lang)}
                    className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                      activeLang === lang
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {lang === "en" ? "English" : lang === "ko" ? "Korean" : "German"}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              {/* Trip Basics Summary */}
              <div className="rounded-lg border border-border p-6">
                <h3 className="mb-4 text-lg font-semibold">Trip Basics</h3>
                <div className="grid gap-4 text-sm">
                  <div>
                    <span className="font-medium">Title:</span>{" "}
                    {activeLang === "en" ? (formData.title || "Not set") : activeLang === "ko" ? (formData.title_ko || <span className="text-muted-foreground italic">No Korean translation</span>) : (formData.title_de || <span className="text-muted-foreground italic">No German translation</span>)}
                  </div>
                  <div>
                    <span className="font-medium">Location:</span>{" "}
                    {activeLang === "en" ? (formData.location || "Not set") : activeLang === "ko" ? (formData.location_ko || <span className="text-muted-foreground italic">No Korean translation</span>) : (formData.location_de || <span className="text-muted-foreground italic">No German translation</span>)}
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
                    {(() => {
                      const desc = activeLang === "en" ? formData.description : activeLang === "ko" ? formData.description_ko : formData.description_de
                      return desc ? (
                        <span className="text-muted-foreground">{desc}</span>
                      ) : activeLang === "en" ? (
                        "Not set"
                      ) : (
                        <span className="text-muted-foreground italic">No {activeLang === "ko" ? "Korean" : "German"} translation</span>
                      )
                    })()}
                  </div>
                  {(() => {
                    const activeHighlights = activeLang === "en" ? highlights : activeLang === "ko" ? highlights_ko : highlights_de
                    return activeHighlights.length > 0 ? (
                      <div>
                        <span className="font-medium">Highlights:</span>
                        <ul className="mt-2 list-inside list-disc space-y-1 text-muted-foreground">
                          {activeHighlights
                            .filter((h) => h.trim())
                            .map((highlight, idx) => (
                              <li key={idx}>{highlight}</li>
                            ))}
                        </ul>
                      </div>
                    ) : activeLang !== "en" && highlights.length > 0 ? (
                      <div>
                        <span className="font-medium">Highlights:</span>{" "}
                        <span className="text-muted-foreground italic">No {activeLang === "ko" ? "Korean" : "German"} translation</span>
                      </div>
                    ) : null
                  })()}
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
                          <span className="font-medium">Holes:</span>{" "}
                          {course.num_holes || 18} |{" "}
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

              {/* Translation Section */}
              <div className="rounded-lg border border-border p-6">
                <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                  <Languages className="h-5 w-5" />
                  Translate Content
                </h3>
                <p className="mb-4 text-sm text-muted-foreground">
                  Translate this trip&apos;s content to other languages. Select a source language and choose which languages to translate into.
                </p>
                
                <div className="space-y-4">
                  {/* Source Language */}
                  <div>
                    <label className="mb-2 block text-sm font-medium">Source Language</label>
                    <div className="flex gap-2">
                      {getAvailableSourceLanguages().map((lang) => (
                        <button
                          key={lang}
                          type="button"
                          onClick={() => {
                            setTranslateSource(lang)
                            setTranslateTargets(prev => prev.filter(l => l !== lang))
                          }}
                          className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
                            translateSource === lang
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border bg-background hover:border-primary/50"
                          }`}
                        >
                          {lang === "en" ? "English" : lang === "ko" ? "Korean" : "German"}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Target Languages */}
                  <div>
                    <label className="mb-2 block text-sm font-medium">Translate To</label>
                    <div className="flex gap-2">
                      {(["en", "ko", "de"] as const).filter(l => l !== translateSource).map((lang) => (
                        <button
                          key={lang}
                          type="button"
                          onClick={() => {
                            setTranslateTargets(prev => 
                              prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]
                            )
                          }}
                          className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
                            translateTargets.includes(lang)
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border bg-background hover:border-primary/50"
                          }`}
                        >
                          {lang === "en" ? "English" : lang === "ko" ? "Korean" : "German"}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Translate Button */}
                  <Button
                    type="button"
                    onClick={handleTranslate}
                    disabled={isTranslating || translateTargets.length === 0}
                    className="w-full sm:w-auto"
                  >
                    {isTranslating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Translating...
                      </>
                    ) : (
                      <>
                        <Languages className="mr-2 h-4 w-4" />
                        Translate
                      </>
                    )}
                  </Button>
                  
                  {/* Progress Bar */}
                  {isTranslating && translateProgress && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          Translating {translateProgress.done} of {translateProgress.total} fields
                        </span>
                        <span className="font-medium">
                          {translateProgress.total > 0
                            ? Math.round((translateProgress.done / translateProgress.total) * 100)
                            : 0}%
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full bg-primary transition-all duration-300"
                          style={{
                            width: `${translateProgress.total > 0 ? (translateProgress.done / translateProgress.total) * 100 : 0}%`,
                          }}
                        />
                      </div>
                      {translateProgress.label && (
                        <p className="text-xs text-muted-foreground truncate">
                          Working on: {translateProgress.label}
                        </p>
                      )}
                    </div>
                  )}
                  
                  {/* Result */}
                  {translateResult && (
                    <div className={`rounded-md p-3 text-sm ${
                      translateResult.success 
                        ? translateResult.partial
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : "bg-green-50 text-green-700 border border-green-200" 
                        : "bg-red-50 text-red-700 border border-red-200"
                    }`}>
                      {translateResult.message}
                    </div>
                  )}
                </div>
              </div>

              {/* Stripe Payment Configuration */}
              <div className="rounded-lg border border-border p-6">
                <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                  <CreditCard className="h-5 w-5" />
                  Stripe Payment Configuration
                </h3>
                <p className="mb-4 text-sm text-muted-foreground">
                  Generate Stripe products and prices for all packages in this trip. This enables customers to pay a 30% deposit to confirm their booking.
                </p>
                
                <div className="space-y-4">
                  <div className="rounded-md border border-border bg-muted/30 p-4">
                    <h4 className="font-medium text-sm mb-2">Packages to Configure</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {packages.map((pkg: any) => (
                        <li key={pkg.id} className="flex items-center justify-between">
                          <span>{pkg.name}</span>
                          <span className="flex items-center gap-2">
                            <span>${pkg.price}</span>
                            <span className="text-xs">
                              (30% deposit: ${(pkg.price * 0.3).toFixed(2)})
                            </span>
                            {pkg.stripe_product_id && (
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                                Configured
                              </span>
                            )}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <Button
                    type="button"
                    onClick={handleGenerateStripe}
                    disabled={generatingStripe || packages.length === 0}
                    className="w-full sm:w-auto"
                  >
                    {generatingStripe ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <CreditCard className="mr-2 h-4 w-4" />
                        Generate Stripe Configuration
                      </>
                    )}
                  </Button>
                  
                  {/* Result */}
                  {stripeResult && (
                    <div className={`rounded-md p-3 text-sm ${
                      stripeResult.success 
                        ? "bg-green-50 text-green-700 border border-green-200" 
                        : "bg-red-50 text-red-700 border border-red-200"
                    }`}>
                      {stripeResult.message}
                    </div>
                  )}
                </div>
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
