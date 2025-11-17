"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useRouter } from 'next/navigation'
import { Upload, X } from 'lucide-react'
import Image from "next/image"

interface EditTripFormProps {
  trip: {
    id: string
    title: string
    description: string | null
    continent: string | null
    courses_photo_url: string | null
    single_room_photo_url: string | null
    double_room_photo_url: string | null
  }
}

const CONTINENTS = ["Africa", "Asia", "Europe", "North America", "South America"]

export function EditTripForm({ trip }: EditTripFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
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
        }),
      })

      if (!response.ok) throw new Error("Failed to update trip")

      router.refresh()
      alert("Trip updated successfully")
    } catch (error) {
      console.error("Error updating trip:", error)
      alert("Failed to update trip")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Edit course</h2>
            <p className="text-sm text-muted-foreground">Update your course details here</p>
          </div>
          <Button type="submit" disabled={loading} className="bg-[#a4b96a] hover:bg-[#93a55e]">
            {loading ? "Saving..." : "Save"}
          </Button>
        </div>

        {/* Trip Name */}
        <div className="space-y-2">
          <Label htmlFor="title" className="text-base">
            Title of place
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
          <Label className="text-base">Choose Continent</Label>
          <div className="flex flex-wrap gap-2">
            {CONTINENTS.map((continent) => (
              <button
                key={continent}
                type="button"
                onClick={() => setFormData({ ...formData, continent })}
                className={`rounded-full border px-6 py-2 text-sm transition-colors ${
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
      </form>
    </div>
  )
}
