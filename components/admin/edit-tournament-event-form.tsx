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
  Loader2,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"

type Lang = "en" | "ko" | "de"

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
  booking_url: string
}

type TournamentEvent = {
  id: string
  tournament_id: string
  slug: string
  title: string
  title_ko?: string | null
  title_de?: string | null
  location: string
  location_ko?: string | null
  location_de?: string | null
  date: string
  duration: string | null
  description: string[] | null
  description_ko?: string[] | null
  description_de?: string[] | null
  trip_highlights: string[] | null
  trip_highlights_ko?: string[] | null
  trip_highlights_de?: string[] | null
  travel_itinerary: string[] | null
  travel_itinerary_ko?: string[] | null
  travel_itinerary_de?: string[] | null
  includes: string[] | null
  includes_ko?: string[] | null
  includes_de?: string[] | null
  excludes: string[] | null
  excludes_ko?: string[] | null
  excludes_de?: string[] | null
  image: string | null
  hero_image: string | null
  price: string | null
  tournament_event_itinerary_days?: {
    id: string
    display_order: number
    title: string
    title_ko?: string | null
    title_de?: string | null
    content: string | null
    content_ko?: string | null
    content_de?: string | null
  }[]
  tournament_event_gallery_images?: {
    id: string
    image_url: string
    display_order: number
    gallery_type: string | null
  }[]
  tournament_event_pricing_tiers?: {
    id: string
    name: string
    name_ko?: string | null
    name_de?: string | null
    price: string | null
    display_order: number | null
    booking_url: string | null
  }[]
}

const STEPS = [
  { id: 1, title: "Event Details", description: "Basic information" },
  { id: 2, title: "Itinerary", description: "Day by day schedule" },
  { id: 3, title: "Gallery & Pricing", description: "Images and pricing tiers" },
  { id: 4, title: "Review", description: "Review and save" },
]

export function EditTournamentEventForm({
  event,
  tournamentName,
}: {
  event: TournamentEvent
  tournamentName: string
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [activeLang, setActiveLang] = useState<Lang>("en")

  const [formData, setFormData] = useState({
    title: event.title,
    title_ko: event.title_ko || "",
    title_de: event.title_de || "",
    location: event.location,
    location_ko: event.location_ko || "",
    location_de: event.location_de || "",
    date: event.date || "",
    duration: event.duration || "",
    description: event.description?.join("\n\n") || "",
    description_ko: event.description_ko?.join("\n\n") || "",
    description_de: event.description_de?.join("\n\n") || "",
    trip_highlights: event.trip_highlights?.join("\n") || "",
    trip_highlights_ko: event.trip_highlights_ko?.join("\n") || "",
    trip_highlights_de: event.trip_highlights_de?.join("\n") || "",
    travel_itinerary: event.travel_itinerary?.join("\n") || "",
    travel_itinerary_ko: event.travel_itinerary_ko?.join("\n") || "",
    travel_itinerary_de: event.travel_itinerary_de?.join("\n") || "",
    includes: event.includes?.join("\n") || "",
    includes_ko: event.includes_ko?.join("\n") || "",
    includes_de: event.includes_de?.join("\n") || "",
    excludes: event.excludes?.join("\n") || "",
    excludes_ko: event.excludes_ko?.join("\n") || "",
    excludes_de: event.excludes_de?.join("\n") || "",
    price: event.price || "",
  })

  const [imageUrl, setImageUrl] = useState(event.image || "")
  const [uploadingPhoto, setUploadingPhoto] = useState<string | null>(null)

  const [itinerary, setItinerary] = useState<ItineraryDay[]>(
    event.tournament_event_itinerary_days?.length
      ? event.tournament_event_itinerary_days.map((d) => ({
          id: d.id,
          display_order: d.display_order,
          title: d.title,
          title_ko: d.title_ko || "",
          title_de: d.title_de || "",
          content: d.content || "",
          content_ko: d.content_ko || "",
          content_de: d.content_de || "",
        }))
      : [{ id: "1", display_order: 1, title: "", title_ko: "", title_de: "", content: "", content_ko: "", content_de: "" }]
  )

  const [gallery, setGallery] = useState<GalleryImage[]>(
    event.tournament_event_gallery_images
      ?.filter((img) => img.gallery_type === 'event' || !img.gallery_type)
      .map((img) => ({
        id: img.id,
        image_url: img.image_url,
        display_order: img.display_order,
        gallery_type: 'event',
      })) || []
  )

  const [hotelGallery, setHotelGallery] = useState<GalleryImage[]>(
    event.tournament_event_gallery_images
      ?.filter((img) => img.gallery_type === 'hotel')
      .map((img) => ({
        id: img.id,
        image_url: img.image_url,
        display_order: img.display_order,
        gallery_type: 'hotel',
      })) || []
  )

  const [pricingTiers, setPricingTiers] = useState<PricingTier[]>(
    event.tournament_event_pricing_tiers?.length
      ? event.tournament_event_pricing_tiers.map((t) => ({
          id: t.id,
          name: t.name,
          name_ko: t.name_ko || "",
          name_de: t.name_de || "",
          price: t.price || "",
          display_order: t.display_order || 0,
          booking_url: t.booking_url || "",
        }))
      : [{ id: "1", name: "", name_ko: "", name_de: "", price: "", display_order: 0, booking_url: "" }]
  )
  
  // Translation state
  const [translateSource, setTranslateSource] = useState<"en" | "ko" | "de">("en")
  const [translateTargets, setTranslateTargets] = useState<("en" | "ko" | "de")[]>([])
  const [isTranslating, setIsTranslating] = useState(false)
  const [translateResult, setTranslateResult] = useState<{ success: boolean; message: string } | null>(null)
  
  // Determine which languages have content
  const getAvailableSourceLanguages = (): ("en" | "ko" | "de")[] => {
    const langs: ("en" | "ko" | "de")[] = []
    if (formData.title?.trim()) langs.push("en")
    if (formData.title_ko?.trim()) langs.push("ko")
    if (formData.title_de?.trim()) langs.push("de")
    return langs.length > 0 ? langs : ["en"]
  }

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
            gallery_type: 'hotel',
          },
        ])
      } else {
        setGallery((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            image_url: url,
            display_order: prev.length,
            gallery_type: 'event',
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
      { id: Date.now().toString(), name: "", name_ko: "", name_de: "", price: "", display_order: prev.length, booking_url: "" },
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
    
    setIsTranslating(true)
    setTranslateResult(null)
    
    try {
      const response = await fetch(`/api/admin/translate-event/${event.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceLanguage: translateSource,
          targetLanguages: translateTargets,
        }),
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setTranslateResult({ success: true, message: data.message })
        // Re-fetch the event to populate translated fields in the form
        const eventRes = await fetch(`/api/admin/tournaments/${event.tournament_id}/events/${event.id}`)
        if (eventRes.ok) {
          const updatedEvent = await eventRes.json()
          setFormData((prev) => ({
            ...prev,
            title_ko: updatedEvent.title_ko || "",
            title_de: updatedEvent.title_de || "",
            location_ko: updatedEvent.location_ko || "",
            location_de: updatedEvent.location_de || "",
            description_ko: (updatedEvent.description_ko as string[] | null)?.join("\n\n") || "",
            description_de: (updatedEvent.description_de as string[] | null)?.join("\n\n") || "",
            trip_highlights_ko: (updatedEvent.trip_highlights_ko as string[] | null)?.join("\n") || "",
            trip_highlights_de: (updatedEvent.trip_highlights_de as string[] | null)?.join("\n") || "",
            travel_itinerary_ko: (updatedEvent.travel_itinerary_ko as string[] | null)?.join("\n") || "",
            travel_itinerary_de: (updatedEvent.travel_itinerary_de as string[] | null)?.join("\n") || "",
            includes_ko: (updatedEvent.includes_ko as string[] | null)?.join("\n") || "",
            includes_de: (updatedEvent.includes_de as string[] | null)?.join("\n") || "",
            excludes_ko: (updatedEvent.excludes_ko as string[] | null)?.join("\n") || "",
            excludes_de: (updatedEvent.excludes_de as string[] | null)?.join("\n") || "",
          }))
          // Re-fetch itinerary days with translated fields
          const itineraryRes = await fetch(`/api/admin/tournaments/${event.tournament_id}/events/${event.id}/itinerary`)
          if (itineraryRes.ok) {
            const updatedItinerary = await itineraryRes.json()
            setItinerary(updatedItinerary.map((d: any) => ({
              id: d.id,
              display_order: d.display_order,
              title: d.title,
              title_ko: d.title_ko || "",
              title_de: d.title_de || "",
              content: d.content || "",
              content_ko: d.content_ko || "",
              content_de: d.content_de || "",
            })))
          }
          // Re-fetch pricing tiers with translated fields
          const tiersRes = await fetch(`/api/admin/tournaments/${event.tournament_id}/events/${event.id}/pricing-tiers`)
          if (tiersRes.ok) {
            const updatedTiers = await tiersRes.json()
            setPricingTiers(updatedTiers.map((t: any) => ({
              id: t.id,
              name: t.name,
              name_ko: t.name_ko || "",
              name_de: t.name_de || "",
              price: t.price || "",
              display_order: t.display_order || 0,
              booking_url: t.booking_url || "",
            })))
          }
        }
        router.refresh()
      } else {
        let errorMessage = data.error || "Translation failed"
        
        if (data.code === "CREDITS_EXHAUSTED" || response.status === 402) {
          errorMessage = "AI Gateway credits exhausted. Please refill your AI Gateway credits in the Vercel dashboard to continue translating."
        } else if (data.code === "RATE_LIMIT" || response.status === 429) {
          errorMessage = "Rate limit exceeded. Please wait a moment and try again."
        } else if (data.code === "AUTH_ERROR" || response.status === 401) {
          errorMessage = "AI Gateway authentication failed. Please check your API configuration."
        }
        
        setTranslateResult({ success: false, message: errorMessage })
      }
    } catch (error) {
      setTranslateResult({ success: false, message: "Failed to connect to translation service. Please check your network connection." })
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
      const response = await fetch(
        `/api/admin/tournaments/${event.tournament_id}/events/${event.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: formData.title,
            title_ko: formData.title_ko || null,
            title_de: formData.title_de || null,
            location: formData.location,
            location_ko: formData.location_ko || null,
            location_de: formData.location_de || null,
            date: formData.date,
            duration: formData.duration || null,
            description: formData.description ? formData.description.split("\n\n").filter(Boolean) : null,
            description_ko: formData.description_ko ? formData.description_ko.split("\n\n").filter(Boolean) : null,
            description_de: formData.description_de ? formData.description_de.split("\n\n").filter(Boolean) : null,
            trip_highlights: formData.trip_highlights ? formData.trip_highlights.split("\n").filter(Boolean) : null,
            trip_highlights_ko: formData.trip_highlights_ko ? formData.trip_highlights_ko.split("\n").filter(Boolean) : null,
            trip_highlights_de: formData.trip_highlights_de ? formData.trip_highlights_de.split("\n").filter(Boolean) : null,
            travel_itinerary: formData.travel_itinerary ? formData.travel_itinerary.split("\n").filter(Boolean) : null,
            travel_itinerary_ko: formData.travel_itinerary_ko ? formData.travel_itinerary_ko.split("\n").filter(Boolean) : null,
            travel_itinerary_de: formData.travel_itinerary_de ? formData.travel_itinerary_de.split("\n").filter(Boolean) : null,
            includes: formData.includes ? formData.includes.split("\n").filter(Boolean) : null,
            includes_ko: formData.includes_ko ? formData.includes_ko.split("\n").filter(Boolean) : null,
            includes_de: formData.includes_de ? formData.includes_de.split("\n").filter(Boolean) : null,
            excludes: formData.excludes ? formData.excludes.split("\n").filter(Boolean) : null,
            excludes_ko: formData.excludes_ko ? formData.excludes_ko.split("\n").filter(Boolean) : null,
            excludes_de: formData.excludes_de ? formData.excludes_de.split("\n").filter(Boolean) : null,
            price: formData.price || null,
            image: imageUrl || null,
            itinerary: itinerary.filter((d) => d.title.trim()),
            gallery: [...gallery, ...hotelGallery],
            pricing_tiers: pricingTiers.filter((t) => t.name.trim()),
          }),
        }
      )

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to update event")
      }

      router.push("/admin?tab=tournaments")
      router.refresh()
    } catch (error) {
      console.error("Error updating event:", error)
      setValidationErrors([
        error instanceof Error ? error.message : "Failed to update event",
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
              Edit Event
            </h1>
            <p className="text-xs text-gray-600 sm:text-sm">{tournamentName}</p>
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
              <div className="rounded-lg bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Event Details</h2>
                  {/* Language Tabs */}
                  <div className="flex gap-1 rounded-lg border border-gray-200 bg-gray-100 p-1">
                    {(["en", "ko", "de"] as Lang[]).map((lang) => (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => setActiveLang(lang)}
                        className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
                          activeLang === lang
                            ? "bg-white text-gray-900 shadow-sm"
                            : "text-gray-500 hover:text-gray-700"
                        }`}
                      >
                        {lang === "en" ? "EN" : lang === "ko" ? "KO" : "DE"}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">
                      Event Title {activeLang === "en" ? "*" : ""}
                      {activeLang !== "en" && <span className="ml-1 text-xs text-gray-400">({activeLang.toUpperCase()} translation)</span>}
                    </Label>
                    <Input
                      id="title"
                      value={activeLang === "en" ? formData.title : activeLang === "ko" ? formData.title_ko : formData.title_de}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, [`title${activeLang === "en" ? "" : `_${activeLang}`}`]: e.target.value }))
                      }
                      placeholder={activeLang === "en" ? "e.g., The Open 2025" : activeLang === "ko" ? "예: 디 오픈 2025" : "z.B. The Open 2025"}
                      className="mt-1"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="location">
                        Location {activeLang === "en" ? "*" : ""}
                        {activeLang !== "en" && <span className="ml-1 text-xs text-gray-400">({activeLang.toUpperCase()})</span>}
                      </Label>
                      <Input
                        id="location"
                        value={activeLang === "en" ? formData.location : activeLang === "ko" ? formData.location_ko : formData.location_de}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, [`location${activeLang === "en" ? "" : `_${activeLang}`}`]: e.target.value }))
                        }
                        placeholder={activeLang === "en" ? "e.g., Scotland" : activeLang === "ko" ? "예: 스코틀랜드" : "z.B. Schottland"}
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
                    <Label htmlFor="description">
                      Description (separate paragraphs with blank lines)
                      {activeLang !== "en" && <span className="ml-1 text-xs text-gray-400">({activeLang.toUpperCase()})</span>}
                    </Label>
                    <Textarea
                      id="description"
                      value={activeLang === "en" ? formData.description : activeLang === "ko" ? formData.description_ko : formData.description_de}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          [`description${activeLang === "en" ? "" : `_${activeLang}`}`]: e.target.value,
                        }))
                      }
                      placeholder={activeLang === "en" ? "Detailed event description..." : activeLang === "ko" ? "한국어로 이벤트 설명..." : "Veranstaltungsbeschreibung auf Deutsch..."}
                      className="mt-1"
                      rows={4}
                    />
                  </div>

                  <div>
                    <Label htmlFor="trip_highlights">
                      Trip Highlights (one per line)
                      {activeLang !== "en" && <span className="ml-1 text-xs text-gray-400">({activeLang.toUpperCase()})</span>}
                    </Label>
                    <Textarea
                      id="trip_highlights"
                      value={activeLang === "en" ? formData.trip_highlights : activeLang === "ko" ? formData.trip_highlights_ko : formData.trip_highlights_de}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          [`trip_highlights${activeLang === "en" ? "" : `_${activeLang}`}`]: e.target.value,
                        }))
                      }
                      placeholder="Premium accommodation&#10;Tournament tickets&#10;Golf rounds"
                      className="mt-1"
                      rows={4}
                    />
                  </div>

                  <div>
                    <Label htmlFor="includes">
                      Package Includes (one per line)
                      {activeLang !== "en" && <span className="ml-1 text-xs text-gray-400">({activeLang.toUpperCase()})</span>}
                    </Label>
                    <Textarea
                      id="includes"
                      value={activeLang === "en" ? formData.includes : activeLang === "ko" ? formData.includes_ko : formData.includes_de}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          [`includes${activeLang === "en" ? "" : `_${activeLang}`}`]: e.target.value,
                        }))
                      }
                      placeholder="Airport transfers&#10;Breakfast daily&#10;Tournament tickets"
                      className="mt-1"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="excludes">
                      Package Excludes (one per line)
                      {activeLang !== "en" && <span className="ml-1 text-xs text-gray-400">({activeLang.toUpperCase()})</span>}
                    </Label>
                    <Textarea
                      id="excludes"
                      value={activeLang === "en" ? formData.excludes : activeLang === "ko" ? formData.excludes_ko : formData.excludes_de}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          [`excludes${activeLang === "en" ? "" : `_${activeLang}`}`]: e.target.value,
                        }))
                      }
                      placeholder="Flights&#10;Travel insurance"
                      className="mt-1"
                      rows={3}
                    />
                  </div>
                </div>
              </div>

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
                  <div className="flex items-center gap-2">
                    {/* Language Tabs */}
                    <div className="flex gap-1 rounded-lg border border-gray-200 bg-gray-100 p-1">
                      {(["en", "ko", "de"] as Lang[]).map((lang) => (
                        <button
                          key={lang}
                          type="button"
                          onClick={() => setActiveLang(lang)}
                          className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
                            activeLang === lang
                              ? "bg-white text-gray-900 shadow-sm"
                              : "text-gray-500 hover:text-gray-700"
                          }`}
                        >
                          {lang === "en" ? "EN" : lang === "ko" ? "KO" : "DE"}
                        </button>
                      ))}
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={addItineraryDay}>
                      <Plus className="mr-1 h-4 w-4" />
                      Add Day
                    </Button>
                  </div>
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
                          <Label>
                            Title {activeLang === "en" ? "*" : ""}
                            {activeLang !== "en" && <span className="ml-1 text-xs text-gray-400">({activeLang.toUpperCase()})</span>}
                          </Label>
                          <Input
                            value={activeLang === "en" ? day.title : activeLang === "ko" ? day.title_ko : day.title_de}
                            onChange={(e) =>
                              updateItineraryDay(day.id, activeLang === "en" ? "title" : activeLang === "ko" ? "title_ko" : "title_de", e.target.value)
                            }
                            placeholder={activeLang === "en" ? "e.g., Arrival & Welcome" : activeLang === "ko" ? "예: 도착 및 환영" : "z.B. Ankunft & Willkommen"}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label>
                            Content
                            {activeLang !== "en" && <span className="ml-1 text-xs text-gray-400">({activeLang.toUpperCase()})</span>}
                          </Label>
                          <Textarea
                            value={activeLang === "en" ? day.content : activeLang === "ko" ? day.content_ko : day.content_de}
                            onChange={(e) =>
                              updateItineraryDay(day.id, activeLang === "en" ? "content" : activeLang === "ko" ? "content_ko" : "content_de", e.target.value)
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
                  <div className="flex items-center gap-2">
                    {/* Language Tabs */}
                    <div className="flex gap-1 rounded-lg border border-gray-200 bg-gray-100 p-1">
                      {(["en", "ko", "de"] as Lang[]).map((lang) => (
                        <button
                          key={lang}
                          type="button"
                          onClick={() => setActiveLang(lang)}
                          className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
                            activeLang === lang
                              ? "bg-white text-gray-900 shadow-sm"
                              : "text-gray-500 hover:text-gray-700"
                          }`}
                        >
                          {lang === "en" ? "EN" : lang === "ko" ? "KO" : "DE"}
                        </button>
                      ))}
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={addPricingTier}>
                      <Plus className="mr-1 h-4 w-4" />
                      Add Tier
                    </Button>
                  </div>
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
                            <Label>
                              Tier Name {activeLang === "en" ? "*" : ""}
                              {activeLang !== "en" && <span className="ml-1 text-xs text-gray-400">({activeLang.toUpperCase()})</span>}
                            </Label>
                            <Input
                              value={activeLang === "en" ? tier.name : activeLang === "ko" ? tier.name_ko : tier.name_de}
                              onChange={(e) =>
                                updatePricingTier(tier.id, activeLang === "en" ? "name" : activeLang === "ko" ? "name_ko" : "name_de", e.target.value)
                              }
                              placeholder={activeLang === "en" ? "e.g., Premium Package" : activeLang === "ko" ? "예: 프리미엄 패키지" : "z.B. Premium-Paket"}
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
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      Review & Save
                    </h2>
                    <p className="text-sm text-gray-600">
                      Please review your event details below. Click "Save Changes" when ready.
                    </p>
                  </div>
                  {/* Language Tabs for Preview */}
                  <div className="flex gap-1 rounded-lg border border-gray-200 bg-gray-100 p-1">
                    {(["en", "ko", "de"] as Lang[]).map((lang) => (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => setActiveLang(lang)}
                        className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
                          activeLang === lang
                            ? "bg-white text-gray-900 shadow-sm"
                            : "text-gray-500 hover:text-gray-700"
                        }`}
                      >
                        {lang === "en" ? "EN" : lang === "ko" ? "KO" : "DE"}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-lg border border-gray-200 p-4">
                    <Label className="text-xs uppercase tracking-wide text-gray-500">Event Title</Label>
                    <p className="mt-1 text-base font-medium text-gray-900">
                      {activeLang === "en" ? (formData.title || "—") : activeLang === "ko" ? (formData.title_ko || <span className="text-gray-400 italic">No Korean translation</span>) : (formData.title_de || <span className="text-gray-400 italic">No German translation</span>)}
                    </p>
                  </div>

                  <div className="rounded-lg border border-gray-200 p-4">
                    <Label className="text-xs uppercase tracking-wide text-gray-500">Location</Label>
                    <p className="mt-1 text-base font-medium text-gray-900">
                      {activeLang === "en" ? (formData.location || "—") : activeLang === "ko" ? (formData.location_ko || <span className="text-gray-400 italic">No Korean translation</span>) : (formData.location_de || <span className="text-gray-400 italic">No German translation</span>)}
                    </p>
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

                  {(() => {
                    const desc = activeLang === "en" ? formData.description : activeLang === "ko" ? formData.description_ko : formData.description_de
                    return formData.description || desc ? (
                      <div className="rounded-lg border border-gray-200 p-4">
                        <Label className="text-xs uppercase tracking-wide text-gray-500">Description</Label>
                        <p className="mt-1 text-sm text-gray-700 line-clamp-3">
                          {desc || <span className="text-gray-400 italic">No {activeLang === "ko" ? "Korean" : activeLang === "de" ? "German" : ""} translation</span>}
                        </p>
                      </div>
                    ) : null
                  })()}

                  {(() => {
                    const highlights = activeLang === "en" ? formData.trip_highlights : activeLang === "ko" ? formData.trip_highlights_ko : formData.trip_highlights_de
                    return formData.trip_highlights || highlights ? (
                      <div className="rounded-lg border border-gray-200 p-4">
                        <Label className="text-xs uppercase tracking-wide text-gray-500">Trip Highlights</Label>
                        <p className="mt-1 text-sm text-gray-700 line-clamp-3">
                          {highlights || <span className="text-gray-400 italic">No {activeLang === "ko" ? "Korean" : activeLang === "de" ? "German" : ""} translation</span>}
                        </p>
                      </div>
                    ) : null
                  })()}

                  {(() => {
                    const includes = activeLang === "en" ? formData.includes : activeLang === "ko" ? formData.includes_ko : formData.includes_de
                    return formData.includes || includes ? (
                      <div className="rounded-lg border border-gray-200 p-4">
                        <Label className="text-xs uppercase tracking-wide text-gray-500">Package Includes</Label>
                        <p className="mt-1 text-sm text-gray-700 line-clamp-3">
                          {includes || <span className="text-gray-400 italic">No {activeLang === "ko" ? "Korean" : activeLang === "de" ? "German" : ""} translation</span>}
                        </p>
                      </div>
                    ) : null
                  })()}

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
                      .map((tier) => {
                        const tierName = activeLang === "en" ? tier.name : activeLang === "ko" ? (tier.name_ko || tier.name) : (tier.name_de || tier.name)
                        return (
                          <p key={tier.id} className="text-sm text-gray-600">
                            • {tierName}{tier.price ? `: ${tier.price}` : ""}
                            {activeLang !== "en" && !((activeLang === "ko" && tier.name_ko) || (activeLang === "de" && tier.name_de)) && (
                              <span className="ml-1 text-xs text-gray-400 italic">(no translation)</span>
                            )}
                          </p>
                        )
                      })}
                  </div>
                </div>
              </div>

              {/* Translation Section */}
              <div className="rounded-lg bg-white p-6 shadow-sm">
                <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
                  <Languages className="h-5 w-5" />
                  Translate Content
                </h3>
                <p className="mb-4 text-sm text-gray-600">
                  Translate this event&apos;s content to other languages. Select a source language and choose which languages to translate into.
                </p>
                
                <div className="space-y-4">
                  {/* Source Language */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">Source Language</label>
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
                              ? "border-[#274C77] bg-[#274C77] text-white"
                              : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
                          }`}
                        >
                          {lang === "en" ? "English" : lang === "ko" ? "Korean" : "German"}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Target Languages */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">Translate To</label>
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
                              ? "border-[#274C77] bg-[#274C77] text-white"
                              : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
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
                    className="w-full bg-[#274C77] hover:bg-[#274C77]/90 sm:w-auto"
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
                  
                  {/* Result */}
                  {translateResult && (
                    <div className={`rounded-md p-3 text-sm ${
                      translateResult.success 
                        ? "bg-green-50 text-green-700 border border-green-200" 
                        : "bg-red-50 text-red-700 border border-red-200"
                    }`}>
                      {translateResult.message}
                    </div>
                  )}
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
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
