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
  day_number: number
  title: string
  description: string
}

type GalleryImage = {
  id: string
  image_url: string
  caption: string
  display_order: number
}

type PricingTier = {
  id: string
  name: string
  price: number
  description: string
  features: string[]
}

type TournamentEvent = {
  id: string
  tournament_id: string
  slug: string
  name: string
  location: string
  venue: string | null
  event_date: string
  end_date: string | null
  description: string | null
  short_description: string | null
  image_url: string | null
  tournament_event_itinerary_days?: {
    id: string
    day_number: number
    title: string
    description: string | null
  }[]
  tournament_event_gallery_images?: {
    id: string
    image_url: string
    caption: string | null
    display_order: number
  }[]
  tournament_event_pricing_tiers?: {
    id: string
    name: string
    price: number
    description: string | null
    features: string[] | null
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
    name: event.name,
    location: event.location,
    venue: event.venue || "",
    event_date: event.event_date?.split("T")[0] || "",
    end_date: event.end_date?.split("T")[0] || "",
    description: event.description || "",
    short_description: event.short_description || "",
  })

  const [imageUrl, setImageUrl] = useState(event.image_url || "")
  const [uploadingPhoto, setUploadingPhoto] = useState<string | null>(null)

  const [itinerary, setItinerary] = useState<ItineraryDay[]>(
    event.tournament_event_itinerary_days?.length
      ? event.tournament_event_itinerary_days.map((d) => ({
          id: d.id,
          day_number: d.day_number,
          title: d.title,
          description: d.description || "",
        }))
      : [{ id: "1", day_number: 1, title: "", description: "" }]
  )

  const [gallery, setGallery] = useState<GalleryImage[]>(
    event.tournament_event_gallery_images?.map((img) => ({
      id: img.id,
      image_url: img.image_url,
      caption: img.caption || "",
      display_order: img.display_order,
    })) || []
  )

  const [pricingTiers, setPricingTiers] = useState<PricingTier[]>(
    event.tournament_event_pricing_tiers?.length
      ? event.tournament_event_pricing_tiers.map((t) => ({
          id: t.id,
          name: t.name,
          price: t.price,
          description: t.description || "",
          features: t.features || [""],
        }))
      : [{ id: "1", name: "", price: 0, description: "", features: [""] }]
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
    const nextDayNumber = itinerary.length + 1
    setItinerary((prev) => [
      ...prev,
      { id: Date.now().toString(), day_number: nextDayNumber, title: "", description: "" },
    ])
  }

  const removeItineraryDay = (id: string) => {
    setItinerary((prev) => {
      const filtered = prev.filter((d) => d.id !== id)
      return filtered.map((d, i) => ({ ...d, day_number: i + 1 }))
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

  const updateGalleryCaption = (id: string, caption: string) => {
    setGallery((prev) =>
      prev.map((img) => (img.id === id ? { ...img, caption } : img))
    )
  }

  const addPricingTier = () => {
    setPricingTiers((prev) => [
      ...prev,
      { id: Date.now().toString(), name: "", price: 0, description: "", features: [""] },
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

  const addFeature = (tierId: string) => {
    setPricingTiers((prev) =>
      prev.map((t) =>
        t.id === tierId ? { ...t, features: [...t.features, ""] } : t
      )
    )
  }

  const removeFeature = (tierId: string, featureIndex: number) => {
    setPricingTiers((prev) =>
      prev.map((t) =>
        t.id === tierId
          ? { ...t, features: t.features.filter((_, i) => i !== featureIndex) }
          : t
      )
    )
  }

  const updateFeature = (tierId: string, featureIndex: number, value: string) => {
    setPricingTiers((prev) =>
      prev.map((t) =>
        t.id === tierId
          ? {
              ...t,
              features: t.features.map((f, i) => (i === featureIndex ? value : f)),
            }
          : t
      )
    )
  }

  const validateCurrentStep = (): { valid: boolean; errors: string[] } => {
    const errors: string[] = []

    switch (currentStep) {
      case 1:
        if (!formData.name.trim()) errors.push("Event name is required")
        if (!formData.location.trim()) errors.push("Location is required")
        if (!formData.event_date) errors.push("Event date is required")
        break
      case 2:
        itinerary.forEach((day, i) => {
          if (!day.title.trim()) errors.push(`Day ${i + 1} title is required`)
        })
        break
      case 3:
        pricingTiers.forEach((tier, i) => {
          if (!tier.name.trim()) errors.push(`Pricing tier ${i + 1} name is required`)
          if (tier.price <= 0) errors.push(`Pricing tier ${i + 1} must have a valid price`)
        })
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
            name: formData.name,
            location: formData.location,
            venue: formData.venue || null,
            event_date: formData.event_date,
            end_date: formData.end_date || null,
            description: formData.description || null,
            short_description: formData.short_description || null,
            image_url: imageUrl || null,
            itinerary: itinerary.filter((d) => d.title.trim()),
            gallery: gallery,
            pricing_tiers: pricingTiers.filter((t) => t.name.trim() && t.price > 0),
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
                    <Label htmlFor="name">Event Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, name: e.target.value }))
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
                      <Label htmlFor="venue">Venue</Label>
                      <Input
                        id="venue"
                        value={formData.venue}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, venue: e.target.value }))
                        }
                        placeholder="e.g., Royal Troon Golf Club"
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="event_date">Event Start Date *</Label>
                      <Input
                        id="event_date"
                        type="date"
                        value={formData.event_date}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, event_date: e.target.value }))
                        }
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="end_date">Event End Date</Label>
                      <Input
                        id="end_date"
                        type="date"
                        value={formData.end_date}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, end_date: e.target.value }))
                        }
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="short_description">Short Description</Label>
                    <Input
                      id="short_description"
                      value={formData.short_description}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          short_description: e.target.value,
                        }))
                      }
                      placeholder="Brief one-line description"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Full Description</Label>
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
                            Day {day.day_number}
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
                          <Label>Description</Label>
                          <Textarea
                            value={day.description}
                            onChange={(e) =>
                              updateItineraryDay(day.id, "description", e.target.value)
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
                      <Input
                        value={img.caption}
                        onChange={(e) => updateGalleryCaption(img.id, e.target.value)}
                        placeholder="Caption"
                        className="mt-2 text-xs"
                      />
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
                            <Label>Price (USD) *</Label>
                            <Input
                              type="number"
                              value={tier.price || ""}
                              onChange={(e) =>
                                updatePricingTier(
                                  tier.id,
                                  "price",
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              placeholder="0.00"
                              className="mt-1"
                            />
                          </div>
                        </div>

                        <div>
                          <Label>Description</Label>
                          <Textarea
                            value={tier.description}
                            onChange={(e) =>
                              updatePricingTier(tier.id, "description", e.target.value)
                            }
                            placeholder="What's included in this tier..."
                            className="mt-1"
                            rows={2}
                          />
                        </div>

                        <div>
                          <div className="mb-2 flex items-center justify-between">
                            <Label>Features</Label>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => addFeature(tier.id)}
                              className="h-6 text-xs"
                            >
                              <Plus className="mr-1 h-3 w-3" />
                              Add
                            </Button>
                          </div>
                          <div className="space-y-2">
                            {tier.features.map((feature, featureIndex) => (
                              <div key={featureIndex} className="flex gap-2">
                                <Input
                                  value={feature}
                                  onChange={(e) =>
                                    updateFeature(tier.id, featureIndex, e.target.value)
                                  }
                                  placeholder="Feature description"
                                  className="flex-1"
                                />
                                {tier.features.length > 1 && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeFeature(tier.id, featureIndex)}
                                    className="h-10 w-10 text-red-500 hover:bg-red-50"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            ))}
                          </div>
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
                <h2 className="mb-4 text-lg font-semibold text-gray-900">Review</h2>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Event Details</h3>
                    <p className="text-lg font-semibold">{formData.name || "Untitled"}</p>
                    <p className="text-sm text-gray-600">
                      {formData.location}
                      {formData.venue && ` • ${formData.venue}`}
                    </p>
                    <p className="text-sm text-gray-600">
                      {formData.event_date &&
                        new Date(formData.event_date).toLocaleDateString("en-US", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })}
                      {formData.end_date &&
                        ` - ${new Date(formData.end_date).toLocaleDateString("en-US", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })}`}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Itinerary</h3>
                    <p className="text-sm text-gray-600">
                      {itinerary.filter((d) => d.title.trim()).length} days planned
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Gallery</h3>
                    <p className="text-sm text-gray-600">{gallery.length} images</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Pricing</h3>
                    <p className="text-sm text-gray-600">
                      {pricingTiers.filter((t) => t.name.trim()).length} pricing tiers
                    </p>
                    {pricingTiers
                      .filter((t) => t.name.trim() && t.price > 0)
                      .map((tier) => (
                        <p key={tier.id} className="text-sm text-gray-600">
                          • {tier.name}: ${tier.price.toLocaleString()}
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
