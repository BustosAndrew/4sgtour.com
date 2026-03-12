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
  ArrowLeft,
  Plus,
  Trash2,
  GripVertical,
  ChevronRight,
  ChevronLeft,
  Languages,
} from "lucide-react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Image from "next/image"
import Link from "next/link"

type ItineraryDay = {
  id: string
  display_order: number
  title: string
  content: string
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
  price: string
  display_order: number
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
  const [activeLanguage, setActiveLanguage] = useState<"en" | "ko">("en")

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
    description_ko: "",
    trip_highlights_ko: "",
    travel_itinerary_ko: "",
    includes_ko: "",
    excludes_ko: "",
  })

  // German translations state (hidden from UI, auto-generated)
  const [germanData, setGermanData] = useState({
    title_de: "",
    location_de: "",
    description_de: "",
    trip_highlights_de: "",
    travel_itinerary_de: "",
    includes_de: "",
    excludes_de: "",
  })

  const [imageUrl, setImageUrl] = useState("")
  const [uploadingPhoto, setUploadingPhoto] = useState<string | null>(null)

  const [itinerary, setItinerary] = useState<ItineraryDay[]>([
    { id: "1", display_order: 1, title: "", content: "" },
  ])

  const [gallery, setGallery] = useState<GalleryImage[]>([])
  const [hotelGallery, setHotelGallery] = useState<GalleryImage[]>([])

  const [pricingTiers, setPricingTiers] = useState<PricingTier[]>([
    { id: "1", name: "", price: "", display_order: 0, booking_url: "" },
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
      { id: Date.now().toString(), display_order: nextOrder, title: "", content: "" },
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
      { id: Date.now().toString(), name: "", price: "", display_order: prev.length, booking_url: "" },
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

  // Auto-translate function - translates to both other languages
  // From English: translates to Korean AND German
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
          description: formData.description ? formData.description.split("\n\n").filter(Boolean) : null,
          trip_highlights: formData.trip_highlights ? formData.trip_highlights.split("\n").filter(Boolean) : null,
          travel_itinerary: formData.travel_itinerary ? formData.travel_itinerary.split("\n").filter(Boolean) : null,
          includes: formData.includes ? formData.includes.split("\n").filter(Boolean) : null,
          excludes: formData.excludes ? formData.excludes.split("\n").filter(Boolean) : null,
          // Korean translations
          title_ko: koreanData.title_ko || null,
          location_ko: koreanData.location_ko || null,
          description_ko: koreanData.description_ko ? koreanData.description_ko.split("\n\n").filter(Boolean) : null,
          trip_highlights_ko: koreanData.trip_highlights_ko ? koreanData.trip_highlights_ko.split("\n").filter(Boolean) : null,
          travel_itinerary_ko: koreanData.travel_itinerary_ko ? koreanData.travel_itinerary_ko.split("\n").filter(Boolean) : null,
          includes_ko: koreanData.includes_ko ? koreanData.includes_ko.split("\n").filter(Boolean) : null,
          excludes_ko: koreanData.excludes_ko ? koreanData.excludes_ko.split("\n").filter(Boolean) : null,
          // German translations (auto-generated, not shown in UI)
          title_de: germanData.title_de || null,
          location_de: germanData.location_de || null,
          description_de: germanData.description_de ? germanData.description_de.split("\n\n").filter(Boolean) : null,
          trip_highlights_de: germanData.trip_highlights_de ? germanData.trip_highlights_de.split("\n").filter(Boolean) : null,
          travel_itinerary_de: germanData.travel_itinerary_de ? germanData.travel_itinerary_de.split("\n").filter(Boolean) : null,
          includes_de: germanData.includes_de ? germanData.includes_de.split("\n").filter(Boolean) : null,
          excludes_de: germanData.excludes_de ? germanData.excludes_de.split("\n").filter(Boolean) : null,
          price: formData.price || null,
          image: imageUrl || null,
          itinerary: itinerary.filter((d) => d.title.trim()),
          gallery: [...gallery, ...hotelGallery],
          pricing_tiers: pricingTiers.filter((t) => t.name.trim()),
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to create event")
      }

      router.push("/admin/tournaments")
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
          <Link href="/admin/tournaments">
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
                <Tabs value={activeLanguage} onValueChange={(v) => setActiveLanguage(v as "en" | "ko")}>
                  <TabsList className="grid w-[200px] grid-cols-2">
                    <TabsTrigger value="en" className="text-sm">
                      English
                    </TabsTrigger>
                    <TabsTrigger value="ko" className="text-sm">
                      Korean
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
                <p className="text-xs text-gray-500">
                  {activeLanguage === "en" ? "Editing English content" : "Editing Korean translation"}
                </p>
              </div>

              <div className="rounded-lg bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-lg font-semibold text-gray-900">
                  Event Details{activeLanguage === "ko" && <span className="ml-2 text-sm font-normal text-gray-500">(Korean)</span>}
                </h2>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Event Title * {activeLanguage === "ko" && <span className="text-xs text-gray-400">(Korean)</span>}</Label>
                    <Input
                      id="title"
                      value={activeLanguage === "en" ? formData.title : koreanData.title_ko}
                      onChange={(e) =>
                        activeLanguage === "en"
                          ? setFormData((prev) => ({ ...prev, title: e.target.value }))
                          : setKoreanData((prev) => ({ ...prev, title_ko: e.target.value }))
                      }
                      placeholder={activeLanguage === "en" ? "e.g., The Open 2025" : "예: 디 오픈 2025"}
                      className="mt-1"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="location">Location * {activeLanguage === "ko" && <span className="text-xs text-gray-400">(Korean)</span>}</Label>
                      <Input
                        id="location"
                        value={activeLanguage === "en" ? formData.location : koreanData.location_ko}
                        onChange={(e) =>
                          activeLanguage === "en"
                            ? setFormData((prev) => ({ ...prev, location: e.target.value }))
                            : setKoreanData((prev) => ({ ...prev, location_ko: e.target.value }))
                        }
                        placeholder={activeLanguage === "en" ? "e.g., Scotland" : "예: 스코틀랜드"}
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
                      <Label htmlFor="duration">Duration</Label>
                      <Input
                        id="duration"
                        value={formData.duration}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, duration: e.target.value }))
                        }
                        placeholder="e.g., 4 days, 3 nights"
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
                    <Label htmlFor="description">Description {activeLanguage === "ko" && <span className="text-xs text-gray-400">(Korean)</span>}</Label>
                    <Textarea
                      id="description"
                      value={activeLanguage === "en" ? formData.description : koreanData.description_ko}
                      onChange={(e) =>
                        activeLanguage === "en"
                          ? setFormData((prev) => ({ ...prev, description: e.target.value }))
                          : setKoreanData((prev) => ({ ...prev, description_ko: e.target.value }))
                      }
                      placeholder={activeLanguage === "en" ? "Detailed event description..." : "상세한 이벤트 설명..."}
                      className="mt-1"
                      rows={4}
                    />
                  </div>

                  <div>
                    <Label htmlFor="trip_highlights">Trip Highlights {activeLanguage === "ko" && <span className="text-xs text-gray-400">(Korean)</span>}</Label>
                    <Textarea
                      id="trip_highlights"
                      value={activeLanguage === "en" ? formData.trip_highlights : koreanData.trip_highlights_ko}
                      onChange={(e) =>
                        activeLanguage === "en"
                          ? setFormData((prev) => ({ ...prev, trip_highlights: e.target.value }))
                          : setKoreanData((prev) => ({ ...prev, trip_highlights_ko: e.target.value }))
                      }
                      placeholder={activeLanguage === "en" ? "Premium accommodation\nTournament tickets\nGolf rounds" : "프리미엄 숙소\n토너먼트 티켓\n골프 라운드"}
                      className="mt-1"
                      rows={4}
                    />
                  </div>

                  <div>
                    <Label htmlFor="includes">Package Includes {activeLanguage === "ko" && <span className="text-xs text-gray-400">(Korean)</span>}</Label>
                    <Textarea
                      id="includes"
                      value={activeLanguage === "en" ? formData.includes : koreanData.includes_ko}
                      onChange={(e) =>
                        activeLanguage === "en"
                          ? setFormData((prev) => ({ ...prev, includes: e.target.value }))
                          : setKoreanData((prev) => ({ ...prev, includes_ko: e.target.value }))
                      }
                      placeholder={activeLanguage === "en" ? "Airport transfers\nBreakfast daily\nTournament tickets" : "공항 픽업\n조식 제공\n토너먼트 티켓"}
                      className="mt-1"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="excludes">Package Excludes {activeLanguage === "ko" && <span className="text-xs text-gray-400">(Korean)</span>}</Label>
                    <Textarea
                      id="excludes"
                      value={activeLanguage === "en" ? formData.excludes : koreanData.excludes_ko}
                      onChange={(e) =>
                        activeLanguage === "en"
                          ? setFormData((prev) => ({ ...prev, excludes: e.target.value }))
                          : setKoreanData((prev) => ({ ...prev, excludes_ko: e.target.value }))
                      }
                      placeholder={activeLanguage === "en" ? "Flights\nTravel insurance" : "항공편\n여행자 보험"}
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
