"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useRouter } from 'next/navigation'
import { Upload, X, Plus, Trash2, ChevronRight, ChevronLeft } from 'lucide-react'
import Image from "next/image"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const CONTINENTS = ["Africa", "Asia", "Europe", "North America", "South America"]

type Package = {
  id: string
  name: string
  description: string
  price: string
  availability: string
  quantity: string
  participants_per_booking: string
}

type AddOn = {
  id: string
  name: string
  description: string
  price: string
  price_type: "per_participant" | "per_booking"
  availability: string
  quantity: string
}

const STEPS = [
  { id: 1, title: "Trip Basics", description: "Title, description, and images" },
  { id: 2, title: "Packages", description: "Room types and accommodation" },
  { id: 3, title: "Add-ons", description: "Optional extras and services" },
  { id: 4, title: "Review & Submit", description: "Review and publish trip" },
]

export function CreateTripForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    continent: "",
    price_regular: "",
    price_wholesale: "",
    duration_nights: "7",
    max_guests: "20",
    includes_breakfast: false,
    includes_transport: false,
  })
  const [photos, setPhotos] = useState({
    courses: "",
    singleRoom: "",
    doubleRoom: "",
  })
  const [uploadingPhoto, setUploadingPhoto] = useState<string | null>(null)
  
  const [packages, setPackages] = useState<Package[]>([])
  const [addOns, setAddOns] = useState<AddOn[]>([])

  const handlePhotoUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    photoType: "courses" | "singleRoom" | "doubleRoom",
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

  const handleRemovePhoto = (photoType: "courses" | "singleRoom" | "doubleRoom") => {
    setPhotos((prev) => ({ ...prev, [photoType]: "" }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/admin/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          price_regular: Number(formData.price_regular),
          price_wholesale: Number(formData.price_wholesale),
          duration_nights: Number(formData.duration_nights),
          max_guests: Number(formData.max_guests),
          courses_photo_url: photos.courses || null,
          single_room_photo_url: photos.singleRoom || null,
          double_room_photo_url: photos.doubleRoom || null,
          packages: packages.map((pkg) => ({
            name: pkg.name,
            description: pkg.description,
            price: Number(pkg.price),
            availability: pkg.availability,
            quantity: pkg.quantity ? Number(pkg.quantity) : null,
            participants_per_booking: Number(pkg.participants_per_booking),
          })),
          addOns: addOns.map((addon) => ({
            name: addon.name,
            description: addon.description,
            price: Number(addon.price),
            price_type: addon.price_type,
            availability: addon.availability,
            quantity: addon.quantity ? Number(addon.quantity) : null,
          })),
        }),
      })

      if (!response.ok) throw new Error("Failed to create trip")

      router.push("/admin/trips")
      router.refresh()
    } catch (error) {
      console.error("Error creating trip:", error)
      alert("Failed to create trip")
    } finally {
      setLoading(false)
    }
  }

  const addPackage = () => {
    setPackages([
      ...packages,
      {
        id: crypto.randomUUID(),
        name: "",
        description: "",
        price: "",
        availability: "unlimited",
        quantity: "",
        participants_per_booking: "1",
      },
    ])
  }

  const updatePackage = (id: string, field: keyof Package, value: string) => {
    setPackages(packages.map((pkg) => (pkg.id === id ? { ...pkg, [field]: value } : pkg)))
  }

  const removePackage = (id: string) => {
    setPackages(packages.filter((pkg) => pkg.id !== id))
  }

  const addAddOn = () => {
    setAddOns([
      ...addOns,
      {
        id: crypto.randomUUID(),
        name: "",
        description: "",
        price: "",
        price_type: "per_participant",
        availability: "unlimited",
        quantity: "",
      },
    ])
  }

  const updateAddOn = (id: string, field: keyof AddOn, value: string) => {
    setAddOns(addOns.map((addon) => (addon.id === id ? { ...addon, [field]: value } : addon)))
  }

  const removeAddOn = (id: string) => {
    setAddOns(addOns.filter((addon) => addon.id !== id))
  }

  const canProceedToNextStep = () => {
    switch (currentStep) {
      case 1:
        return formData.title && formData.location && formData.continent && formData.price_regular && formData.price_wholesale
      case 2:
        return true // Packages are optional
      case 3:
        return true // Add-ons are optional
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

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {STEPS.map((step, idx) => (
            <div key={step.id} className="flex flex-1 items-center">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-2 font-semibold transition-colors ${
                    currentStep === step.id
                      ? "border-[#6b705c] bg-[#6b705c] text-white"
                      : currentStep > step.id
                        ? "border-[#a4b96a] bg-[#a4b96a] text-white"
                        : "border-muted-foreground/30 text-muted-foreground"
                  }`}
                >
                  {step.id}
                </div>
                <div className="hidden md:block">
                  <p className={`text-sm font-medium ${currentStep >= step.id ? "text-foreground" : "text-muted-foreground"}`}>
                    {step.title}
                  </p>
                  <p className="text-xs text-muted-foreground">{step.description}</p>
                </div>
              </div>
              {idx < STEPS.length - 1 && (
                <div
                  className={`mx-2 h-0.5 flex-1 md:mx-4 ${
                    currentStep > step.id ? "bg-[#a4b96a]" : "bg-muted-foreground/30"
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
              <p className="text-sm text-muted-foreground">Enter the basic information about your golf trip</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="title">Trip Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="St. Andrews Golf Experience"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="St. Andrews, Scotland"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the trip experience..."
                rows={6}
              />
            </div>

            <div className="space-y-3">
              <Label>Choose Continent *</Label>
              <div className="flex flex-wrap gap-2">
                {CONTINENTS.map((continent) => (
                  <button
                    key={continent}
                    type="button"
                    onClick={() => setFormData({ ...formData, continent })}
                    className={`rounded-full border px-4 py-2 text-sm transition-colors sm:px-6 ${
                      formData.continent === continent
                        ? "border-[#6b705c] bg-[#6b705c] text-white"
                        : "border-muted-foreground/30 bg-background text-foreground hover:border-[#6b705c]/50"
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

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="price_regular">Regular Price ($) *</Label>
                <Input
                  id="price_regular"
                  type="number"
                  step="0.01"
                  value={formData.price_regular}
                  onChange={(e) => setFormData({ ...formData, price_regular: e.target.value })}
                  placeholder="2500.00"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price_wholesale">Wholesale Price ($) *</Label>
                <Input
                  id="price_wholesale"
                  type="number"
                  step="0.01"
                  value={formData.price_wholesale}
                  onChange={(e) => setFormData({ ...formData, price_wholesale: e.target.value })}
                  placeholder="2250.00"
                  required
                />
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="duration_nights">Duration (nights)</Label>
                <Input
                  id="duration_nights"
                  type="number"
                  value={formData.duration_nights}
                  onChange={(e) => setFormData({ ...formData, duration_nights: e.target.value })}
                  placeholder="7"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="max_guests">Max Guests</Label>
                <Input
                  id="max_guests"
                  type="number"
                  value={formData.max_guests}
                  onChange={(e) => setFormData({ ...formData, max_guests: e.target.value })}
                  placeholder="20"
                />
              </div>
            </div>

            <div className="space-y-4">
              <Label>Inclusions</Label>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includes_breakfast"
                  checked={formData.includes_breakfast}
                  onCheckedChange={(checked) => setFormData({ ...formData, includes_breakfast: checked as boolean })}
                />
                <label
                  htmlFor="includes_breakfast"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Includes Breakfast
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includes_transport"
                  checked={formData.includes_transport}
                  onCheckedChange={(checked) => setFormData({ ...formData, includes_transport: checked as boolean })}
                />
                <label
                  htmlFor="includes_transport"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Includes Transportation
                </label>
              </div>
            </div>

            <div className="space-y-3">
              <Label>Upload Photos for Courses</Label>
              {photos.courses ? (
                <div className="relative aspect-[2/1] w-full overflow-hidden rounded-lg border-2 border-dashed border-border">
                  <Image src={photos.courses || "/placeholder.svg"} alt="Golf courses" fill className="object-cover" />
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
                <label className="flex aspect-[2/1] w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/20 transition-colors hover:bg-muted/40">
                  <Upload className="mb-3 h-12 w-12 text-muted-foreground" />
                  <p className="text-sm">
                    <span className="text-primary">Click to upload</span>
                    <span className="text-muted-foreground"> or drag and drop</span>
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">JPG, JPEG, PNG less than 1MB</p>
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

            <div className="space-y-3">
              <Label>Upload Photos for Single Occupancy Room</Label>
              {photos.singleRoom ? (
                <div className="relative aspect-[2/1] w-full overflow-hidden rounded-lg border-2 border-dashed border-border">
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
                <label className="flex aspect-[2/1] w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/20 transition-colors hover:bg-muted/40">
                  <Upload className="mb-3 h-12 w-12 text-muted-foreground" />
                  <p className="text-sm">
                    <span className="text-primary">Click to upload</span>
                    <span className="text-muted-foreground"> or drag and drop</span>
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">JPG, JPEG, PNG less than 1MB</p>
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

            <div className="space-y-3">
              <Label>Upload Photos for Double Occupancy Room</Label>
              {photos.doubleRoom ? (
                <div className="relative aspect-[2/1] w-full overflow-hidden rounded-lg border-2 border-dashed border-border">
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
                <label className="flex aspect-[2/1] w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/20 transition-colors hover:bg-muted/40">
                  <Upload className="mb-3 h-12 w-12 text-muted-foreground" />
                  <p className="text-sm">
                    <span className="text-primary">Click to upload</span>
                    <span className="text-muted-foreground"> or drag and drop</span>
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">JPG, JPEG, PNG less than 1MB</p>
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
              <p className="text-sm text-muted-foreground">Add room types and accommodation options for your trip</p>
            </div>

            <div className="space-y-4 rounded-lg border border-border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Packages</h3>
                  <p className="text-sm text-muted-foreground">Add room types and accommodation options</p>
                </div>
                <Button type="button" onClick={addPackage} size="sm" className="bg-[#a4b96a] hover:bg-[#93a55e]">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Package
                </Button>
              </div>

              {packages.map((pkg, index) => (
                <div key={pkg.id} className="space-y-4 rounded-lg border border-border bg-muted/20 p-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Package {index + 1}</h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removePackage(pkg.id)}
                      className="text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label>Package name *</Label>
                    <Input
                      value={pkg.name}
                      onChange={(e) => updatePackage(pkg.id, "name", e.target.value)}
                      placeholder="Enter package name (e.g. Europe Trip or Single Room)"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Description (optional)</Label>
                    <Textarea
                      value={pkg.description}
                      onChange={(e) => updatePackage(pkg.id, "description", e.target.value)}
                      placeholder="Enter package description (optional)"
                      rows={3}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Full price per person *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={pkg.price}
                        onChange={(e) => updatePackage(pkg.id, "price", e.target.value)}
                        placeholder="100"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Participants per booking *</Label>
                      <Input
                        type="number"
                        value={pkg.participants_per_booking}
                        onChange={(e) => updatePackage(pkg.id, "participants_per_booking", e.target.value)}
                        placeholder="2"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Availability</Label>
                      <Select value={pkg.availability} onValueChange={(value) => updatePackage(pkg.id, "availability", value)}>
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
                        <Label>Quantity</Label>
                        <Input
                          type="number"
                          value={pkg.quantity}
                          onChange={(e) => updatePackage(pkg.id, "quantity", e.target.value)}
                          placeholder="10"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {packages.length === 0 && (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  No packages added yet. Click "Add Package" to create room types.
                </div>
              )}
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold">Add-ons</h2>
              <p className="text-sm text-muted-foreground">Add optional extras and services for participants</p>
            </div>

            <div className="space-y-4 rounded-lg border border-border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Add-ons</h3>
                  <p className="text-sm text-muted-foreground">
                    List items that participants can add (e.g. airport transfer, massage, guided tour)
                  </p>
                </div>
                <Button type="button" onClick={addAddOn} size="sm" className="bg-[#a4b96a] hover:bg-[#93a55e]">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Add-on
                </Button>
              </div>

              {addOns.map((addon, index) => (
                <div key={addon.id} className="space-y-4 rounded-lg border border-border bg-muted/20 p-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Add-on {index + 1}</h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAddOn(addon.id)}
                      className="text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label>Add-on name *</Label>
                    <Input
                      value={addon.name}
                      onChange={(e) => updateAddOn(addon.id, "name", e.target.value)}
                      placeholder="Add-on name"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Description (optional)</Label>
                    <Textarea
                      value={addon.description}
                      onChange={(e) => updateAddOn(addon.id, "description", e.target.value)}
                      placeholder="Enter add-on description (optional)"
                      rows={3}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Price *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={addon.price}
                        onChange={(e) => updateAddOn(addon.id, "price", e.target.value)}
                        placeholder="0"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Add-on type</Label>
                      <Select
                        value={addon.price_type}
                        onValueChange={(value: "per_participant" | "per_booking") => updateAddOn(addon.id, "price_type", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="per_participant">Priced per participant</SelectItem>
                          <SelectItem value="per_booking">Priced per booking</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Availability</Label>
                      <Select value={addon.availability} onValueChange={(value) => updateAddOn(addon.id, "availability", value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unlimited">Unlimited</SelectItem>
                          <SelectItem value="limited">Limited</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {addon.availability === "limited" && (
                      <div className="space-y-2">
                        <Label>Quantity</Label>
                        <Input
                          type="number"
                          value={addon.quantity}
                          onChange={(e) => updateAddOn(addon.id, "quantity", e.target.value)}
                          placeholder="5"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {addOns.length === 0 && (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  No add-ons added yet. Click "Add Add-on" to create optional extras.
                </div>
              )}
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold">Review & Submit</h2>
              <p className="text-sm text-muted-foreground">Review all trip details before publishing</p>
            </div>

            <div className="space-y-6">
              {/* Trip Basics Summary */}
              <div className="rounded-lg border border-border p-6">
                <h3 className="mb-4 text-lg font-semibold">Trip Basics</h3>
                <div className="grid gap-4 text-sm">
                  <div>
                    <span className="font-medium">Title:</span> {formData.title || "Not set"}
                  </div>
                  <div>
                    <span className="font-medium">Location:</span> {formData.location || "Not set"}
                  </div>
                  <div>
                    <span className="font-medium">Continent:</span> {formData.continent || "Not set"}
                  </div>
                  <div>
                    <span className="font-medium">Description:</span>{" "}
                    {formData.description ? (
                      <span className="text-muted-foreground">{formData.description}</span>
                    ) : (
                      "Not set"
                    )}
                  </div>
                  <div className="grid gap-2 md:grid-cols-2">
                    <div>
                      <span className="font-medium">Regular Price:</span> ${formData.price_regular || "0.00"}
                    </div>
                    <div>
                      <span className="font-medium">Wholesale Price:</span> ${formData.price_wholesale || "0.00"}
                    </div>
                  </div>
                  <div className="grid gap-2 md:grid-cols-2">
                    <div>
                      <span className="font-medium">Duration:</span> {formData.duration_nights} nights
                    </div>
                    <div>
                      <span className="font-medium">Max Guests:</span> {formData.max_guests}
                    </div>
                  </div>
                  <div>
                    <span className="font-medium">Inclusions:</span>{" "}
                    {formData.includes_breakfast || formData.includes_transport ? (
                      <span>
                        {formData.includes_breakfast && "Breakfast"}
                        {formData.includes_breakfast && formData.includes_transport && ", "}
                        {formData.includes_transport && "Transportation"}
                      </span>
                    ) : (
                      "None"
                    )}
                  </div>
                  <div className="flex flex-wrap gap-4">
                    {photos.courses && (
                      <div>
                        <p className="mb-1 font-medium">Courses Photo</p>
                        <div className="relative h-20 w-32 overflow-hidden rounded border">
                          <Image src={photos.courses || "/placeholder.svg"} alt="Courses" fill className="object-cover" />
                        </div>
                      </div>
                    )}
                    {photos.singleRoom && (
                      <div>
                        <p className="mb-1 font-medium">Single Room Photo</p>
                        <div className="relative h-20 w-32 overflow-hidden rounded border">
                          <Image src={photos.singleRoom || "/placeholder.svg"} alt="Single Room" fill className="object-cover" />
                        </div>
                      </div>
                    )}
                    {photos.doubleRoom && (
                      <div>
                        <p className="mb-1 font-medium">Double Room Photo</p>
                        <div className="relative h-20 w-32 overflow-hidden rounded border">
                          <Image src={photos.doubleRoom || "/placeholder.svg"} alt="Double Room" fill className="object-cover" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Packages Summary */}
              <div className="rounded-lg border border-border p-6">
                <h3 className="mb-4 text-lg font-semibold">Packages ({packages.length})</h3>
                {packages.length > 0 ? (
                  <div className="space-y-4">
                    {packages.map((pkg, idx) => (
                      <div key={pkg.id} className="rounded border border-border bg-muted/20 p-4 text-sm">
                        <p className="mb-2 font-medium">{pkg.name || `Package ${idx + 1}`}</p>
                        {pkg.description && <p className="mb-2 text-muted-foreground">{pkg.description}</p>}
                        <div className="grid gap-2 md:grid-cols-2">
                          <div>
                            <span className="font-medium">Price:</span> ${pkg.price}
                          </div>
                          <div>
                            <span className="font-medium">Participants:</span> {pkg.participants_per_booking}
                          </div>
                          <div>
                            <span className="font-medium">Availability:</span> {pkg.availability}
                            {pkg.availability === "limited" && ` (${pkg.quantity} available)`}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No packages added</p>
                )}
              </div>

              {/* Add-ons Summary */}
              <div className="rounded-lg border border-border p-6">
                <h3 className="mb-4 text-lg font-semibold">Add-ons ({addOns.length})</h3>
                {addOns.length > 0 ? (
                  <div className="space-y-4">
                    {addOns.map((addon, idx) => (
                      <div key={addon.id} className="rounded border border-border bg-muted/20 p-4 text-sm">
                        <p className="mb-2 font-medium">{addon.name || `Add-on ${idx + 1}`}</p>
                        {addon.description && <p className="mb-2 text-muted-foreground">{addon.description}</p>}
                        <div className="grid gap-2 md:grid-cols-2">
                          <div>
                            <span className="font-medium">Price:</span> ${addon.price}
                          </div>
                          <div>
                            <span className="font-medium">Type:</span>{" "}
                            {addon.price_type === "per_participant" ? "Per participant" : "Per booking"}
                          </div>
                          <div>
                            <span className="font-medium">Availability:</span> {addon.availability}
                            {addon.availability === "limited" && ` (${addon.quantity} available)`}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No add-ons added</p>
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
            className="w-full sm:w-auto"
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Previous
          </Button>

          {currentStep < 4 ? (
            <Button
              type="button"
              onClick={nextStep}
              disabled={!canProceedToNextStep()}
              className="w-full bg-[#a4b96a] hover:bg-[#93a55e] sm:w-auto"
            >
              Next
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button type="submit" disabled={loading} className="w-full bg-[#6b705c] hover:bg-[#5a5e4d] sm:w-auto">
              {loading ? "Creating Trip..." : "Publish Trip"}
            </Button>
          )}
        </div>
      </form>
    </div>
  )
}
