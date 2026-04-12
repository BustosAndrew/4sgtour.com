'use client'

import type React from 'react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ChevronRight,
  ChevronLeft,
  CalendarIcon,
  Check,
  Package,
  User,
  CreditCard,
  CheckCircle,
  Copy,
  ExternalLink,
  Upload,
  X,
  Plus,
  Trash2,
  GripVertical,
  Languages,
  MapPin,
  Settings,
} from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import Image from 'next/image'

const CONTINENTS = ['World', 'Asia', 'Europe', 'North America', 'Latin America']

type PackageType = {
  id: string
  name: 'Premium' | 'Upgrade'
  description: string
  price: string
  price_per_extra_night: string
  availability: string
  quantity: string
  participants_per_booking: string
}

type GolfCourse = {
  id: string
  course_name: string
  max_rounds: string
  num_holes: string
}

type MealOption = {
  id: string
  name: string
  description: string
  is_included: boolean
}

type TransportationOption = {
  id: string
  name: string
  description: string
  is_included: boolean
}

type ServiceOption = {
  id: string
  name: string
  description: string
  is_included: boolean
}

const STEPS = [
  {
    id: 1,
    title: 'Trip Basics',
    description: 'Title, description, and images',
    icon: MapPin,
  },
  {
    id: 2,
    title: 'Packages',
    description: 'Room types and accommodation',
    icon: Package,
  },
  {
    id: 3,
    title: 'Booking Options',
    description: 'Courses, meals, and transportation',
    icon: Settings,
  },
  {
    id: 4,
    title: 'Customer Info',
    description: 'Contact details & dates',
    icon: User,
  },
  {
    id: 5,
    title: 'Payment & Review',
    description: 'Deposit and send payment link',
    icon: CreditCard,
  },
]

interface CreateCustomBookingFormProps {
  onCancel: () => void
  onSuccess: () => void
}

export function CreateCustomBookingForm({
  onCancel,
  onSuccess,
}: CreateCustomBookingFormProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  // Language state
  const [activeLanguage, setActiveLanguage] = useState<'en' | 'ko'>('en')

  // Step 1: Trip Basics
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    overview_content: '',
    refund_policy: '',
    location: '',
    continent: '',
    max_guests: '20',
    max_days: '',
    min_days_advance: '0',
    min_days: '1',
  })

  const [koreanData, setKoreanData] = useState({
    title_ko: '',
    description_ko: '',
    overview_content_ko: '',
    refund_policy_ko: '',
    location_ko: '',
  })

  const [highlights, setHighlights] = useState<string[]>([])
  const [highlightsKo, setHighlightsKo] = useState<string[]>([])
  const [coursePhotos, setCoursePhotos] = useState<string[]>([])
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [photos, setPhotos] = useState({ room: '' })
  const [uploadingPhoto, setUploadingPhoto] = useState<string | null>(null)

  // Step 2: Packages
  const [packages, setPackages] = useState<PackageType[]>([
    {
      id: 'premium',
      name: 'Premium',
      description: '',
      price: '',
      price_per_extra_night: '',
      availability: 'unlimited',
      quantity: '',
      participants_per_booking: '1',
    },
  ])
  const [showFromPrice, setShowFromPrice] = useState(false)
  const [hasUpgradePackage, setHasUpgradePackage] = useState(false)

  // Step 3: Booking Options
  const [golfCourses, setGolfCourses] = useState<GolfCourse[]>([])
  const [mealOptions, setMealOptions] = useState<MealOption[]>([])
  const [transportationOptions, setTransportationOptions] = useState<
    TransportationOption[]
  >([])
  const [serviceOptions, setServiceOptions] = useState<ServiceOption[]>([
    { id: 'caddy', name: 'Caddy', description: '', is_included: false },
    { id: 'golf-cart', name: 'Golf Cart', description: '', is_included: false },
  ])

  // Step 4: Customer Info & Dates
  const [customerName, setCustomerName] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [startDate, setStartDate] = useState<Date | undefined>(undefined)
  const [endDate, setEndDate] = useState<Date | undefined>(undefined)

  // Step 5: Payment
  const [depositPercentage, setDepositPercentage] = useState(30)
  const [remainderDueDate, setRemainderDueDate] = useState<Date | undefined>(
    undefined,
  )

  // Success state
  const [showSuccess, setShowSuccess] = useState(false)
  const [packagePageUrl, setPackagePageUrl] = useState<string | null>(null)
  const [copiedUrl, setCopiedUrl] = useState(false)

  const premiumPkg = packages.find((p) => p.name === 'Premium')
  const totalPrice = premiumPkg ? Number(premiumPkg.price) || 0 : 0
  const depositAmount = (totalPrice * depositPercentage) / 100
  const remainderAmount = totalPrice - depositAmount

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedUrl(true)
      setTimeout(() => setCopiedUrl(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  // Photo upload
  const handlePhotoUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    photoType: 'courses' | 'room',
  ) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingPhoto(photoType)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const response = await fetch('/api/upload', { method: 'POST', body: fd })
      if (!response.ok) {
        const raw = await response.text().catch(() => '')
        let message = 'Upload failed'
        try {
          const parsed = raw ? JSON.parse(raw) : {}
          message = parsed?.error || message
        } catch {
          const snippet = raw.replace(/\s+/g, ' ').slice(0, 200)
          message = `Upload failed (${response.status})${snippet ? `: ${snippet}` : ''}`
        }
        throw new Error(message)
      }
      const { url } = await response.json()
      if (photoType === 'courses') {
        setCoursePhotos((prev) => (prev.length >= 5 ? prev : [...prev, url]))
      } else {
        setPhotos((prev) => ({ ...prev, [photoType]: url }))
      }
    } catch (error) {
      console.error('Error uploading photo:', error)
      alert('Failed to upload photo')
    } finally {
      setUploadingPhoto(null)
    }
  }

  const handleRemovePhoto = (photoType: 'courses' | 'room') => {
    if (photoType === 'courses') {
      setCoursePhotos([])
    } else {
      setPhotos((prev) => ({ ...prev, [photoType]: '' }))
    }
  }

  // Package helpers
  const addUpgradePackage = () => {
    if (!hasUpgradePackage) {
      setPackages([
        ...packages,
        {
          id: 'upgrade',
          name: 'Upgrade',
          description: '',
          price: '',
          price_per_extra_night: '',
          availability: 'unlimited',
          quantity: '',
          participants_per_booking: '1',
        },
      ])
      setHasUpgradePackage(true)
    }
  }

  const updatePackage = (
    id: string,
    field: keyof PackageType,
    value: string,
  ) => {
    setPackages(
      packages.map((pkg) => (pkg.id === id ? { ...pkg, [field]: value } : pkg)),
    )
  }

  const removeUpgradePackage = () => {
    setPackages(packages.filter((pkg) => pkg.name !== 'Upgrade'))
    setHasUpgradePackage(false)
  }

  // Golf course helpers
  const addGolfCourse = () => {
    setGolfCourses([
      ...golfCourses,
      {
        id: `course-${Date.now()}`,
        course_name: '',
        max_rounds: '5',
        num_holes: '18',
      },
    ])
  }

  const updateGolfCourse = (
    id: string,
    field: keyof GolfCourse,
    value: string,
  ) => {
    setGolfCourses(
      golfCourses.map((c) => (c.id === id ? { ...c, [field]: value } : c)),
    )
  }

  const removeGolfCourse = (id: string) => {
    setGolfCourses(golfCourses.filter((c) => c.id !== id))
  }

  // Meal option helpers
  const addMealOption = () => {
    setMealOptions([
      ...mealOptions,
      {
        id: crypto.randomUUID(),
        name: '',
        description: '',
        is_included: false,
      },
    ])
  }

  const updateMealOption = (
    id: string,
    field: keyof MealOption,
    value: string | boolean,
  ) => {
    setMealOptions(
      mealOptions.map((m) => (m.id === id ? { ...m, [field]: value } : m)),
    )
  }

  const removeMealOption = (id: string) => {
    setMealOptions(mealOptions.filter((m) => m.id !== id))
  }

  // Transportation option helpers
  const addTransportationOption = () => {
    setTransportationOptions([
      ...transportationOptions,
      {
        id: crypto.randomUUID(),
        name: '',
        description: '',
        is_included: false,
      },
    ])
  }

  const updateTransportationOption = (
    id: string,
    field: keyof TransportationOption,
    value: string | boolean,
  ) => {
    setTransportationOptions(
      transportationOptions.map((t) =>
        t.id === id ? { ...t, [field]: value } : t,
      ),
    )
  }

  const removeTransportationOption = (id: string) => {
    setTransportationOptions(transportationOptions.filter((t) => t.id !== id))
  }

  const handleServiceOptionToggle = (name: string, value: boolean) => {
    setServiceOptions((prev) =>
      prev.map((opt) =>
        opt.name === name ? { ...opt, is_included: value } : opt,
      ),
    )
  }

  // Highlight helpers
  const addHighlight = () => setHighlights([...highlights, ''])
  const updateHighlight = (index: number, value: string) => {
    const updated = [...highlights]
    updated[index] = value
    setHighlights(updated)
  }
  const removeHighlight = (index: number) => {
    setHighlights(highlights.filter((_, i) => i !== index))
    if (highlightsKo.length > index) {
      setHighlightsKo(highlightsKo.filter((_, i) => i !== index))
    }
  }

  const validateCurrentStep = (): { valid: boolean; errors: string[] } => {
    const errors: string[] = []

    switch (currentStep) {
      case 1:
        if (!formData.title.trim()) errors.push('Trip title is required')
        if (!formData.location.trim()) errors.push('Location is required')
        if (!formData.continent) errors.push('Continent selection is required')
        if (!formData.max_days || Number(formData.max_days) <= 0)
          errors.push('Maximum trip duration must be a positive number')
        if (formData.min_days_advance && Number(formData.min_days_advance) < 0)
          errors.push('Minimum advance booking period cannot be negative')
        if (!formData.min_days || Number(formData.min_days) <= 0)
          errors.push('Minimum trip duration must be a positive number')
        break
      case 2: {
        const premium = packages.find((p) => p.name === 'Premium')
        if (!premium) {
          errors.push('Premium package is required')
        } else {
          if (!premium.price || Number(premium.price) <= 0)
            errors.push('Premium package price is required')
          if (
            !premium.participants_per_booking ||
            Number(premium.participants_per_booking) <= 0
          )
            errors.push(
              'Premium package must have valid participants per booking',
            )
          if (
            premium.availability === 'limited' &&
            (!premium.quantity || Number(premium.quantity) <= 0)
          )
            errors.push(
              'Premium package must have valid quantity for limited availability',
            )
        }
        const upgrade = packages.find((p) => p.name === 'Upgrade')
        if (upgrade) {
          if (!upgrade.price || Number(upgrade.price) <= 0)
            errors.push('Upgrade package price is required')
          if (
            !upgrade.participants_per_booking ||
            Number(upgrade.participants_per_booking) <= 0
          )
            errors.push(
              'Upgrade package must have valid participants per booking',
            )
          if (
            upgrade.availability === 'limited' &&
            (!upgrade.quantity || Number(upgrade.quantity) <= 0)
          )
            errors.push(
              'Upgrade package must have valid quantity for limited availability',
            )
        }
        break
      }
      case 3:
        golfCourses.forEach((course, idx) => {
          if (!course.course_name.trim())
            errors.push(`Golf course ${idx + 1} name is required`)
          if (!course.max_rounds || Number(course.max_rounds) < 0)
            errors.push(`Golf course ${idx + 1} must have valid max rounds`)
        })
        mealOptions.forEach((meal, idx) => {
          if (!meal.name.trim())
            errors.push(`Meal option ${idx + 1} name is required`)
        })
        transportationOptions.forEach((transport, idx) => {
          if (!transport.name.trim())
            errors.push(`Transportation option ${idx + 1} name is required`)
        })
        break
      case 4:
        if (!customerName.trim()) errors.push('Customer name is required')
        if (!customerEmail.trim()) errors.push('Customer email is required')
        if (!customerPhone.trim()) errors.push('Customer phone is required')
        if (customerEmail && !customerEmail.includes('@'))
          errors.push('Please enter a valid email')
        if (!startDate) errors.push('Start date is required')
        if (!endDate) errors.push('End date is required')
        if (startDate && endDate && startDate > endDate)
          errors.push('End date must be after start date')
        break
      case 5:
        if (depositPercentage === null)
          errors.push('Deposit percentage is required - select a payment option')
        if (depositPercentage !== null && depositPercentage < 100 && !remainderDueDate)
          errors.push(
            'Remainder due date is required when not paying full price',
          )
        break
    }

    return { valid: errors.length === 0, errors }
  }

  const canProceedToNextStep = (): boolean => {
    switch (currentStep) {
      case 1:
        return !!(
          formData.title &&
          formData.location &&
          formData.continent &&
          formData.max_days &&
          Number(formData.max_days) > 0 &&
          formData.min_days &&
          Number(formData.min_days) > 0 &&
          (!formData.min_days_advance || Number(formData.min_days_advance) >= 0)
        )
      case 2: {
        const p = packages.find((p) => p.name === 'Premium')
        return !!(p?.price && Number(p.price) > 0)
      }
      case 3:
        return true
      case 4:
        return !!(
          customerName.trim() &&
          customerEmail.trim() &&
          customerPhone.trim() &&
          startDate &&
          endDate
        )
      case 5:
        return depositPercentage !== null && (depositPercentage === 100 || !!remainderDueDate)
      default:
        return true
    }
  }

  const nextStep = () => {
    const validation = validateCurrentStep()
    if (!validation.valid) {
      setValidationErrors(validation.errors)
      return
    }
    setValidationErrors([])
    if (currentStep < 5) setCurrentStep(currentStep + 1)
  }

  const prevStep = () => {
    setValidationErrors([])
    if (currentStep > 1) setCurrentStep(currentStep - 1)
  }

  const handleSubmit = async () => {
    const validation = validateCurrentStep()
    if (!validation.valid) {
      setValidationErrors(validation.errors)
      return
    }

    setLoading(true)
    setValidationErrors([])

    try {
      const response = await fetch('/api/admin/custom-booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Trip basics
          ...formData,
          ...(koreanData.title_ko?.trim() && { title_ko: koreanData.title_ko }),
          ...(koreanData.description_ko?.trim() && {
            description_ko: koreanData.description_ko,
          }),
          ...(koreanData.overview_content_ko?.trim() && {
            overview_content_ko: koreanData.overview_content_ko,
          }),
          ...(koreanData.refund_policy_ko?.trim() && {
            refund_policy_ko: koreanData.refund_policy_ko,
          }),
          ...(koreanData.location_ko?.trim() && {
            location_ko: koreanData.location_ko,
          }),
          ...(highlightsKo.some((h) => h.trim()) && {
            highlights_ko: highlightsKo.filter((h) => h.trim() !== ''),
          }),
          max_guests: Number(formData.max_guests),
          max_days: formData.max_days ? Number(formData.max_days) : null,
          min_days_advance: formData.min_days_advance
            ? Number(formData.min_days_advance)
            : 0,
          min_days: Number(formData.min_days),
          courses_photo_url: coursePhotos[0] || null,
          course_images: coursePhotos,
          room_photo_url: photos.room || null,
          show_from_price: showFromPrice,
          highlights: highlights.filter((h) => h.trim() !== ''),
          packages: packages.map((pkg) => ({
            name: pkg.name,
            description: pkg.description,
            price: Number(pkg.price),
            price_per_extra_night: pkg.price_per_extra_night
              ? Number(pkg.price_per_extra_night)
              : null,
            availability: pkg.availability,
            quantity: pkg.quantity ? Number(pkg.quantity) : null,
            participants_per_booking: Number(pkg.participants_per_booking),
          })),
          golfCourses: golfCourses.map((course) => ({
            course_name: course.course_name,
            max_rounds: Number(course.max_rounds),
            num_holes: Number(course.num_holes) || 18,
          })),
          mealOptions: mealOptions.map((meal) => ({
            name: meal.name,
            description: meal.description,
            is_included: meal.is_included,
          })),
          transportationOptions: transportationOptions.map((transport) => ({
            name: transport.name,
            description: transport.description,
            is_included: transport.is_included,
          })),
          serviceOptions: serviceOptions.map((service) => ({
            name: service.name,
            description: service.description,
            is_included: service.is_included,
          })),
          // Customer info
          customerName,
          customerEmail,
          customerPhone,
          startDate: startDate?.toISOString(),
          endDate: endDate?.toISOString(),
          // Payment
          depositPercentage,
          remainderDueDate: remainderDueDate?.toISOString(),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to create custom booking')
      }

      const data = await response.json()
      setPackagePageUrl(data.paymentLink)
      setShowSuccess(true)
    } catch (error) {
      console.error('[v0] Error creating custom booking:', error)
      setValidationErrors([
        error instanceof Error ? error.message : 'Failed to create booking',
      ])
    } finally {
      setLoading(false)
    }
  }

  // Success Dialog
  if (showSuccess) {
    return (
      <div className="w-full">
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle className="h-10 w-10 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">
            Custom Booking Created!
          </h2>
          <p className="mt-2 text-muted-foreground">
            The payment link has been sent to {customerName} via SMS.
          </p>

          {packagePageUrl && (
            <div className="mt-6 w-full max-w-md">
              <Label className="text-left block mb-2">Payment Link</Label>
              <p className="text-xs text-muted-foreground mb-2 text-left">
                This is the Stripe checkout link that was sent via SMS. You can
                also share it manually.
              </p>
              <div className="flex items-center gap-2">
                <Input
                  value={packagePageUrl}
                  readOnly
                  className="flex-1 text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(packagePageUrl)}
                  className="shrink-0"
                >
                  {copiedUrl ? (
                    <Check className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => window.open(packagePageUrl, '_blank')}
                  className="shrink-0"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          <div className="mt-8 flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowSuccess(false)
                onSuccess()
              }}
            >
              Back to Inquiries
            </Button>
            <Button
              type="button"
              onClick={() => {
                setShowSuccess(false)
                setPackagePageUrl(null)
                setCurrentStep(1)
                setFormData({
                  title: '',
                  description: '',
                  overview_content: '',
                  refund_policy: '',
                  location: '',
                  continent: '',
                  max_guests: '20',
                  max_days: '',
                  min_days_advance: '0',
                  min_days: '1',
                })
                setKoreanData({
                  title_ko: '',
                  description_ko: '',
                  overview_content_ko: '',
                  refund_policy_ko: '',
                  location_ko: '',
                })
                setHighlights([])
                setHighlightsKo([])
                setCoursePhotos([])
                setPhotos({ room: '' })
                setPackages([
                  {
                    id: 'premium',
                    name: 'Premium',
                    description: '',
                    price: '',
                    price_per_extra_night: '',
                    availability: 'unlimited',
                    quantity: '',
                    participants_per_booking: '1',
                  },
                ])
                setShowFromPrice(false)
                setHasUpgradePackage(false)
                setGolfCourses([])
                setMealOptions([])
                setTransportationOptions([])
                setServiceOptions([
                  {
                    id: 'caddy',
                    name: 'Caddy',
                    description: '',
                    is_included: false,
                  },
                  {
                    id: 'golf-cart',
                    name: 'Golf Cart',
                    description: '',
                    is_included: false,
                  },
                ])
                setCustomerName('')
                setCustomerEmail('')
                setCustomerPhone('')
                setStartDate(undefined)
                setEndDate(undefined)
                setDepositPercentage(30)
                setRemainderDueDate(undefined)
              }}
              className="bg-primary hover:bg-primary/90"
            >
              Create Another Booking
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      {/* Step Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {STEPS.map((step, idx) => {
            const StepIcon = step.icon
            const isActive = currentStep === step.id
            const isCompleted = currentStep > step.id

            return (
              <div key={step.id} className="flex flex-1 items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors',
                      isActive
                        ? 'border-primary bg-primary text-primary-foreground'
                        : isCompleted
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border bg-background text-muted-foreground',
                    )}
                  >
                    {isCompleted ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <StepIcon className="h-5 w-5" />
                    )}
                  </div>
                  <div className="mt-2 text-center">
                    <p
                      className={cn(
                        'text-sm font-medium',
                        isActive || isCompleted
                          ? 'text-foreground'
                          : 'text-muted-foreground',
                      )}
                    >
                      {step.title}
                    </p>
                    <p className="hidden text-xs text-muted-foreground sm:block">
                      {step.description}
                    </p>
                  </div>
                </div>
                {idx < STEPS.length - 1 && (
                  <div
                    className={cn(
                      'mx-2 h-0.5 flex-1',
                      currentStep > step.id ? 'bg-primary' : 'bg-border',
                    )}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="mb-6 rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <p className="mb-2 font-medium text-destructive">
            Please fix the following errors:
          </p>
          <ul className="list-inside list-disc space-y-1 text-sm text-destructive">
            {validationErrors.map((error, idx) => (
              <li key={idx}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Step Content */}
      <div className="min-h-[400px]">
        {/* ========== STEP 1: Trip Basics ========== */}
        {currentStep === 1 && (
          <div className="space-y-4 sm:space-y-6">
            <div>
              <h2 className="text-xl font-semibold sm:text-2xl">Trip Basics</h2>
              <p className="text-xs text-muted-foreground sm:text-sm">
                Enter the basic information about the custom golf trip
              </p>
            </div>

            {/* Language Tabs */}
            <div className="flex items-center gap-3">
              <Languages className="h-5 w-5 text-muted-foreground" />
              <Tabs
                value={activeLanguage}
                onValueChange={(v) => setActiveLanguage(v as 'en' | 'ko')}
              >
                <TabsList className="grid w-[200px] grid-cols-2">
                  <TabsTrigger value="en" className="text-sm">
                    English
                  </TabsTrigger>
                  <TabsTrigger value="ko" className="text-sm">
                    Korean
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              <p className="text-xs text-muted-foreground">
                {activeLanguage === 'en'
                  ? 'Editing English content'
                  : 'Editing Korean translation'}
              </p>
            </div>

            <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-base text-foreground">
                  Trip Title *{' '}
                  {activeLanguage === 'ko' && (
                    <span className="text-xs text-muted-foreground">
                      (Korean)
                    </span>
                  )}
                </Label>
                <Input
                  id="title"
                  value={
                    activeLanguage === 'en'
                      ? formData.title
                      : koreanData.title_ko
                  }
                  onChange={(e) =>
                    activeLanguage === 'en'
                      ? setFormData({ ...formData, title: e.target.value })
                      : setKoreanData({
                          ...koreanData,
                          title_ko: e.target.value,
                        })
                  }
                  placeholder={
                    activeLanguage === 'en'
                      ? 'St. Andrews Golf Experience'
                      : '세인트 앤드루스 골프 체험'
                  }
                  required={activeLanguage === 'en'}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location" className="text-base text-foreground">
                  Location *{' '}
                  {activeLanguage === 'ko' && (
                    <span className="text-xs text-muted-foreground">
                      (Korean)
                    </span>
                  )}
                </Label>
                <Input
                  id="location"
                  value={
                    activeLanguage === 'en'
                      ? formData.location
                      : koreanData.location_ko
                  }
                  onChange={(e) =>
                    activeLanguage === 'en'
                      ? setFormData({ ...formData, location: e.target.value })
                      : setKoreanData({
                          ...koreanData,
                          location_ko: e.target.value,
                        })
                  }
                  placeholder={
                    activeLanguage === 'en'
                      ? 'St. Andrews, Scotland'
                      : '스코틀랜드, 세인트 앤드루스'
                  }
                  required={activeLanguage === 'en'}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="description"
                className="text-base text-foreground"
              >
                Trip Overview{' '}
                {activeLanguage === 'ko' && (
                  <span className="text-xs text-muted-foreground">
                    (Korean)
                  </span>
                )}
              </Label>
              <Textarea
                id="description"
                value={
                  activeLanguage === 'en'
                    ? formData.description
                    : koreanData.description_ko
                }
                onChange={(e) =>
                  activeLanguage === 'en'
                    ? setFormData({ ...formData, description: e.target.value })
                    : setKoreanData({
                        ...koreanData,
                        description_ko: e.target.value,
                      })
                }
                placeholder={
                  activeLanguage === 'en'
                    ? 'Provide a brief overview of the trip for guests...'
                    : '여행에 대한 간략한 개요를 제공하세요...'
                }
                rows={6}
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="overview_content"
                className="text-base text-foreground"
              >
                Detailed Overview (Optional){' '}
                {activeLanguage === 'ko' && (
                  <span className="text-xs text-muted-foreground">
                    (Korean)
                  </span>
                )}
              </Label>
              <Textarea
                id="overview_content"
                value={
                  activeLanguage === 'en'
                    ? formData.overview_content
                    : koreanData.overview_content_ko
                }
                onChange={(e) =>
                  activeLanguage === 'en'
                    ? setFormData({
                        ...formData,
                        overview_content: e.target.value,
                      })
                    : setKoreanData({
                        ...koreanData,
                        overview_content_ko: e.target.value,
                      })
                }
                placeholder={
                  activeLanguage === 'en'
                    ? 'Provide a detailed overview shown on the trip detail page...'
                    : '여행 상세 페이지에 표시될 자세한 개요를 제공하세요...'
                }
                rows={8}
              />
              <p className="text-xs text-muted-foreground">
                This detailed overview will be displayed on the trip detail
                page. If empty, the Trip Overview above will be used.
              </p>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="refund_policy"
                className="text-base text-foreground"
              >
                Refund Policy (Optional){' '}
                {activeLanguage === 'ko' && (
                  <span className="text-xs text-muted-foreground">
                    (Korean)
                  </span>
                )}
              </Label>
              <Textarea
                id="refund_policy"
                value={
                  activeLanguage === 'en'
                    ? formData.refund_policy
                    : koreanData.refund_policy_ko
                }
                onChange={(e) =>
                  activeLanguage === 'en'
                    ? setFormData({
                        ...formData,
                        refund_policy: e.target.value,
                      })
                    : setKoreanData({
                        ...koreanData,
                        refund_policy_ko: e.target.value,
                      })
                }
                placeholder={
                  activeLanguage === 'en'
                    ? 'Enter the refund policy specific to this trip...'
                    : '이 여행에 대한 환불 정책을 입력하세요...'
                }
                rows={4}
              />
            </div>

            {/* Highlights */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base text-foreground">
                  Highlights (Optional){' '}
                  {activeLanguage === 'ko' && (
                    <span className="text-xs text-muted-foreground">
                      (Korean)
                    </span>
                  )}
                </Label>
                {activeLanguage === 'en' && (
                  <Button
                    type="button"
                    onClick={addHighlight}
                    size="sm"
                    variant="outline"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Highlight
                  </Button>
                )}
              </div>
              {activeLanguage === 'en' ? (
                highlights.length > 0 ? (
                  <div className="space-y-2">
                    {highlights.map((highlight, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={highlight}
                          onChange={(e) =>
                            updateHighlight(index, e.target.value)
                          }
                          placeholder="e.g., Stay at this nice hotel"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeHighlight(index)}
                          className="flex-shrink-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No highlights added yet
                  </p>
                )
              ) : highlights.length > 0 ? (
                <div className="space-y-2">
                  {highlights.map((_, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={highlightsKo[index] || ''}
                        onChange={(e) => {
                          const updated = [...highlightsKo]
                          updated[index] = e.target.value
                          setHighlightsKo(updated)
                        }}
                        placeholder={`Korean translation for: "${highlights[index]}"`}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Add highlights in English first, then translate them here
                </p>
              )}
            </div>

            {/* Continent */}
            <div className="space-y-3">
              <Label className="text-base text-foreground">
                Choose Continent *
              </Label>
              <div className="flex flex-wrap gap-2">
                {CONTINENTS.map((continent) => (
                  <button
                    key={continent}
                    type="button"
                    onClick={() => setFormData({ ...formData, continent })}
                    className={`rounded-full border px-4 py-2 text-sm transition-colors sm:px-6 ${
                      formData.continent === continent
                        ? 'border-primary bg-primary text-white'
                        : 'border-muted-foreground/30 bg-background text-foreground hover:border-primary/50'
                    }`}
                  >
                    {continent === 'North America'
                      ? 'N. America'
                      : continent === 'Latin America'
                        ? 'L. America'
                        : continent}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label
                  htmlFor="max_guests"
                  className="text-base text-foreground"
                >
                  Max Guests
                </Label>
                <Input
                  id="max_guests"
                  type="number"
                  value={formData.max_guests}
                  onChange={(e) =>
                    setFormData({ ...formData, max_guests: e.target.value })
                  }
                  placeholder="20"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="min_days" className="text-base text-foreground">
                Minimum Trip Duration (Days)
              </Label>
              <Input
                id="min_days"
                type="number"
                min="1"
                value={formData.min_days}
                onChange={(e) =>
                  setFormData({ ...formData, min_days: e.target.value })
                }
                placeholder="e.g., 3"
              />
              <p className="text-xs text-muted-foreground">
                Minimum number of days guests must select on the calendar
                (default: 1)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="max_days" className="text-base text-foreground">
                Maximum Trip Duration (Days)
              </Label>
              <Input
                id="max_days"
                type="number"
                min="1"
                value={formData.max_days}
                onChange={(e) =>
                  setFormData({ ...formData, max_days: e.target.value })
                }
                placeholder="e.g., 7"
              />
              <p className="text-xs text-muted-foreground">
                Optional: Set a maximum number of days guests can book for this
                trip
              </p>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="min_days_advance"
                className="text-base text-foreground"
              >
                Minimum Advance Booking Period (Days)
              </Label>
              <Input
                id="min_days_advance"
                type="number"
                min="0"
                value={formData.min_days_advance}
                onChange={(e) =>
                  setFormData({ ...formData, min_days_advance: e.target.value })
                }
                placeholder="e.g., 30"
              />
              <p className="text-xs text-muted-foreground">
                Optional: Minimum days in advance required to book (0 = no
                restriction)
              </p>
            </div>

            {/* Course Photos */}
            <div className="space-y-3">
              <Label className="text-base text-foreground">
                Upload Photos for Courses
              </Label>
              {coursePhotos.length > 0 && (
                <div className="grid gap-3 sm:grid-cols-2">
                  {coursePhotos.map((url, index) => (
                    <div
                      key={`${url}-${index}`}
                      draggable
                      onDragStart={() => setDragIndex(index)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => {
                        if (dragIndex !== null && dragIndex !== index) {
                          setCoursePhotos((prev) => {
                            const next = [...prev]
                            const [moved] = next.splice(dragIndex, 1)
                            next.splice(index, 0, moved)
                            return next
                          })
                        }
                        setDragIndex(null)
                      }}
                      onDragEnd={() => setDragIndex(null)}
                      className={`relative aspect-[3/1] w-full overflow-hidden rounded-lg border-2 border-dashed transition-colors ${
                        dragIndex === index
                          ? 'border-primary bg-primary/5'
                          : 'border-border'
                      } cursor-grab active:cursor-grabbing`}
                    >
                      <div className="absolute left-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded bg-black/50 text-white">
                        <GripVertical className="h-4 w-4" />
                      </div>
                      <Image
                        src={url || '/placeholder.svg'}
                        alt={`Golf course photo ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                      <Button
                        type="button"
                        size="icon"
                        variant="destructive"
                        className="absolute right-2 top-2"
                        onClick={() =>
                          setCoursePhotos((prev) =>
                            prev.filter((_, i) => i !== index),
                          )
                        }
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              {coursePhotos.length < 5 && (
                <label className="flex aspect-[3/1] w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/20 transition-colors hover:bg-muted/40">
                  <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
                  <p className="text-sm">
                    <span className="text-primary">Click to upload</span>
                    <span className="text-muted-foreground">
                      {' '}
                      or drag and drop
                    </span>
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Up to 5 images, JPG/JPEG/PNG under 1MB each
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handlePhotoUpload(e, 'courses')}
                    disabled={uploadingPhoto === 'courses'}
                  />
                </label>
              )}
            </div>

            {/* Accommodation Photo */}
            <div className="space-y-3">
              <Label className="text-base text-foreground">
                Upload Accommodation Photo
              </Label>
              {photos.room ? (
                <div className="relative aspect-[3/1] w-full overflow-hidden rounded-lg border-2 border-dashed border-border">
                  <Image
                    src={photos.room || '/placeholder.svg'}
                    alt="Accommodation"
                    fill
                    className="object-cover"
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="destructive"
                    className="absolute right-2 top-2"
                    onClick={() => handleRemovePhoto('room')}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <label className="flex aspect-[3/1] w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/20 transition-colors hover:bg-muted/40">
                  <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
                  <p className="text-sm">
                    <span className="text-primary">Click to upload</span>
                    <span className="text-muted-foreground">
                      {' '}
                      or drag and drop
                    </span>
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    JPG, JPEG, PNG less than 1MB
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handlePhotoUpload(e, 'room')}
                    disabled={uploadingPhoto === 'room'}
                  />
                </label>
              )}
            </div>
          </div>
        )}

        {/* ========== STEP 2: Packages ========== */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold">Packages</h2>
              <p className="text-sm text-muted-foreground">
                Configure room types - Premium is required, Upgrade is optional
              </p>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border p-4">
              <div>
                <Label className="text-base font-medium text-foreground">
                  {'Show "From" before price'}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {
                    'Displays "From $X" on the trip card instead of a fixed price'
                  }
                </p>
              </div>
              <Switch
                checked={showFromPrice}
                onCheckedChange={setShowFromPrice}
              />
            </div>

            <div className="space-y-4 rounded-lg border border-border p-6">
              {packages
                .filter((pkg) => pkg.name === 'Premium')
                .map((pkg) => (
                  <div
                    key={pkg.id}
                    className="space-y-4 rounded-lg border border-border bg-muted/20 p-4"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">
                        Premium Package (Required)
                      </h4>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-base text-foreground">
                        Package Details (optional)
                      </Label>
                      <Textarea
                        value={pkg.description}
                        onChange={(e) =>
                          updatePackage(pkg.id, 'description', e.target.value)
                        }
                        placeholder="What's included in this package..."
                        rows={3}
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label className="text-base text-foreground">
                          Full price per person *
                        </Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={pkg.price}
                          onChange={(e) =>
                            updatePackage(pkg.id, 'price', e.target.value)
                          }
                          placeholder="100"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-base text-foreground">
                          Price per extra night
                        </Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={pkg.price_per_extra_night}
                          onChange={(e) =>
                            updatePackage(
                              pkg.id,
                              'price_per_extra_night',
                              e.target.value,
                            )
                          }
                          placeholder="50"
                        />
                        <p className="text-xs text-muted-foreground">
                          Additional cost per night beyond minimum stay
                          (optional)
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label className="text-base text-foreground">
                          Participants per booking *
                        </Label>
                        <Input
                          type="number"
                          value={pkg.participants_per_booking}
                          onChange={(e) =>
                            updatePackage(
                              pkg.id,
                              'participants_per_booking',
                              e.target.value,
                            )
                          }
                          placeholder="2"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-base text-foreground">
                          Availability
                        </Label>
                        <Select
                          value={pkg.availability}
                          onValueChange={(value) =>
                            updatePackage(pkg.id, 'availability', value)
                          }
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
                        <div className="space-y-2">
                          <Label className="text-base text-foreground">
                            Quantity
                          </Label>
                          <Input
                            type="number"
                            value={pkg.quantity}
                            onChange={(e) =>
                              updatePackage(pkg.id, 'quantity', e.target.value)
                            }
                            placeholder="10"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}

              {hasUpgradePackage ? (
                packages
                  .filter((pkg) => pkg.name === 'Upgrade')
                  .map((pkg) => (
                    <div
                      key={pkg.id}
                      className="space-y-4 rounded-lg border border-border bg-muted/20 p-4"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">
                          Upgrade Package (Optional)
                        </h4>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={removeUpgradePackage}
                          className="text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-base text-foreground">
                          Package Details (optional)
                        </Label>
                        <Textarea
                          value={pkg.description}
                          onChange={(e) =>
                            updatePackage(pkg.id, 'description', e.target.value)
                          }
                          placeholder="What's included in this package..."
                          rows={3}
                        />
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label className="text-base text-foreground">
                            Full price per person *
                          </Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={pkg.price}
                            onChange={(e) =>
                              updatePackage(pkg.id, 'price', e.target.value)
                            }
                            placeholder="200"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-base text-foreground">
                            Price per extra night
                          </Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={pkg.price_per_extra_night}
                            onChange={(e) =>
                              updatePackage(
                                pkg.id,
                                'price_per_extra_night',
                                e.target.value,
                              )
                            }
                            placeholder="75"
                          />
                          <p className="text-xs text-muted-foreground">
                            Additional cost per night beyond minimum stay
                            (optional)
                          </p>
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label className="text-base text-foreground">
                            Participants per booking *
                          </Label>
                          <Input
                            type="number"
                            value={pkg.participants_per_booking}
                            onChange={(e) =>
                              updatePackage(
                                pkg.id,
                                'participants_per_booking',
                                e.target.value,
                              )
                            }
                            placeholder="2"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-base text-foreground">
                            Availability
                          </Label>
                          <Select
                            value={pkg.availability}
                            onValueChange={(value) =>
                              updatePackage(pkg.id, 'availability', value)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="unlimited">
                                Unlimited
                              </SelectItem>
                              <SelectItem value="limited">Limited</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {pkg.availability === 'limited' && (
                          <div className="space-y-2">
                            <Label className="text-base text-foreground">
                              Quantity
                            </Label>
                            <Input
                              type="number"
                              value={pkg.quantity}
                              onChange={(e) =>
                                updatePackage(
                                  pkg.id,
                                  'quantity',
                                  e.target.value,
                                )
                              }
                              placeholder="10"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))
              ) : (
                <div className="py-8 text-center">
                  <p className="mb-4 text-sm text-muted-foreground">
                    Upgrade package not added (optional)
                  </p>
                  <Button
                    type="button"
                    onClick={addUpgradePackage}
                    size="sm"
                    className="bg-primary hover:bg-primary/90"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Upgrade Package
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========== STEP 3: Booking Options ========== */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold">Booking Options</h2>
              <p className="text-sm text-muted-foreground">
                Configure golf courses, meals, transportation, and service
                options (all optional)
              </p>
            </div>

            {/* Golf Courses */}
            <div className="space-y-4 rounded-lg border border-border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">
                    Golf Courses & Rounds
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Add available golf courses (optional)
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={addGolfCourse}
                  size="sm"
                  className="bg-primary hover:bg-primary/90"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Course
                </Button>
              </div>

              {golfCourses.map((course, index) => (
                <div
                  key={course.id}
                  className="space-y-4 rounded-lg border border-border bg-muted/20 p-4"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">
                      Course {String.fromCharCode(65 + index)}
                    </h4>
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
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label className="text-base text-foreground">
                        Course Name *
                      </Label>
                      <Input
                        value={course.course_name}
                        onChange={(e) =>
                          updateGolfCourse(
                            course.id,
                            'course_name',
                            e.target.value,
                          )
                        }
                        placeholder="Course A"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-base text-foreground">
                        Max Rounds *
                      </Label>
                      <Input
                        type="number"
                        min="0"
                        value={course.max_rounds}
                        onChange={(e) =>
                          updateGolfCourse(
                            course.id,
                            'max_rounds',
                            e.target.value,
                          )
                        }
                        placeholder="5"
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        Maximum rounds available (min: 0)
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-base text-foreground">
                        Number of Holes *
                      </Label>
                      <Input
                        type="number"
                        min="1"
                        value={course.num_holes}
                        onChange={(e) =>
                          updateGolfCourse(
                            course.id,
                            'num_holes',
                            e.target.value,
                          )
                        }
                        placeholder="18"
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        Number of holes per round (e.g., 9, 18)
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {golfCourses.length === 0 && (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  No golf courses added. Click &quot;Add Course&quot; to add
                  courses (optional).
                </div>
              )}
            </div>

            {/* Meals */}
            <div className="space-y-4 rounded-lg border border-border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Meals</h3>
                  <p className="text-sm text-muted-foreground">
                    Add meal options for this trip (optional)
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={addMealOption}
                  size="sm"
                  className="bg-primary hover:bg-primary/90"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Meal Option
                </Button>
              </div>

              {mealOptions.map((meal, index) => (
                <div
                  key={meal.id}
                  className="space-y-4 rounded-lg border border-border bg-muted/20 p-4"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Meal Option {index + 1}</h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeMealOption(meal.id)}
                      className="text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-base text-foreground">
                        Option Name *
                      </Label>
                      <Input
                        value={meal.name}
                        onChange={(e) =>
                          updateMealOption(meal.id, 'name', e.target.value)
                        }
                        placeholder="e.g., Breakfast Included"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-base text-foreground">
                      Description
                    </Label>
                    <Textarea
                      value={meal.description}
                      onChange={(e) =>
                        updateMealOption(meal.id, 'description', e.target.value)
                      }
                      placeholder="Describe this meal option..."
                      rows={2}
                    />
                  </div>
                  <div className="flex items-center justify-start gap-2">
                    <Switch
                      id={`meal-included-${meal.id}`}
                      checked={meal.is_included}
                      onCheckedChange={(checked) =>
                        updateMealOption(meal.id, 'is_included', checked)
                      }
                    />
                    <Label
                      htmlFor={`meal-included-${meal.id}`}
                      className="text-base text-foreground"
                    >
                      Included in Package
                    </Label>
                  </div>
                </div>
              ))}

              {mealOptions.length === 0 && (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  No meal options added. Click &quot;Add Meal Option&quot; to
                  add options (optional).
                </div>
              )}
            </div>

            {/* Transportation */}
            <div className="space-y-4 rounded-lg border border-border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Transportation</h3>
                  <p className="text-sm text-muted-foreground">
                    Add transportation options for this trip (optional)
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={addTransportationOption}
                  size="sm"
                  className="bg-primary hover:bg-primary/90"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Transportation Option
                </Button>
              </div>

              {transportationOptions.map((transport, index) => (
                <div
                  key={transport.id}
                  className="space-y-4 rounded-lg border border-border bg-muted/20 p-4"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">
                      Transportation Option {index + 1}
                    </h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeTransportationOption(transport.id)}
                      className="text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-base text-foreground">
                        Option Name *
                      </Label>
                      <Input
                        value={transport.name}
                        onChange={(e) =>
                          updateTransportationOption(
                            transport.id,
                            'name',
                            e.target.value,
                          )
                        }
                        placeholder="e.g., Private Car with Driver"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-base text-foreground">
                      Description
                    </Label>
                    <Textarea
                      value={transport.description}
                      onChange={(e) =>
                        updateTransportationOption(
                          transport.id,
                          'description',
                          e.target.value,
                        )
                      }
                      placeholder="Describe this transportation option..."
                      rows={2}
                    />
                  </div>
                  <div className="flex items-center justify-start gap-2">
                    <Switch
                      id={`transport-included-${transport.id}`}
                      checked={transport.is_included}
                      onCheckedChange={(checked) =>
                        updateTransportationOption(
                          transport.id,
                          'is_included',
                          checked,
                        )
                      }
                    />
                    <Label
                      htmlFor={`transport-included-${transport.id}`}
                      className="text-base text-foreground"
                    >
                      Included in Package
                    </Label>
                  </div>
                </div>
              ))}

              {transportationOptions.length === 0 && (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  No transportation options added. Click &quot;Add
                  Transportation Option&quot; to add options (optional).
                </div>
              )}
            </div>

            {/* Service Options */}
            <div className="space-y-4 rounded-lg border border-border p-6">
              <div>
                <h3 className="text-lg font-semibold">Service Options</h3>
                <p className="text-sm text-muted-foreground">
                  Toggle on if these services are included by default.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-center justify-between rounded-lg border border-border bg-muted/20 p-4">
                  <div>
                    <p className="text-sm font-medium">Caddy Included</p>
                    <p className="text-xs text-muted-foreground">
                      Toggle on if a caddy is included for players.
                    </p>
                  </div>
                  <Switch
                    checked={
                      serviceOptions.find((opt) => opt.name === 'Caddy')
                        ?.is_included || false
                    }
                    onCheckedChange={(checked) =>
                      handleServiceOptionToggle('Caddy', checked)
                    }
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border bg-muted/20 p-4">
                  <div>
                    <p className="text-sm font-medium">Golf Cart Included</p>
                    <p className="text-xs text-muted-foreground">
                      Toggle on if a golf cart is included for players.
                    </p>
                  </div>
                  <Switch
                    checked={
                      serviceOptions.find((opt) => opt.name === 'Golf Cart')
                        ?.is_included || false
                    }
                    onCheckedChange={(checked) =>
                      handleServiceOptionToggle('Golf Cart', checked)
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========== STEP 4: Customer Info & Dates ========== */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold">
                Customer Information & Travel Dates
              </h2>
              <p className="text-muted-foreground">
                Enter the customer&apos;s contact details and trip dates
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="customerName">Full Name *</Label>
                <Input
                  id="customerName"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerEmail">Email Address *</Label>
                <Input
                  id="customerEmail"
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="john@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerPhone">Phone Number *</Label>
                <Input
                  id="customerPhone"
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                />
                <p className="text-xs text-muted-foreground">
                  Payment link will be sent via SMS to this number
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Start Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !startDate && 'text-muted-foreground',
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, 'PPP') : 'Select date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-auto p-0"
                    align="center"
                    sideOffset={4}
                  >
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      disabled={(date) => date < new Date()}
                      initialFocus
                      className="rounded-md border"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>End Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !endDate && 'text-muted-foreground',
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, 'PPP') : 'Select date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-auto p-0"
                    align="center"
                    sideOffset={4}
                  >
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      disabled={(date) =>
                        date < new Date() ||
                        (startDate ? date < startDate : false)
                      }
                      initialFocus
                      className="rounded-md border"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {startDate && endDate && (
              <div className="rounded-lg border border-border bg-muted/20 p-4">
                <p className="text-sm text-muted-foreground">
                  Trip Duration:{' '}
                  <span className="font-medium text-foreground">
                    {Math.ceil(
                      (endDate.getTime() - startDate.getTime()) /
                        (1000 * 60 * 60 * 24),
                    ) + 1}{' '}
                    days
                  </span>
                </p>
              </div>
            )}
          </div>
        )}

        {/* ========== STEP 5: Payment & Review ========== */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold">Payment & Review</h2>
              <p className="text-muted-foreground">
                Set the payment amount and review all booking details
              </p>
            </div>

            {/* Payment Amount Section */}
            <div className="space-y-4 rounded-lg border border-border p-4">
              <Label>
                Payment Amount (based on Premium Package: $
                {totalPrice.toLocaleString()})
              </Label>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant={depositPercentage === 30 ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDepositPercentage(30)}
                  className={
                    depositPercentage === 30 ? 'bg-primary' : 'bg-transparent'
                  }
                >
                  30%
                </Button>
                <Button
                  type="button"
                  variant={depositPercentage === 50 ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDepositPercentage(50)}
                  className={
                    depositPercentage === 50 ? 'bg-primary' : 'bg-transparent'
                  }
                >
                  50%
                </Button>
                <Button
                  type="button"
                  variant={depositPercentage === 100 ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDepositPercentage(100)}
                  className={
                    depositPercentage === 100 ? 'bg-primary' : 'bg-transparent'
                  }
                >
                  100% Full Price
                </Button>
              </div>
              <div className="space-y-2">
                <Label>Custom Percentage: {depositPercentage}%</Label>
                <Slider
                  value={[depositPercentage]}
                  onValueChange={(value) => setDepositPercentage(value[0])}
                  min={0}
                  max={100}
                  step={1}
                  className="w-full"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg bg-muted/30 p-3">
                  <p className="text-sm text-muted-foreground">
                    Deposit Amount
                  </p>
                  <p className="text-lg font-bold">
                    $
                    {depositAmount.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                    })}
                  </p>
                </div>
                {depositPercentage < 100 && (
                  <div className="rounded-lg bg-muted/30 p-3">
                    <p className="text-sm text-muted-foreground">Remainder</p>
                    <p className="text-lg font-bold">
                      $
                      {remainderAmount.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                )}
              </div>
              {depositPercentage < 100 && (
                <div className="space-y-2">
                  <Label>Remainder Due Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !remainderDueDate && 'text-muted-foreground',
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {remainderDueDate
                          ? format(remainderDueDate, 'PPP')
                          : 'Select due date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-auto p-0"
                      align="center"
                      sideOffset={4}
                    >
                      <Calendar
                        mode="single"
                        selected={remainderDueDate}
                        onSelect={setRemainderDueDate}
                        disabled={(date) => date < new Date()}
                        initialFocus
                        className="rounded-md border"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              )}
            </div>

            {/* Review Summary */}
            <div className="space-y-4">
              <div className="rounded-lg border border-border p-6">
                <h3 className="mb-4 text-lg font-semibold">Trip Basics</h3>
                <div className="grid gap-4 text-sm">
                  <div>
                    <span className="font-medium">Title:</span>{' '}
                    {formData.title || 'Not set'}
                  </div>
                  <div>
                    <span className="font-medium">Location:</span>{' '}
                    {formData.location || 'Not set'}
                  </div>
                  <div>
                    <span className="font-medium">Continent:</span>{' '}
                    {formData.continent || 'Not set'}
                  </div>
                  {formData.description && (
                    <div>
                      <span className="font-medium">Description:</span>{' '}
                      <span className="text-muted-foreground">
                        {formData.description}
                      </span>
                    </div>
                  )}
                  {highlights.filter((h) => h.trim()).length > 0 && (
                    <div>
                      <span className="font-medium">Highlights:</span>
                      <ul className="mt-2 list-inside list-disc space-y-1 text-muted-foreground">
                        {highlights
                          .filter((h) => h.trim())
                          .map((h, idx) => (
                            <li key={idx}>{h}</li>
                          ))}
                      </ul>
                    </div>
                  )}
                  <div className="grid gap-2 md:grid-cols-2">
                    <div>
                      <span className="font-medium">Max Guests:</span>{' '}
                      {formData.max_guests}
                    </div>
                    {formData.max_days && (
                      <div>
                        <span className="font-medium">Max Days:</span>{' '}
                        {formData.max_days}
                      </div>
                    )}
                    {formData.min_days && (
                      <div>
                        <span className="font-medium">Min Days:</span>{' '}
                        {formData.min_days}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-border p-6">
                <h3 className="mb-4 text-lg font-semibold">
                  Packages ({packages.length})
                </h3>
                <div className="space-y-4">
                  {packages.map((pkg) => (
                    <div
                      key={pkg.id}
                      className="rounded border border-border bg-muted/20 p-4 text-sm"
                    >
                      <p className="mb-2 font-medium">{pkg.name}</p>
                      <div className="grid gap-2 md:grid-cols-2">
                        <div>
                          <span className="font-medium">Price:</span> $
                          {pkg.price}
                        </div>
                        {pkg.price_per_extra_night && (
                          <div>
                            <span className="font-medium">Extra night:</span> $
                            {pkg.price_per_extra_night}/night
                          </div>
                        )}
                        <div>
                          <span className="font-medium">Participants:</span>{' '}
                          {pkg.participants_per_booking}
                        </div>
                        <div>
                          <span className="font-medium">Availability:</span>{' '}
                          {pkg.availability}
                          {pkg.availability === 'limited' &&
                            ` (${pkg.quantity} available)`}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-border p-6">
                <h3 className="mb-4 text-lg font-semibold">Customer & Dates</h3>
                <div className="grid gap-4 text-sm">
                  <div>
                    <span className="font-medium">Customer:</span>{' '}
                    {customerName}
                  </div>
                  <div>
                    <span className="font-medium">Email:</span> {customerEmail}
                  </div>
                  <div>
                    <span className="font-medium">Phone:</span> {customerPhone}
                  </div>
                  <div>
                    <span className="font-medium">Dates:</span>{' '}
                    {startDate ? format(startDate, 'PPP') : 'Not set'} -{' '}
                    {endDate ? format(endDate, 'PPP') : 'Not set'}
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-border p-6">
                <h3 className="mb-4 text-lg font-semibold">Payment</h3>
                <div className="grid gap-4 text-sm">
                  <div>
                    <span className="font-medium">Deposit:</span>{' '}
                    {depositPercentage}% ($
                    {depositAmount.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                    })}
                    )
                  </div>
                  {depositPercentage < 100 && (
                    <>
                      <div>
                        <span className="font-medium">Remainder:</span> $
                        {remainderAmount.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                        })}
                      </div>
                      <div>
                        <span className="font-medium">Remainder Due:</span>{' '}
                        {remainderDueDate
                          ? format(remainderDueDate, 'PPP')
                          : 'Not set'}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="mt-8 flex flex-col gap-4 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2">
          {currentStep === 1 ? (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="w-full sm:w-auto bg-transparent"
            >
              Cancel
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              className="w-full sm:w-auto bg-transparent"
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>
          )}
        </div>

        {currentStep < 5 ? (
          <Button
            type="button"
            onClick={nextStep}
            disabled={!canProceedToNextStep()}
            className="w-full bg-primary hover:bg-primary/90 sm:w-auto"
          >
            Next
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-primary hover:bg-primary/90 sm:w-auto"
          >
            {loading ? 'Creating Custom Trip...' : 'Create & Send Payment Link'}
          </Button>
        )}
      </div>
    </div>
  )
}
