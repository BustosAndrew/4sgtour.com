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

type GolfCourse = {
  id: string
  course_name: string
  price_per_round: string
}

type MealOption = {
  breakfast_included_price: string
  breakfast_not_included_price: string
}

type TransportationOption = {
  private_car_price: string
  self_drive_price: string
}

const STEPS = [
  { id: 1, title: "Trip Basics", description: "Title, description, and images" },
  { id: 2, title: "Packages", description: "Room types and accommodation" },
  { id: 3, title: "Booking Options", description: "Courses, meals, and transportation" },
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
  
  const [golfCourses, setGolfCourses] = useState<GolfCourse[]>([])
  const [mealOptions, setMealOptions] = useState<MealOption>({
    breakfast_included_price: "0",
    breakfast_not_included_price: "0",
  })
  const [transportationOptions, setTransportationOptions] = useState<TransportationOption>({
    private_car_price: "0",
    self_drive_price: "0",
  })

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
          golfCourses: golfCourses.map((course) => ({
            course_name: course.course_name,
            price_per_round: Number(course.price_per_round),
          })),
          mealOptions: {
            breakfast_included_price: Number(mealOptions.breakfast_included_price),
            breakfast_not_included_price: Number(mealOptions.breakfast_not_included_price),
          },
          transportationOptions: {
            private_car_price: Number(transportationOptions.private_car_price),
            self_drive_price: Number(transportationOptions.self_drive_price),
          },
        }),
      })

      if (!response.ok) throw new Error("Failed to create trip")

      router.push("/admin")
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

  const addGolfCourse = () => {
    setGolfCourses([
      ...golfCourses,
      {
        id: crypto.randomUUID(),
        course_name: "",
        price_per_round: "0",
      },
    ])
  }

  const updateGolfCourse = (id: string, field: keyof GolfCourse, value: string) => {
    setGolfCourses(golfCourses.map((course) => (course.id === id ? { ...course, [field]: value } : course)))
  }

  const removeGolfCourse = (id: string) => {
    setGolfCourses(golfCourses.filter((course) => course.id !== id))
  }

  const canProceedToNextStep = () => {
    switch (currentStep) {
      case 1:
        return formData.title && formData.location && formData.continent && formData.price_regular
      case 2:
        return true
      case 3:
        return true
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
                <button
                  type="button"
                  onClick={() => setCurrentStep(step.id)}
                  className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-2 font-semibold transition-colors hover:opacity-80 ${
                    currentStep === step.id
                      ? "border-[#6b705c] bg-[#6b705c] text-white"
                      : currentStep > step.id
                        ? "border-[#a4b96a] bg-[#a4b96a] text-white"
                        : "border-muted-foreground/30 text-muted-foreground hover:border-muted-foreground/50"
                  }`}
                >
                  {step.id}
                </button>
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

        {/* Updated step 3 to reflect structured options instead of custom add-ons */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold">Booking Options</h2>
              <p className="text-sm text-muted-foreground">Configure golf courses, meals, and transportation options</p>
            </div>

            {/* Golf Courses Section */}
            <div className="space-y-4 rounded-lg border border-border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Golf Courses & Rounds</h3>
                  <p className="text-sm text-muted-foreground">Add available golf courses with pricing per round</p>
                </div>
                <Button type="button" onClick={addGolfCourse} size="sm" className="bg-[#a4b96a] hover:bg-[#93a55e]">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Course
                </Button>
              </div>

              {golfCourses.map((course, index) => (
                <div key={course.id} className="space-y-4 rounded-lg border border-border bg-muted/20 p-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Course {String.fromCharCode(65 + index)}</h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeGolfCourse(course.id)}
                      className="text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Course Name *</Label>
                      <Input
                        value={course.course_name}
                        onChange={(e) => updateGolfCourse(course.id, "course_name", e.target.value)}
                        placeholder="Course A"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Price per Round *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={course.price_per_round}
                        onChange={(e) => updateGolfCourse(course.id, "price_per_round", e.target.value)}
                        placeholder="10.00"
                        required
                      />
                    </div>
                  </div>
                </div>
              ))}

              {golfCourses.length === 0 && (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  No golf courses added yet. Click "Add Course" to create options.
                </div>
              )}
            </div>

            {/* Meals Section */}
            <div className="space-y-4 rounded-lg border border-border p-6">
              <div>
                <h3 className="text-lg font-semibold">Meals</h3>
                <p className="text-sm text-muted-foreground">Set pricing for breakfast options</p>
              </div>

              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Breakfast Included - Additional Cost</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={mealOptions.breakfast_included_price}
                      onChange={(e) =>
                        setMealOptions({ ...mealOptions, breakfast_included_price: e.target.value })
                      }
                      placeholder="0.00"
                    />
                    <p className="text-xs text-muted-foreground">Extra cost if breakfast is included (0 if free)</p>
                  </div>

                  <div className="space-y-2">
                    <Label>Breakfast Not Included - Cost</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={mealOptions.breakfast_not_included_price}
                      onChange={(e) =>
                        setMealOptions({ ...mealOptions, breakfast_not_included_price: e.target.value })
                      }
                      placeholder="0.00"
                    />
                    <p className="text-xs text-muted-foreground">Base cost when breakfast is not included</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Transportation Section */}
            <div className="space-y-4 rounded-lg border border-border p-6">
              <div>
                <h3 className="text-lg font-semibold">Transportation</h3>
                <p className="text-sm text-muted-foreground">Set pricing for transportation options</p>
              </div>

              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Private Car with Driver - Cost</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={transportationOptions.private_car_price}
                      onChange={(e) =>
                        setTransportationOptions({ ...transportationOptions, private_car_price: e.target.value })
                      }
                      placeholder="0.00"
                    />
                    <p className="text-xs text-muted-foreground">Cost for private car with driver service</p>
                  </div>

                  <div className="space-y-2">
                    <Label>Drive Yourself - Cost</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={transportationOptions.self_drive_price}
                      onChange={(e) =>
                        setTransportationOptions({ ...transportationOptions, self_drive_price: e.target.value })
                      }
                      placeholder="0.00"
                    />
                    <p className="text-xs text-muted-foreground">Cost for self-drive option (typically 0)</p>
                  </div>
                </div>
              </div>
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
                  <div>
                    <span className="font-medium">Regular Price:</span> ${formData.price_regular || "0.00"}
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

              <div className="rounded-lg border border-border p-6">
                <h3 className="mb-4 text-lg font-semibold">Golf Courses ({golfCourses.length})</h3>
                {golfCourses.length > 0 ? (
                  <div className="space-y-2">
                    {golfCourses.map((course, idx) => (
                      <div key={course.id} className="flex justify-between text-sm">
                        <span>{course.course_name || `Course ${String.fromCharCode(65 + idx)}`}</span>
                        <span className="font-medium">${course.price_per_round}/round</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No golf courses added</p>
                )}
              </div>

              <div className="rounded-lg border border-border p-6">
                <h3 className="mb-4 text-lg font-semibold">Meal Options</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Breakfast Included</span>
                    <span className="font-medium">+${mealOptions.breakfast_included_price}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Breakfast Not Included</span>
                    <span className="font-medium">${mealOptions.breakfast_not_included_price}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-border p-6">
                <h3 className="mb-4 text-lg font-semibold">Transportation Options</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Private Car with Driver</span>
                    <span className="font-medium">${transportationOptions.private_car_price}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Drive Yourself</span>
                    <span className="font-medium">${transportationOptions.self_drive_price}</span>
                  </div>
                </div>
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
