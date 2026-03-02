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
} from "lucide-react"
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

type TournamentEvent = {
  id: string
  tournament_id: string
  slug: string
  title: string
  location: string
  date: string
  duration: string | null
  description: string[] | null
  trip_highlights: string[] | null
  travel_itinerary: string[] | null
  includes: string[] | null
  excludes: string[] | null
  image: string | null
  hero_image: string | null
  price: string | null
  tournament_event_itinerary_days?: {
    id: string
    display_order: number
    title: string
    content: string | null
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

  const [formData, setFormData] = useState({
    title: event.title,
    location: event.location,
    date: event.date || "",
    duration: event.duration || "",
    description: event.description?.join("\n\n") || "",
    trip_highlights: event.trip_highlights?.join("\n") || "",
    travel_itinerary: event.travel_itinerary?.join("\n") || "",
    includes: event.includes?.join("\n") || "",
    excludes: event.excludes?.join("\n") || "",
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
          content: d.content || "",
        }))
      : [{ id: "1", display_order: 1, title: "", content: "" }]
  )

  const [gallery, setGallery] = useState<GalleryImage[]>(
    event.tournament_event_gallery_images?.map((img) => ({
      id: img.id,
      image_url: img.image_url,
      display_order: img.display_order,
      gallery_type: img.gallery_type || "gallery1",
    })) || []
  )

  const [pricingTiers, setPricingTiers] = useState<PricingTier[]>(
    event.tournament_event_pricing_tiers?.length
      ? event.tournament_event_pricing_tiers.map((t) => ({
          id: t.id,
          name: t.name,
          price: t.price || "",
          display_order: t.display_order || 0,
          booking_url: t.booking_url || "",
        }))
      : [{ id: "1", name: "", price: "", display_order: 0, booking_url: "" }]
  )

  const handlePhotoUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "main" | "gallery"
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
      } else {
        setGallery((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            image_url: url,
            caption: "",
            display_order: prev.length,
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

  const handleNext = () => {
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
            location: formData.location,
            date: formData.date,
            duration: formData.duration || null,
            description: formData.description ? formData.description.split("\n\n").filter(Boolean) : null,
            trip_highlights: formData.trip_highlights ? formData.trip_highlights.split("\n").filter(Boolean) : null,
            travel_itinerary: formData.travel_itinerary ? formData.travel_itinerary.split("\n").filter(Boolean) : null,
            includes: formData.includes ? formData.includes.split("\n").filter(Boolean) : null,
            excludes: formData.excludes ? formData.excludes.split("\n").filter(Boolean) : null,
            price: formData.price || null,
            image: imageUrl || null,
            itinerary: itinerary.filter((d) => d.title.trim()),
            gallery: gallery,
            pricing_tiers: pricingTiers.filter((t) => t.name.trim()),
          }),
        }
      )

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to update event")
      }

      router.push("/admin/tournaments")
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
          <Link href="/admin/tournaments">
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
                <h2 className="mb-4 text-lg font-semibold text-gray-900">
                  Event Details
                </h2>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Event Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, title: e.target.value }))
                      }
                      placeholder="e.g., The Open 2025"
                      className="mt-1"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="location">Location *</Label>
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, location: e.target.value }))
                        }
                        placeholder="e.g., Scotland"
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
                    <Label htmlFor="description">Description (separate paragraphs with blank lines)</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      placeholder="Detailed event description..."
                      className="mt-1"
                      rows={4}
                    />
                  </div>

                  <div>
                    <Label htmlFor="trip_highlights">Trip Highlights (one per line)</Label>
                    <Textarea
                      id="trip_highlights"
                      value={formData.trip_highlights}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          trip_highlights: e.target.value,
                        }))
                      }
                      placeholder="Premium accommodation&#10;Tournament tickets&#10;Golf rounds"
                      className="mt-1"
                      rows={4}
                    />
                  </div>

                  <div>
                    <Label htmlFor="includes">Package Includes (one per line)</Label>
                    <Textarea
                      id="includes"
                      value={formData.includes}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          includes: e.target.value,
                        }))
                      }
                      placeholder="Airport transfers&#10;Breakfast daily&#10;Tournament tickets"
                      className="mt-1"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="excludes">Package Excludes (one per line)</Label>
                    <Textarea
                      id="excludes"
                      value={formData.excludes}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          excludes: e.target.value,
                        }))
                      }
                      placeholder="Flights&#10;Travel insurance"
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
                <h2 className="mb-4 text-lg font-semibold text-gray-900">Gallery</h2>

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
                  Review & Save
                </h2>
                <p className="mb-6 text-sm text-gray-600">
                  Please review your event details below. Click "Save Changes" when ready.
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
                    <Label className="text-xs uppercase tracking-wide text-gray-500">Gallery</Label>
                    <p className="mt-1 text-base font-medium text-gray-900">{gallery.length} images</p>
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
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
