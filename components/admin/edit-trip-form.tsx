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
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface EditTripFormProps {
  trip: {
    id: string
    title: string
    description: string | null
    continent: string | null
    courses_photo_url: string | null
    single_room_photo_url: string | null
    double_room_photo_url: string | null
    packages?: any[]
    add_ons?: any[]
  }
}

const CONTINENTS = ["Africa", "Asia", "Europe", "North America", "South America"]

const STEPS = [
  { id: 1, title: "Trip Basics", description: "Title, description, and images" },
  { id: 2, title: "Packages", description: "Room types and accommodation" },
  { id: 3, title: "Add-ons", description: "Optional extras and services" },
  { id: 4, title: "Review & Submit", description: "Review and save changes" },
]

export function EditTripForm({ trip }: EditTripFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  
  const [formData, setFormData] = useState({
    title: trip.title || "",
    description: trip.description || "",
    continent: trip.continent || "",
  })
  const [photos, setPhotos] = useState({
    courses: trip.courses_photo_url || "",
    singleRoom: trip.single_room_photo_url || "",
    doubleRoom: trip.double_room_photo_url || "",
  })
  const [uploadingPhoto, setUploadingPhoto] = useState<string | null>(null)

  const [packages, setPackages] = useState(trip.packages || [])
  const [addOns, setAddOns] = useState(trip.add_ons || [])

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

  const handleRemovePhoto = (photoType: "courses" | "singleRoom" | "doubleRoom") => {
    setPhotos((prev) => ({ ...prev, [photoType]: "" }))
  }

  const handleAddPackage = () => {
    setPackages([...packages, { 
      id: `new-${Date.now()}`, 
      name: '', 
      description: '', 
      price: 0,
      availability: 'unlimited',
      quantity: null,
      participants_per_booking: 1
    }])
  }

  const handleRemovePackage = (index: number) => {
    setPackages(packages.filter((_, i) => i !== index))
  }

  const handlePackageChange = (index: number, field: string, value: any) => {
    const updated = [...packages]
    updated[index] = { ...updated[index], [field]: value }
    setPackages(updated)
  }

  const handleAddAddOn = () => {
    setAddOns([...addOns, { 
      id: `new-${Date.now()}`, 
      name: '', 
      description: '', 
      price: 0,
      price_type: 'per_participant',
      availability: 'unlimited',
      quantity: null
    }])
  }

  const handleRemoveAddOn = (index: number) => {
    setAddOns(addOns.filter((_, i) => i !== index))
  }

  const handleAddOnChange = (index: number, field: string, value: any) => {
    const updated = [...addOns]
    updated[index] = { ...updated[index], [field]: value }
    setAddOns(updated)
  }

  const canProceedToNextStep = () => {
    switch (currentStep) {
      case 1:
        return formData.title && formData.continent
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch(`/api/admin/trips/${trip.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          continent: formData.continent,
          courses_photo_url: photos.courses || null,
          single_room_photo_url: photos.singleRoom || null,
          double_room_photo_url: photos.doubleRoom || null,
          packages,
          add_ons: addOns,
        }),
      })

      if (!response.ok) throw new Error("Failed to update trip")

      router.refresh()
      router.push('/admin') // Updated code here
      alert("Trip updated successfully")
    } catch (error) {
      console.error("Error updating trip:", error)
      alert("Failed to update trip")
    } finally {
      setLoading(false)
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
      router.push('/admin') // Updated code here
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
              Are you sure you want to delete this trip? This action cannot be undone. All packages, add-ons, and bookings
              associated with this trip will also be deleted.
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
              <p className="text-sm text-muted-foreground">Update the basic information about your golf trip</p>
            </div>

            {/* Trip Name */}
            <div className="space-y-2">
              <Label htmlFor="title" className="text-base">
                Title of place *
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Title of place"
                required
                className="h-12"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-base">
                Description
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Add a description..."
                rows={6}
                className="resize-none"
              />
            </div>

            {/* Choose Continent */}
            <div className="space-y-3">
              <Label className="text-base">Choose Continent *</Label>
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

            {/* Upload Photos for Courses */}
            <div className="space-y-3">
              <Label className="text-base">Upload Photos for Courses</Label>
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

            {/* Upload Photos for Single Occupancy Room */}
            <div className="space-y-3">
              <Label className="text-base">Upload Photos for Single Occupancy Room</Label>
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

            {/* Upload Photos for Double Occupancy Room */}
            <div className="space-y-3">
              <Label className="text-base">Upload Photos for Double Occupancy Room</Label>
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
              <p className="text-sm text-muted-foreground">Manage room types and accommodation options</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base">Packages</Label>
                <Button type="button" onClick={handleAddPackage} variant="outline" size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Package
                </Button>
              </div>
              {packages.map((pkg, index) => (
                <Card key={pkg.id} className="p-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Package {index + 1}</h4>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemovePackage(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <Label>Package Name *</Label>
                        <Input
                          value={pkg.name}
                          onChange={(e) => handlePackageChange(index, 'name', e.target.value)}
                          placeholder="e.g., Single Room"
                          required
                        />
                      </div>
                      <div>
                        <Label>Price (USD) *</Label>
                        <Input
                          type="number"
                          value={pkg.price}
                          onChange={(e) => handlePackageChange(index, 'price', Number(e.target.value))}
                          placeholder="0"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Textarea
                        value={pkg.description || ''}
                        onChange={(e) => handlePackageChange(index, 'description', e.target.value)}
                        placeholder="Package description (optional)"
                        rows={2}
                      />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div>
                        <Label>Availability</Label>
                        <Select
                          value={pkg.availability}
                          onValueChange={(value) => handlePackageChange(index, 'availability', value)}
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
                      {pkg.availability === 'limited' && (
                        <div>
                          <Label>Quantity</Label>
                          <Input
                            type="number"
                            value={pkg.quantity || ''}
                            onChange={(e) => handlePackageChange(index, 'quantity', Number(e.target.value))}
                            placeholder="0"
                          />
                        </div>
                      )}
                      <div>
                        <Label>Participants Per Booking</Label>
                        <Input
                          type="number"
                          value={pkg.participants_per_booking}
                          onChange={(e) => handlePackageChange(index, 'participants_per_booking', Number(e.target.value))}
                          placeholder="1"
                          min="1"
                        />
                      </div>
                    </div>
                  </div>
                </Card>
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
              <p className="text-sm text-muted-foreground">Manage optional extras and services</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base">Add-ons</Label>
                <Button type="button" onClick={handleAddAddOn} variant="outline" size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Add-on
                </Button>
              </div>
              {addOns.map((addOn, index) => (
                <Card key={addOn.id} className="p-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Add-on {index + 1}</h4>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveAddOn(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <Label>Add-on Name *</Label>
                        <Input
                          value={addOn.name}
                          onChange={(e) => handleAddOnChange(index, 'name', e.target.value)}
                          placeholder="e.g., Golf Course A"
                          required
                        />
                      </div>
                      <div>
                        <Label>Price (USD) *</Label>
                        <Input
                          type="number"
                          value={addOn.price}
                          onChange={(e) => handleAddOnChange(index, 'price', Number(e.target.value))}
                          placeholder="0"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Textarea
                        value={addOn.description || ''}
                        onChange={(e) => handleAddOnChange(index, 'description', e.target.value)}
                        placeholder="Add-on description (optional)"
                        rows={2}
                      />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div>
                        <Label>Price Type</Label>
                        <Select
                          value={addOn.price_type}
                          onValueChange={(value) => handleAddOnChange(index, 'price_type', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="per_participant">Per Participant</SelectItem>
                            <SelectItem value="per_booking">Per Booking</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Availability</Label>
                        <Select
                          value={addOn.availability}
                          onValueChange={(value) => handleAddOnChange(index, 'availability', value)}
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
                      {addOn.availability === 'limited' && (
                        <div>
                          <Label>Quantity</Label>
                          <Input
                            type="number"
                            value={addOn.quantity || ''}
                            onChange={(e) => handleAddOnChange(index, 'quantity', Number(e.target.value))}
                            placeholder="0"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
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
              <p className="text-sm text-muted-foreground">Review all changes before saving</p>
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
                            {pkg.availability === "limited" && pkg.quantity && ` (${pkg.quantity} available)`}
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
                            {addon.availability === "limited" && addon.quantity && ` (${addon.quantity} available)`}
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
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
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
              onClick={nextStep}
              disabled={!canProceedToNextStep()}
              className="w-full bg-[#a4b96a] hover:bg-[#93a55e] sm:w-auto"
            >
              Next
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button type="submit" disabled={loading} className="w-full bg-[#6b705c] hover:bg-[#5a5e4d] sm:w-auto">
              {loading ? "Saving Changes..." : "Save Changes"}
            </Button>
          )}
        </div>
      </form>
    </div>
  )
}
