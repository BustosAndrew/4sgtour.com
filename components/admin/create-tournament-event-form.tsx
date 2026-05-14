"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { useRouter } from "next/navigation"
import {
  Upload,
  X,
  ArrowLeft,
  Plus,
  Trash2,
  GripVertical,
  ChevronRight,
  ChevronLeft,
  Languages,
  Loader2,
} from "lucide-react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Image from "next/image"
import Link from "next/link"

type ItineraryDay = {
  id: string
  display_order: number
  title: string
  title_ko: string
  title_de: string
  content: string
  content_ko: string
  content_de: string
}

type GalleryImage = {
  id: string
  image_url: string
  display_order: number
  gallery_type: string
}

type PricingTier = {
  id: string
  name: string
  name_ko: string
  name_de: string
  price: string
  display_order: number
  show_from_price: boolean
  booking_url: string
}

const STEPS = [
  { id: 1, title: "Event Details", description: "Basic information" },
  { id: 2, title: "Itinerary", description: "Day by day schedule" },
  { id: 3, title: "Gallery & Pricing", description: "Images and pricing tiers" },
  { id: 4, title: "Review", description: "Review and create" },
]

export function CreateTournamentEventForm({
  tournamentId,
  tournamentName,
}: {
  tournamentId: string
  tournamentName: string
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  // Language state
  const [activeLanguage, setActiveLanguage] = useState<"en" | "ko" | "de">("en")

  const [formData, setFormData] = useState({
    title: "",
    location: "",
    date: "",
    duration: "",
    description: "",
    trip_highlights: "",
    travel_itinerary: "",
    includes: "",
    excludes: "",
    price: "",
  })

  // Korean translations state
  const [koreanData, setKoreanData] = useState({
    title_ko: "",
    location_ko: "",
    duration_ko: "",
    description_ko: "",
    trip_highlights_ko: "",
    travel_itinerary_ko: "",
    includes_ko: "",
    excludes_ko: "",
  })

  // German translations state
  const [germanData, setGermanData] = useState({
    title_de: "",
    location_de: "",
    duration_de: "",
    description_de: "",
    trip_highlights_de: "",
    travel_itinerary_de: "",
    includes_de: "",
    excludes_de: "",
  })

  // Translation state
  const [translateSource, setTranslateSource] = useState<"en" | "ko" | "de">("en")
  const [translateTargets, setTranslateTargets] = useState<("en" | "ko" | "de")[]>([])
  const [isTranslating, setIsTranslating] = useState(false)
  const [translateResult, setTranslateResult] = useState<{ success: boolean; message: string } | null>(null)

  const getAvailableSourceLanguages = (): ("en" | "ko" | "de")[] => {
    const langs: ("en" | "ko" | "de")[] = []
    if (formData.title?.trim()) langs.push("en")
    if (koreanData.title_ko?.trim()) langs.push("ko")
    if (germanData.title_de?.trim()) langs.push("de")
    return langs.length > 0 ? langs : ["en"]
  }

  const [imageUrl, setImageUrl] = useState("")
  const [uploadingPhoto, setUploadingPhoto] = useState<string | null>(null)

  const [itinerary, setItinerary] = useState<ItineraryDay[]>([
    { id: "1", display_order: 1, title: "", title_ko: "", title_de: "", content: "", content_ko: "", content_de: "" },
  ])

  const [gallery, setGallery] = useState<GalleryImage[]>([])
  const [hotelGallery, setHotelGallery] = useState<GalleryImage[]>([])

  const [pricingTiers, setPricingTiers] = useState<PricingTier[]>([
    { id: "1", name: "", name_ko: "", name_de: "", price: "", display_order: 0, show_from_price: false, booking_url: "" },
  ])

  const handlePhotoUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "main" | "gallery" | "hotel"
  ) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingPhoto(type)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) throw new Error("Upload failed")

      const { url } = await response.json()
      if (type === "main") {
        setImageUrl(url)
      } else if (type === "hotel") {
        setHotelGallery((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            image_url: url,
            display_order: prev.length,
            gallery_type: "hotel",
          },
        ])
      } else {
        setGallery((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            image_url: url,
            display_order: prev.length,
            gallery_type: "event",
          },
        ])
      }
    } catch (error) {
      console.error("Error uploading photo:", error)
      alert("Failed to upload photo")
    } finally {
      setUploadingPhoto(null)
    }
  }

  const addItineraryDay = () => {
    const nextOrder = itinerary.length + 1
    setItinerary((prev) => [
      ...prev,
      { id: Date.now().toString(), display_order: nextOrder, title: "", title_ko: "", title_de: "", content: "", content_ko: "", content_de: "" },
    ])
  }

  const removeItineraryDay = (id: string) => {
    setItinerary((prev) => {
      const filtered = prev.filter((d) => d.id !== id)
      return filtered.map((d, i) => ({ ...d, display_order: i + 1 }))
    })
  }

  const updateItineraryDay = (id: string, field: keyof ItineraryDay, value: string | number) => {
    setItinerary((prev) =>
      prev.map((d) => (d.id === id ? { ...d, [field]: value } : d))
    )
  }

  const removeGalleryImage = (id: string) => {
    setGallery((prev) => prev.filter((img) => img.id !== id))
  }

  const removeHotelGalleryImage = (id: string) => {
    setHotelGallery((prev) => prev.filter((img) => img.id !== id))
  }

  const addPricingTier = () => {
    setPricingTiers((prev) => [
      ...prev,
      { id: Date.now().toString(), name: "", name_ko: "", name_de: "", price: "", display_order: prev.length, show_from_price: false, booking_url: "" },
    ])
  }

  const removePricingTier = (id: string) => {
    setPricingTiers((prev) => prev.filter((t) => t.id !== id))
  }

  const updatePricingTier = (id: string, field: keyof PricingTier, value: any) => {
    setPricingTiers((prev) =>
      prev.map((t) => (t.id === id ? { ...t, [field]: value } : t))
    )
  }

  const handleTranslate = async () => {
    if (translateTargets.length === 0 || isTranslating) return
    // Translate panel is shown in step 4 before the event is created,
    // so we apply translations directly into local state without a server call.
    // After creation, the translate-event API handles server-side translation.
    // Here we just copy source content to target language fields as a pre-fill.
    setIsTranslating(true)
    setTranslateResult(null)

    const getLangData = (lang: "en" | "ko" | "de") => {
      if (lang === "en") return {
        title: formData.title, location: formData.location, duration: formData.duration,
        description: formData.description, trip_highlights: formData.trip_highlights,
        travel_itinerary: formData.travel_itinerary, includes: formData.includes, excludes: formData.excludes,
      }
      if (lang === "ko") return {
        title: koreanData.title_ko, location: koreanData.location_ko, duration: koreanData.duration_ko,
        description: koreanData.description_ko, trip_highlights: koreanData.trip_highlights_ko,
        travel_itinerary: koreanData.travel_itinerary_ko, includes: koreanData.includes_ko, excludes: koreanData.excludes_ko,
      }
      return {
        title: germanData.title_de, location: germanData.location_de, duration: germanData.duration_de,
        description: germanData.description_de, trip_highlights: germanData.trip_highlights_de,
        travel_itinerary: germanData.travel_itinerary_de, includes: germanData.includes_de, excludes: germanData.excludes_de,
      }
    }

    try {
      const srcData = getLangData(translateSource)
      // Build fields array for batch API
      const fields: { field: string; text: string; fieldType: string }[] = []
      const fieldMap: Record<string, string> = {
        title: "title", location: "location", duration: "description",
        description: "description", trip_highlights: "highlight",
        travel_itinerary: "itinerary", includes: "item", excludes: "item",
      }
      for (const [key, fieldType] of Object.entries(fieldMap)) {
        const text = srcData[key as keyof typeof srcData]
        if (text?.trim()) fields.push({ field: key, text, fieldType })
      }

      for (const targetLang of translateTargets) {
        const response = await fetch("/api/translate/batch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fields, targetLanguage: targetLang, sourceLanguage: translateSource }),
        })
        if (!response.ok) throw new Error("Translation failed")
        const result = await response.json()
        const t = result.translations || {}

        if (targetLang === "en") {
          setFormData((prev) => ({
            ...prev,
            title: t.title || prev.title, location: t.location || prev.location,
            duration: t.duration || prev.duration, description: t.description || prev.description,
            trip_highlights: t.trip_highlights || prev.trip_highlights,
            travel_itinerary: t.travel_itinerary || prev.travel_itinerary,
            includes: t.includes || prev.includes, excludes: t.excludes || prev.excludes,
          }))
        } else if (targetLang === "ko") {
          setKoreanData((prev) => ({
            ...prev,
            title_ko: t.title || prev.title_ko, location_ko: t.location || prev.location_ko,
            duration_ko: t.duration || prev.duration_ko, description_ko: t.description || prev.description_ko,
            trip_highlights_ko: t.trip_highlights || prev.trip_highlights_ko,
            travel_itinerary_ko: t.travel_itinerary || prev.travel_itinerary_ko,
            includes_ko: t.includes || prev.includes_ko, excludes_ko: t.excludes || prev.excludes_ko,
          }))
        } else {
          setGermanData((prev) => ({
            ...prev,
            title_de: t.title || prev.title_de, location_de: t.location || prev.location_de,
            duration_de: t.duration || prev.duration_de, description_de: t.description || prev.description_de,
            trip_highlights_de: t.trip_highlights || prev.trip_highlights_de,
            travel_itinerary_de: t.travel_itinerary || prev.travel_itinerary_de,
            includes_de: t.includes || prev.includes_de, excludes_de: t.excludes || prev.excludes_de,
          }))
        }
      }
      setTranslateResult({ success: true, message: "Content translated successfully!" })
    } catch {
      setTranslateResult({ success: false, message: "Translation failed. Please try again." })
    } finally {
      setIsTranslating(false)
    }
  }

  const validateCurrentStep = (): { valid: boolean; errors: string[] } => {
    const errors: string[] = []

    switch (currentStep) {
      case 1:
        if (!formData.title.trim()) errors.push("Event title is required")
        if (!formData.location.trim()) errors.push("Location is required")
        if (!formData.date) errors.push("Event date is required")
        break
      case 2:
        // Itinerary is optional
        break
      case 3:
        // Pricing tiers are optional
        break
    }

    return { valid: errors.length === 0, errors }
  }

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault()
    const { valid, errors } = validateCurrentStep()
    if (!valid) {
      setValidationErrors(errors)
      return
    }
    setValidationErrors([])
    setCurrentStep((prev) => Math.min(prev + 1, STEPS.length))
  }

  const handlePrev = () => {
    setValidationErrors([])
    setCurrentStep((prev) => Math.max(prev - 1, 1))
  }

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  
  // Only allow submission on the last step
  if (currentStep !== STEPS.length) {
    return
  }

  setLoading(true)
  setValidationErrors([])

    try {
      const response = await fetch(`/api/admin/tournaments/${tournamentId}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          location: formData.location,
          date: formData.date,
          duration: formData.duration || null,
          duration_ko: koreanData.duration_ko || null,
          duration_de: germanData.duration_de || null,
          description: formData.description ? formData.description.split("\n\n").filter(Boolean) : null,
          trip_highlights: formData.trip_highlights ? formData.trip_highlights.split("\n").filter(Boolean) : null,
          travel_itinerary: formData.travel_itinerary ? formData.travel_itinerary.split("\n").filter(Boolean) : null,
          includes: formData.includes ? formData.includes.split("\n").filter(Boolean) : null,
          excludes: formData.excludes ? formData.excludes.split("\n").filter(Boolean) : null,
          title_ko: koreanData.title_ko || null,
          location_ko: koreanData.location_ko || null,
          description_ko: koreanData.description_ko ? koreanData.description_ko.split("\n\n").filter(Boolean) : null,
          trip_highlights_ko: koreanData.trip_highlights_ko ? koreanData.trip_highlights_ko.split("\n").filter(Boolean) : null,
          travel_itinerary_ko: koreanData.travel_itinerary_ko ? koreanData.travel_itinerary_ko.split("\n").filter(Boolean) : null,
          includes_ko: koreanData.includes_ko ? koreanData.includes_ko.split("\n").filter(Boolean) : null,
          excludes_ko: koreanData.excludes_ko ? koreanData.excludes_ko.split("\n").filter(Boolean) : null,
          title_de: germanData.title_de || null,
          location_de: germanData.location_de || null,
          description_de: germanData.description_de ? germanData.description_de.split("\n\n").filter(Boolean) : null,
          trip_highlights_de: germanData.trip_highlights_de ? germanData.trip_highlights_de.split("\n").filter(Boolean) : null,
          travel_itinerary_de: germanData.travel_itinerary_de ? germanData.travel_itinerary_de.split("\n").filter(Boolean) : null,
          includes_de: germanData.includes_de ? germanData.includes_de.split("\n").filter(Boolean) : null,
          excludes_de: germanData.excludes_de ? germanData.excludes_de.split("\n").filter(Boolean) : null,
          price: formData.price || null,
          image: imageUrl || null,
          itinerary: itinerary.filter((d) => d.title.trim()).map((d) => ({
            title: d.title,
            title_ko: d.title_ko || null,
            title_de: d.title_de || null,
            content: d.content || null,
            content_ko: d.content_ko || null,
            content_de: d.content_de || null,
          })),
          gallery: [...gallery, ...hotelGallery],
          pricing_tiers: pricingTiers.filter((t) => t.name.trim()).map((t) => ({
            name: t.name,
            name_ko: t.name_ko || null,
            name_de: t.name_de || null,
            price: t.price || null,
            display_order: t.display_order,
            show_from_price: t.show_from_price,
            booking_url: t.booking_url || null,
          })),
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to create event")
      }

      // After a successful create, auto-translate to Korean and German
      // so every new event ships fully localized without a separate
      // manual translate step.
      try {
        const createdEvent = await response.json()
        const newEventId = createdEvent?.id
        if (newEventId) {
          const translateResp = await fetch(
            `/api/admin/translate-event/${newEventId}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                sourceLanguage: "en",
                targetLanguages: ["ko", "de"],
              }),
            },
          )

          if (translateResp.ok && translateResp.body) {
            // Drain the SSE stream so the redirect happens after the
            // server has finished writing translations to the DB.
            const reader = translateResp.body.getReader()
            // eslint-disable-next-line no-constant-condition
            while (true) {
              const { done } = await reader.read()
              if (done) break
            }
          } else if (!translateResp.ok) {
            console.error(
              "[v0] Auto-translate after event create failed with status",
              translateResp.status,
            )
          }
        }
      } catch (translateErr) {
        // Don't block the redirect on translation problems — the event
        // itself was created successfully and admin can re-run from edit.
        console.error("[v0] Auto-translate after event create threw:", translateErr)
      }

      router.push("/admin?tab=tournaments")
      router.refresh()
    } catch (error) {
      console.error("Error creating event:", error)
      setValidationErrors([
        error instanceof Error ? error.message : "Failed to create event",
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f4f3ee]">
      <header className="border-b border-gray-300 bg-white px-4 py-4 sm:px-8 sm:py-6">
        <div className="flex items-center gap-4">
          <Link href="/admin?tab=tournaments">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-lg font-semibold text-gray-900 sm:text-2xl">
              Create New Event
            </h1>
            <p className="text-xs text-gray-600 sm:text-sm">
              {tournamentName}
            </p>
          </div>
        </div>
      </header>

      {/* Step Indicator */}
      <div className="border-b border-gray-200 bg-white px-4 py-4 sm:px-8">
        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                  currentStep >= step.id
                    ? "bg-[#274C77] text-white"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {step.id}
              </div>
              <div className="ml-2 hidden sm:block">
                <p className="text-sm font-medium text-gray-900">{step.title}</p>
                <p className="text-xs text-gray-500">{step.description}</p>
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={`mx-4 h-0.5 w-8 sm:w-16 ${
                    currentStep > step.id ? "bg-[#274C77]" : "bg-gray-200"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-3xl p-4 sm:p-8">
        {validationErrors.length > 0 && (
          <div className="mb-6 rounded-lg bg-red-50 p-4">
            <h3 className="mb-2 font-medium text-red-800">
              Please fix the following errors:
            </h3>
            <ul className="list-inside list-disc space-y-1 text-sm text-red-700">
              {validationErrors.map((error, i) => (
                <li key={i}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Step 1: Event Details */}
          {currentStep === 1 && (
            <div className="space-y-6">
              {/* Language Tabs */}
              <div className="flex items-center gap-3">
                <Languages className="h-5 w-5 text-gray-500" />
                <Tabs value={activeLanguage} onValueChange={(v) => setActiveLanguage(v as "en" | "ko" | "de")}>
                  <TabsList className="grid w-[300px] grid-cols-3">
                    <TabsTrigger value="en" className="text-sm">English</TabsTrigger>
                    <TabsTrigger value="ko" className="text-sm">Korean</TabsTrigger>
                    <TabsTrigger value="de" className="text-sm">German</TabsTrigger>
                  </TabsList>
                </Tabs>
                <p className="text-xs text-gray-500">
                  {activeLanguage === "en" ? "Editing English content" : activeLanguage === "ko" ? "Editing Korean translation" : "Editing German translation"}
                </p>
              </div>

              <div className="rounded-lg bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-lg font-semibold text-gray-900">
                  Event Details{activeLanguage === "ko" && <span className="ml-2 text-sm font-normal text-gray-500">(Korean)</span>}
                </h2>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">
                      Event Title *{activeLanguage !== "en" && <span className="ml-1 text-xs text-gray-400">({activeLanguage.toUpperCase()})</span>}
                    </Label>
                    <Input
                      id="title"
                      value={activeLanguage === "en" ? formData.title : activeLanguage === "ko" ? koreanData.title_ko : germanData.title_de}
                      onChange={(e) =>
                        activeLanguage === "en"
                          ? setFormData((prev) => ({ ...prev, title: e.target.value }))
                          : activeLanguage === "ko"
                          ? setKoreanData((prev) => ({ ...prev, title_ko: e.target.value }))
                          : setGermanData((prev) => ({ ...prev, title_de: e.target.value }))
                      }
                      placeholder={activeLanguage === "en" ? "e.g., The Open 2025" : activeLanguage === "ko" ? "예: 디 오픈 2025" : "z.B. The Open 2025"}
                      className="mt-1"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="location">
                        Location *{activeLanguage !== "en" && <span className="ml-1 text-xs text-gray-400">({activeLanguage.toUpperCase()})</span>}
                      </Label>
                      <Input
                        id="location"
                        value={activeLanguage === "en" ? formData.location : activeLanguage === "ko" ? koreanData.location_ko : germanData.location_de}
                        onChange={(e) =>
                          activeLanguage === "en"
                            ? setFormData((prev) => ({ ...prev, location: e.target.value }))
                            : activeLanguage === "ko"
                            ? setKoreanData((prev) => ({ ...prev, location_ko: e.target.value }))
                            : setGermanData((prev) => ({ ...prev, location_de: e.target.value }))
                        }
                        placeholder={activeLanguage === "en" ? "e.g., Scotland" : activeLanguage === "ko" ? "예: 스코틀랜드" : "z.B. Schottland"}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="date">Date *</Label>
                      <Input
                        id="date"
                        value={formData.date}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, date: e.target.value }))
                        }
                        placeholder="e.g., July 17-20, 2025"
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="duration">
                        Duration{activeLanguage !== "en" && <span className="ml-1 text-xs text-gray-400">({activeLanguage.toUpperCase()})</span>}
                      </Label>
                      <Input
                        id="duration"
                        value={activeLanguage === "en" ? formData.duration : activeLanguage === "ko" ? koreanData.duration_ko : germanData.duration_de}
                        onChange={(e) =>
                          activeLanguage === "en"
                            ? setFormData((prev) => ({ ...prev, duration: e.target.value }))
                            : activeLanguage === "ko"
                            ? setKoreanData((prev) => ({ ...prev, duration_ko: e.target.value }))
                            : setGermanData((prev) => ({ ...prev, duration_de: e.target.value }))
                        }
                        placeholder={activeLanguage === "en" ? "e.g., 4 days, 3 nights" : activeLanguage === "ko" ? "예: 4일 3박" : "z.B. 4 Tage, 3 Nächte"}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="price">Price (displayed)</Label>
                      <Input
                        id="price"
                        value={formData.price}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, price: e.target.value }))
                        }
                        placeholder="e.g., from $5,000"
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description">
                      Description{activeLanguage !== "en" && <span className="ml-1 text-xs text-gray-400">({activeLanguage.toUpperCase()})</span>}
                    </Label>
                    <Textarea
                      id="description"
                      value={activeLanguage === "en" ? formData.description : activeLanguage === "ko" ? koreanData.description_ko : germanData.description_de}
                      onChange={(e) =>
                        activeLanguage === "en"
                          ? setFormData((prev) => ({ ...prev, description: e.target.value }))
                          : activeLanguage === "ko"
                          ? setKoreanData((prev) => ({ ...prev, description_ko: e.target.value }))
                          : setGermanData((prev) => ({ ...prev, description_de: e.target.value }))
                      }
                      placeholder={activeLanguage === "en" ? "Detailed event description..." : activeLanguage === "ko" ? "상세한 이벤트 설명..." : "Detaillierte Eventbeschreibung..."}
                      className="mt-1"
                      rows={4}
                    />
                  </div>

                  <div>
                    <Label htmlFor="trip_highlights">
                      Trip Highlights{activeLanguage !== "en" && <span className="ml-1 text-xs text-gray-400">({activeLanguage.toUpperCase()})</span>}
                    </Label>
                    <Textarea
                      id="trip_highlights"
                      value={activeLanguage === "en" ? formData.trip_highlights : activeLanguage === "ko" ? koreanData.trip_highlights_ko : germanData.trip_highlights_de}
                      onChange={(e) =>
                        activeLanguage === "en"
                          ? setFormData((prev) => ({ ...prev, trip_highlights: e.target.value }))
                          : activeLanguage === "ko"
                          ? setKoreanData((prev) => ({ ...prev, trip_highlights_ko: e.target.value }))
                          : setGermanData((prev) => ({ ...prev, trip_highlights_de: e.target.value }))
                      }
                      placeholder={activeLanguage === "en" ? "Premium accommodation\nTournament tickets\nGolf rounds" : activeLanguage === "ko" ? "프리미엄 숙소\n토너먼트 티켓\n골프 라운드" : "Premium Unterkunft\nTurnierkarten\nGolfrunden"}
                      className="mt-1"
                      rows={4}
                    />
                  </div>

                  <div>
                    <Label htmlFor="includes">
                      Package Includes{activeLanguage !== "en" && <span className="ml-1 text-xs text-gray-400">({activeLanguage.toUpperCase()})</span>}
                    </Label>
                    <Textarea
                      id="includes"
                      value={activeLanguage === "en" ? formData.includes : activeLanguage === "ko" ? koreanData.includes_ko : germanData.includes_de}
                      onChange={(e) =>
                        activeLanguage === "en"
                          ? setFormData((prev) => ({ ...prev, includes: e.target.value }))
                          : activeLanguage === "ko"
                          ? setKoreanData((prev) => ({ ...prev, includes_ko: e.target.value }))
                          : setGermanData((prev) => ({ ...prev, includes_de: e.target.value }))
                      }
                      placeholder={activeLanguage === "en" ? "Airport transfers\nBreakfast daily\nTournament tickets" : activeLanguage === "ko" ? "공항 픽업\n조식 제공\n토너먼트 티켓" : "Flughafentransfers\nFrühstück täglich\nTurnierkarten"}
                      className="mt-1"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="excludes">
                      Package Excludes{activeLanguage !== "en" && <span className="ml-1 text-xs text-gray-400">({activeLanguage.toUpperCase()})</span>}
                    </Label>
                    <Textarea
                      id="excludes"
                      value={activeLanguage === "en" ? formData.excludes : activeLanguage === "ko" ? koreanData.excludes_ko : germanData.excludes_de}
                      onChange={(e) =>
                        activeLanguage === "en"
                          ? setFormData((prev) => ({ ...prev, excludes: e.target.value }))
                          : activeLanguage === "ko"
                          ? setKoreanData((prev) => ({ ...prev, excludes_ko: e.target.value }))
                          : setGermanData((prev) => ({ ...prev, excludes_de: e.target.value }))
                      }
                      placeholder={activeLanguage === "en" ? "Flights\nTravel insurance" : activeLanguage === "ko" ? "항공편\n여행자 보험" : "Flüge\nReiseversicherung"}
                      className="mt-1"
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-lg bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-lg font-semibold text-gray-900">
                  Event Image
                </h2>

                {imageUrl ? (
                  <div className="relative">
                    <div className="relative h-48 w-full overflow-hidden rounded-lg border">
                      <Image
                        src={imageUrl}
                        alt="Event image"
                        fill
                        className="object-cover"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setImageUrl("")}
                      className="absolute right-2 top-2 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex h-48 w-full cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-gray-300 hover:border-gray-400">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handlePhotoUpload(e, "main")}
                      disabled={uploadingPhoto === "main"}
                    />
                    {uploadingPhoto === "main" ? (
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-primary" />
                    ) : (
                      <div className="text-center">
                        <Upload className="mx-auto h-8 w-8 text-gray-400" />
                        <span className="mt-2 block text-sm text-gray-500">
                          Click to upload event image
                        </span>
                      </div>
                    )}
                  </label>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Itinerary */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="rounded-lg bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Itinerary</h2>
                  <Button type="button" variant="outline" size="sm" onClick={addItineraryDay}>
                    <Plus className="mr-1 h-4 w-4" />
                    Add Day
                  </Button>
                </div>

                <div className="space-y-4">
                  {itinerary.map((day) => (
                    <div
                      key={day.id}
                      className="rounded-lg border border-gray-200 p-4"
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <GripVertical className="h-4 w-4 text-gray-400" />
                          <span className="font-medium text-gray-700">
                            Day {day.display_order}
                          </span>
                        </div>
                        {itinerary.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItineraryDay(day.id)}
                            className="h-8 w-8 p-0 text-red-500 hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      <div className="space-y-3">
                        <div>
                          <Label>Title *</Label>
                          <Input
                            value={day.title}
                            onChange={(e) =>
                              updateItineraryDay(day.id, "title", e.target.value)
                            }
                            placeholder="e.g., Arrival & Welcome"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label>Content</Label>
                          <Textarea
                            value={day.content}
                            onChange={(e) =>
                              updateItineraryDay(day.id, "content", e.target.value)
                            }
                            placeholder="Activities for this day..."
                            className="mt-1"
                            rows={2}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Gallery & Pricing */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="rounded-lg bg-white p-6 shadow-sm">
                <h2 className="mb-2 text-lg font-semibold text-gray-900">Event Gallery</h2>
                <p className="mb-4 text-sm text-gray-500">Images of the event and venue</p>

                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {gallery.map((img) => (
                    <div key={img.id} className="relative">
                      <div className="relative aspect-video overflow-hidden rounded-lg border">
                        <Image
                          src={img.image_url}
                          alt="Gallery image"
                          fill
                          className="object-cover"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeGalleryImage(img.id)}
                        className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}

                  <label className="flex aspect-video cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-gray-300 hover:border-gray-400">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handlePhotoUpload(e, "gallery")}
                      disabled={uploadingPhoto === "gallery"}
                    />
                    {uploadingPhoto === "gallery" ? (
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-primary" />
                    ) : (
                      <div className="text-center">
                        <Plus className="mx-auto h-6 w-6 text-gray-400" />
                        <span className="mt-1 block text-xs text-gray-500">Add</span>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              {/* Hotel / Accommodations Gallery */}
              <div className="rounded-lg bg-white p-6 shadow-sm">
                <h2 className="mb-2 text-lg font-semibold text-gray-900">Accommodations Gallery</h2>
                <p className="mb-4 text-sm text-gray-500">Images of hotel rooms and accommodations</p>

                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {hotelGallery.map((img) => (
                    <div key={img.id} className="relative">
                      <div className="relative aspect-video overflow-hidden rounded-lg border">
                        <Image
                          src={img.image_url}
                          alt="Hotel gallery image"
                          fill
                          className="object-cover"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeHotelGalleryImage(img.id)}
                        className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}

                  <label className="flex aspect-video cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-gray-300 hover:border-gray-400">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handlePhotoUpload(e, "hotel")}
                      disabled={uploadingPhoto === "hotel"}
                    />
                    {uploadingPhoto === "hotel" ? (
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-primary" />
                    ) : (
                      <div className="text-center">
                        <Plus className="mx-auto h-6 w-6 text-gray-400" />
                        <span className="mt-1 block text-xs text-gray-500">Add</span>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              <div className="rounded-lg bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Pricing Tiers</h2>
                  <Button type="button" variant="outline" size="sm" onClick={addPricingTier}>
                    <Plus className="mr-1 h-4 w-4" />
                    Add Tier
                  </Button>
                </div>

                <div className="space-y-4">
                  {pricingTiers.map((tier, tierIndex) => (
                    <div
                      key={tier.id}
                      className="rounded-lg border border-gray-200 p-4"
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <span className="font-medium text-gray-700">
                          Tier {tierIndex + 1}
                        </span>
                        {pricingTiers.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removePricingTier(tier.id)}
                            className="h-8 w-8 p-0 text-red-500 hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label>Tier Name *</Label>
                            <Input
                              value={tier.name}
                              onChange={(e) =>
                                updatePricingTier(tier.id, "name", e.target.value)
                              }
                              placeholder="e.g., Premium Package"
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label>Price</Label>
                            <Input
                              value={tier.price || ""}
                              onChange={(e) =>
                                updatePricingTier(tier.id, "price", e.target.value)
                              }
                              placeholder="e.g., $5,000"
                              className="mt-1"
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3">
                          <div>
                            <p className="text-sm font-medium text-gray-700">Show &quot;From&quot; prefix</p>
                            <p className="text-xs text-gray-500">Displays &quot;From&quot; before the price on the public page</p>
                          </div>
                          <Switch
                            checked={tier.show_from_price ?? false}
                            onCheckedChange={(checked) =>
                              updatePricingTier(tier.id, "show_from_price", checked)
                            }
                          />
                        </div>

                        <div>
                          <Label>Booking URL</Label>
                          <Input
                            value={tier.booking_url}
                            onChange={(e) =>
                              updatePricingTier(tier.id, "booking_url", e.target.value)
                            }
                            placeholder="https://..."
                            className="mt-1"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {currentStep === 4 && (
            <div className="space-y-6">
              {/* Translate Content */}
              <div className="rounded-lg bg-white p-6 shadow-sm">
                <h2 className="mb-1 flex items-center gap-2 text-lg font-semibold text-gray-900">
                  <Languages className="h-5 w-5" />
                  Translate Content
                </h2>
                <p className="mb-4 text-sm text-gray-500">
                  Auto-translate this event&apos;s content to other languages using AI.
                </p>
                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">Source Language</label>
                    <div className="flex gap-2">
                      {getAvailableSourceLanguages().map((lang) => (
                        <button
                          key={lang}
                          type="button"
                          onClick={() => {
                            setTranslateSource(lang)
                            setTranslateTargets((prev) => prev.filter((l) => l !== lang))
                          }}
                          className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
                            translateSource === lang
                              ? "border-[#274C77] bg-[#274C77] text-white"
                              : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
                          }`}
                        >
                          {lang === "en" ? "English" : lang === "ko" ? "Korean" : "German"}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">Translate To</label>
                    <div className="flex gap-2">
                      {(["en", "ko", "de"] as const)
                        .filter((l) => l !== translateSource)
                        .map((lang) => (
                          <button
                            key={lang}
                            type="button"
                            onClick={() =>
                              setTranslateTargets((prev) =>
                                prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]
                              )
                            }
                            className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
                              translateTargets.includes(lang)
                                ? "border-[#274C77] bg-[#274C77] text-white"
                                : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
                            }`}
                          >
                            {lang === "en" ? "English" : lang === "ko" ? "Korean" : "German"}
                          </button>
                        ))}
                    </div>
                  </div>
                  <Button
                    type="button"
                    onClick={handleTranslate}
                    disabled={isTranslating || translateTargets.length === 0}
                    className="bg-[#274C77] hover:bg-[#274C77]/90"
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
                  {translateResult && (
                    <div
                      className={`rounded-md border p-3 text-sm ${
                        translateResult.success
                          ? "border-green-200 bg-green-50 text-green-700"
                          : "border-red-200 bg-red-50 text-red-700"
                      }`}
                    >
                      {translateResult.message}
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-lg bg-white p-6 shadow-sm">
                <h2 className="mb-6 text-lg font-semibold text-gray-900">
                  Review & Create
                </h2>
                <p className="mb-6 text-sm text-gray-600">
                  Please review your event details below. Click "Create Event" when ready.
                </p>

                <div className="space-y-4">
                  <div className="rounded-lg border border-gray-200 p-4">
                    <Label className="text-xs uppercase tracking-wide text-gray-500">Event Title</Label>
                    <p className="mt-1 text-base font-medium text-gray-900">{formData.title || "—"}</p>
                  </div>

                  <div className="rounded-lg border border-gray-200 p-4">
                    <Label className="text-xs uppercase tracking-wide text-gray-500">Location</Label>
                    <p className="mt-1 text-base font-medium text-gray-900">{formData.location || "—"}</p>
                  </div>

                  <div className="rounded-lg border border-gray-200 p-4">
                    <Label className="text-xs uppercase tracking-wide text-gray-500">Date</Label>
                    <p className="mt-1 text-base font-medium text-gray-900">{formData.date || "—"}</p>
                  </div>

                  <div className="rounded-lg border border-gray-200 p-4">
                    <Label className="text-xs uppercase tracking-wide text-gray-500">Duration</Label>
                    <p className="mt-1 text-base font-medium text-gray-900">{formData.duration || "—"}</p>
                  </div>

                  <div className="rounded-lg border border-gray-200 p-4">
                    <Label className="text-xs uppercase tracking-wide text-gray-500">Starting Price</Label>
                    <p className="mt-1 text-base font-medium text-gray-900">{formData.price || "—"}</p>
                  </div>

                  {formData.description && (
                    <div className="rounded-lg border border-gray-200 p-4">
                      <Label className="text-xs uppercase tracking-wide text-gray-500">Description</Label>
                      <p className="mt-1 text-sm text-gray-700 line-clamp-3">{formData.description}</p>
                    </div>
                  )}

                  {formData.trip_highlights && (
                    <div className="rounded-lg border border-gray-200 p-4">
                      <Label className="text-xs uppercase tracking-wide text-gray-500">Trip Highlights</Label>
                      <p className="mt-1 text-sm text-gray-700 line-clamp-3">{formData.trip_highlights}</p>
                    </div>
                  )}

                  {formData.includes && (
                    <div className="rounded-lg border border-gray-200 p-4">
                      <Label className="text-xs uppercase tracking-wide text-gray-500">Package Includes</Label>
                      <p className="mt-1 text-sm text-gray-700 line-clamp-3">{formData.includes}</p>
                    </div>
                  )}

                  <div className="rounded-lg border border-gray-200 p-4">
                    <Label className="text-xs uppercase tracking-wide text-gray-500">Itinerary</Label>
                    <p className="mt-1 text-base font-medium text-gray-900">
                      {itinerary.filter((d) => d.title.trim()).length} days planned
                    </p>
                  </div>

                  <div className="rounded-lg border border-gray-200 p-4">
                    <Label className="text-xs uppercase tracking-wide text-gray-500">Event Gallery</Label>
                    <p className="mt-1 text-base font-medium text-gray-900">{gallery.length} images</p>
                  </div>

                  <div className="rounded-lg border border-gray-200 p-4">
                    <Label className="text-xs uppercase tracking-wide text-gray-500">Accommodations Gallery</Label>
                    <p className="mt-1 text-base font-medium text-gray-900">{hotelGallery.length} images</p>
                  </div>

                  <div className="rounded-lg border border-gray-200 p-4">
                    <Label className="text-xs uppercase tracking-wide text-gray-500">Pricing Tiers</Label>
                    <p className="mt-1 text-base font-medium text-gray-900">
                      {pricingTiers.filter((t) => t.name.trim()).length} pricing tiers
                    </p>
                    {pricingTiers
                      .filter((t) => t.name.trim())
                      .map((tier) => (
                        <p key={tier.id} className="text-sm text-gray-600">
                          • {tier.name}{tier.price ? `: ${tier.price}` : ""}
                        </p>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="mt-6 flex gap-3">
            {currentStep > 1 && (
              <Button type="button" variant="outline" onClick={handlePrev} className="flex-1">
                <ChevronLeft className="mr-1 h-4 w-4" />
                Previous
              </Button>
            )}

            {currentStep < STEPS.length ? (
              <Button
                type="button"
                onClick={handleNext}
                className="flex-1 bg-[#274C77] hover:bg-[#274C77]/90"
              >
                Next
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="submit"
                className="flex-1 bg-[#274C77] hover:bg-[#274C77]/90"
                disabled={loading}
              >
                {loading ? "Creating..." : "Create Event"}
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
