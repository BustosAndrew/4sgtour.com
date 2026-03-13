"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { Upload, X, ArrowLeft, Trophy } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

type Tournament = {
  id: string
  slug: string
  name: string
  display_name: string | null
  logo: string | null
  hero_image: string | null
}

export function EditTournamentForm({ tournament }: { tournament: Tournament }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  // Tournament names are fixed (Masters, Ryder Cup, The Open, US Open)
  // Only images can be edited

  const [logoUrl, setLogoUrl] = useState(tournament.logo || "")
  const [heroImageUrl, setHeroImageUrl] = useState(tournament.hero_image || "")
  const [uploadingPhoto, setUploadingPhoto] = useState<string | null>(null)

  const handlePhotoUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    photoType: "logo" | "hero"
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
        throw new Error("Upload failed")
      }

      const { url } = await response.json()
      if (photoType === "logo") {
        setLogoUrl(url)
      } else {
        setHeroImageUrl(url)
      }
    } catch (error) {
      console.error("Error uploading photo:", error)
      alert("Failed to upload photo")
    } finally {
      setUploadingPhoto(null)
    }
  }

  const handleRemovePhoto = (photoType: "logo" | "hero") => {
    if (photoType === "logo") {
      setLogoUrl("")
    } else {
      setHeroImageUrl("")
    }
  }

  const validateForm = (): { valid: boolean; errors: string[] } => {
    // No validation needed - only images can be edited
    return { valid: true, errors: [] }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const { valid, errors } = validateForm()
    if (!valid) {
      setValidationErrors(errors)
      return
    }

    setLoading(true)
    setValidationErrors([])

    try {
      const response = await fetch(`/api/admin/tournaments/${tournament.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          // Only images can be updated - name is fixed
          logo: logoUrl || null,
          hero_image: heroImageUrl || null,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to update tournament")
      }

      router.push("/admin?tab=tournaments")
      router.refresh()
    } catch (error) {
      console.error("Error updating tournament:", error)
      setValidationErrors([
        error instanceof Error ? error.message : "Failed to update tournament",
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
              Edit {tournament.name} Images
            </h1>
            <p className="text-xs text-gray-600 sm:text-sm">
              Update tournament logo and hero image
            </p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-2xl p-4 sm:p-8">
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

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Tournament Images</h2>
            <p className="mb-4 text-sm text-gray-500">
              Tournament name: <span className="font-semibold text-gray-900">{tournament.name}</span>
            </p>

            <div className="space-y-4">
              <div>
                <Label>Tournament Logo</Label>
                <p className="mb-2 text-xs text-gray-500">
                  Square image recommended (e.g., 200x200px)
                </p>
                {logoUrl ? (
                  <div className="relative inline-block">
                    <div className="relative h-24 w-24 overflow-hidden rounded-lg border bg-white">
                      <Image
                        src={logoUrl}
                        alt="Tournament logo"
                        fill
                        className="object-contain p-2"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto("logo")}
                      className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <label className="flex h-24 w-24 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-gray-300 hover:border-gray-400">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handlePhotoUpload(e, "logo")}
                      disabled={uploadingPhoto === "logo"}
                    />
                    {uploadingPhoto === "logo" ? (
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-primary" />
                    ) : (
                      <div className="text-center">
                        <Trophy className="mx-auto h-6 w-6 text-gray-400" />
                        <span className="mt-1 block text-xs text-gray-500">
                          Upload
                        </span>
                      </div>
                    )}
                  </label>
                )}
              </div>

              <div>
                <Label>Hero Image</Label>
                <p className="mb-2 text-xs text-gray-500">
                  Wide banner image for tournament page (recommended 1920x600px)
                </p>
                {heroImageUrl ? (
                  <div className="relative">
                    <div className="relative h-40 w-full overflow-hidden rounded-lg border">
                      <Image
                        src={heroImageUrl}
                        alt="Hero image"
                        fill
                        className="object-cover"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto("hero")}
                      className="absolute right-2 top-2 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex h-40 w-full cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-gray-300 hover:border-gray-400">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handlePhotoUpload(e, "hero")}
                      disabled={uploadingPhoto === "hero"}
                    />
                    {uploadingPhoto === "hero" ? (
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-primary" />
                    ) : (
                      <div className="text-center">
                        <Upload className="mx-auto h-8 w-8 text-gray-400" />
                        <span className="mt-2 block text-sm text-gray-500">
                          Click to upload hero image
                        </span>
                      </div>
                    )}
                  </label>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Link href="/admin?tab=tournaments" className="flex-1">
              <Button type="button" variant="outline" className="w-full">
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              className="flex-1 bg-[#274C77] hover:bg-[#274C77]/90"
              disabled={loading}
            >
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
