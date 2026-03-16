'use client'

import type React from 'react'
import { useState, useEffect, useMemo, useRef } from 'react'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  ChevronLeft,
  ChevronRight,
  Users,
  User,
  Check,
  Minus,
  Plus,
  X,
} from 'lucide-react'
import { StripeCheckout } from '@/components/booking/stripe-checkout'
  import {
  format,
  addDays,
  differenceInDays,
  isWithinInterval,
  isBefore,
  isSameDay,
  isToday,
} from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'
import { useTranslations, useLocale } from '@/lib/i18n/provider'
import { getLocalizedField } from '@/lib/i18n/get-localized-field'

interface Trip {
  id: string
  title: string
  slug: string
  location: string
  location_ko?: string | null
  location_de?: string | null
  price_regular: number
  max_days?: number
  min_days?: number
  min_days_advance?: number
  courses_photo_url?: string | null
  room_photo_url?: string | null
  images?: Array<{
    image_url: string
    display_order: number
  }>
  packages?: Array<{
    id: string
    name: string
    name_ko?: string | null
    name_de?: string | null
    description: string | null
    description_ko?: string | null
    description_de?: string | null
    price: number
  }>
  add_ons?: Array<{
    id: string
    name: string
    name_ko?: string | null
    name_de?: string | null
    description: string | null
    description_ko?: string | null
    description_de?: string | null
    price: number
    price_type: string
  }>
  golf_courses?: Array<{
    id: string
    course_name: string
    course_name_ko?: string | null
    course_name_de?: string | null
    description?: string | null
    description_ko?: string | null
    description_de?: string | null
    num_holes?: number
    max_rounds?: number
  }>
  meal_options?: Array<{
    id: string
    name: string
    name_ko?: string | null
    name_de?: string | null
    description?: string | null
    description_ko?: string | null
    description_de?: string | null
    is_included?: boolean
  }>
  transportation_options?: Array<{
    id: string
    name: string
    name_ko?: string | null
    name_de?: string | null
    description?: string | null
    description_ko?: string | null
    description_de?: string | null
    is_included?: boolean
  }>
  service_options?: Array<{
    id: string
    name: string
    name_ko?: string | null
    name_de?: string | null
    description?: string | null
    description_ko?: string | null
    description_de?: string | null
    is_included?: boolean
  }>
}

interface BookingFormProps {
  trip: Trip
  user: any
  profile: any
  preSelectedPackageId?: string
}

function PlanCard({
  pkg,
  selected,
  onSelect,
  t,
  locale,
}: {
  pkg: { id: string; name: string; name_ko?: string | null; name_de?: string | null; description: string | null; description_ko?: string | null; description_de?: string | null; price: number }
  selected: boolean
  onSelect: () => void
  t: (key: string) => string
  locale: string
}) {
  const [expanded, setExpanded] = useState(false)
  const [clamped, setClamped] = useState(false)
  const descRef = useRef<HTMLParagraphElement>(null)
  
  const pkgName = getLocalizedField(pkg, 'name', locale as any)
  const pkgDescription = getLocalizedField(pkg, 'description', locale as any)

  useEffect(() => {
    const el = descRef.current
    if (el) {
      setClamped(el.scrollHeight > el.clientHeight)
    }
  }, [pkgDescription])

  return (
    <div
      onClick={onSelect}
      className={`border bg-[#f5f5f5] px-4 py-3 transition-colors cursor-pointer hover:border-gray-300 ${
        selected ? 'border-[#3D5A80]' : 'border-gray-200'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="font-serif text-xl font-medium">{pkgName}</h3>
          {pkgDescription && (
            <div className="mt-1">
              <p
                ref={descRef}
                className={`text-sm text-muted-foreground whitespace-pre-wrap ${
                  !expanded ? 'line-clamp-3' : ''
                }`}
              >
                {pkgDescription}
              </p>
              {clamped && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setExpanded((prev) => !prev)
                  }}
                  className="mt-1 text-xs font-medium text-[#3D5A80] hover:underline"
                >
                  {expanded ? t('showLess') : t('readMore')}
                </button>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-4 ml-4 shrink-0">
          <span className="text-2xl font-medium">${pkg.price}</span>
          <div
            className={`flex h-5 w-5 items-center justify-center border-2 ${
              selected ? 'border-[#3D5A80] bg-[#3D5A80]' : 'border-gray-300'
            }`}
          >
            {selected && <div className="h-2 w-2 bg-white" />}
          </div>
        </div>
      </div>
    </div>
  )
}

export function BookingForm({
  trip,
  user,
  profile,
  preSelectedPackageId,
}: BookingFormProps) {
  const t = useTranslations('booking')
  const locale = useLocale()
  const supabase = createClient()

  const [courseRounds, setCourseRounds] = useState<{ [key: string]: number }>(
    {},
  )
  const [roomType, setRoomType] = useState<string>('')
  const [selectedMeal, setSelectedMeal] = useState<string>('')
  const [selectedTransport, setSelectedTransport] = useState<string>('')
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([])
  const [additionalRequests, setAdditionalRequests] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(user)
  const [galleryOpen, setGalleryOpen] = useState(false)
  const [galleryIndex, setGalleryIndex] = useState(0)
  const [showStripeCheckout, setShowStripeCheckout] = useState(false)
  const [bookingSuccess, setBookingSuccess] = useState(false)

  const packages = trip.packages || []
  const premiumPackage = packages.find((pkg: any) => pkg.name === 'Premium')
  const upgradePackage = packages.find((pkg: any) => pkg.name === 'Upgrade')

  const golfCourses = trip.golf_courses || []
  const mealOptions = trip.meal_options || []
  const transportationOptions = trip.transportation_options || []
  const serviceOptions = trip.service_options || []

  const includedMealIds = useMemo(
    () =>
      mealOptions
        .filter((meal: any) => meal.is_included)
        .map((meal: any) => String(meal.id))
        .sort(),
    [mealOptions],
  )

  const includedTransportIds = useMemo(
    () =>
      transportationOptions
        .filter((transport: any) => transport.is_included)
        .map((transport: any) => String(transport.id))
        .sort(),
    [transportationOptions],
  )

  const includedServiceIds = useMemo(
    () =>
      serviceOptions
        .filter((service: any) => service.is_included)
        .map((service: any) => String(service.id))
        .sort(),
    [serviceOptions],
  )

  const lockedMealId = includedMealIds.length > 0 ? includedMealIds[0] : null
  const lockedTransportId =
    includedTransportIds.length > 0 ? includedTransportIds[0] : null

  const [selectedPlan, setSelectedPlan] = useState<string>(
    preSelectedPackageId || premiumPackage?.id || '',
  )
  const [travelDateRange, setTravelDateRange] = useState<{
    from: Date | undefined
    to: Date | undefined
  }>({
    from: undefined,
    to: undefined,
  })
  const [currentMonth, setCurrentMonth] = useState(new Date())

  // Show accommodation image in booking details
  const accommodationImages: Array<{ image_url: string; display_order: number }> = []
  if (trip.room_photo_url) {
    accommodationImages.push({
      image_url: trip.room_photo_url,
      display_order: 0,
    })
  }
  const tripImages = accommodationImages

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user: fetchedUser },
      } = await supabase.auth.getUser()
      if (fetchedUser) {
        setCurrentUser(fetchedUser)
      }
    }

    if (!user) {
      fetchUser()
    }
  }, [user, supabase])

  useEffect(() => {
    // If an included option exists, keep it locked.
    if (lockedMealId && selectedMeal !== lockedMealId) {
      setSelectedMeal(lockedMealId)
    }
  }, [lockedMealId, selectedMeal])

  useEffect(() => {
    // If an included option exists, keep it locked.
    if (lockedTransportId && selectedTransport !== lockedTransportId) {
      setSelectedTransport(lockedTransportId)
    }
  }, [lockedTransportId, selectedTransport])

  useEffect(() => {
    // Preselect ALL included services and keep them locked.
    // Also drop selections that no longer exist.
    const validIds = new Set(serviceOptions.map((s: any) => String(s.id)))

    setSelectedServiceIds((prev) => {
      const merged = new Set(prev.filter((id) => validIds.has(id)))
      for (const id of includedServiceIds) merged.add(id)
      const next = Array.from(merged).sort()

      if (
        prev.length === next.length &&
        prev.every((id, i) => id === next[i])
      ) {
        return prev
      }
      return next
    })
  }, [includedServiceIds, serviceOptions])

  const toggleService = (serviceId: string) => {
    if (includedServiceIds.includes(serviceId)) return
    setSelectedServiceIds((prev) =>
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId],
    )
  }

  const minAdvanceDays = trip.min_days_advance || 0
  // Use max_nights/min_nights from trip - these represent number of nights
  const maxNights = (trip as any).max_nights || trip.max_days || 14
  const minNights = (trip as any).min_nights || trip.min_days || 1
  const minDate = addDays(new Date(), minAdvanceDays)

  const handleTravelDateSelect = (date: Date) => {
    if (isBefore(date, minDate)) return

    if (!travelDateRange.from || (travelDateRange.from && travelDateRange.to)) {
      setTravelDateRange({ from: date, to: undefined })
    } else {
      if (isBefore(date, travelDateRange.from)) {
        setTravelDateRange({ from: date, to: undefined })
      } else {
        // differenceInDays gives us the number of nights (e.g., March 1 to March 5 = 4 nights)
        const nightsCount = differenceInDays(date, travelDateRange.from)
        if (nightsCount >= minNights && nightsCount <= maxNights) {
          setTravelDateRange({ from: travelDateRange.from, to: date })
        } else if (nightsCount < minNights) {
          // Snap to minimum nights
          const minEndDate = addDays(travelDateRange.from, minNights)
          setTravelDateRange({ from: travelDateRange.from, to: minEndDate })
        } else {
          // Snap to maximum nights
          const maxEndDate = addDays(travelDateRange.from, maxNights)
          setTravelDateRange({ from: travelDateRange.from, to: maxEndDate })
        }
      }
    }
  }

  const isTravelDate = (date: Date) => {
    if (!travelDateRange.from) return false
    if (!travelDateRange.to) return isSameDay(date, travelDateRange.from)
    return isWithinInterval(date, {
      start: travelDateRange.from,
      end: travelDateRange.to,
    })
  }

  const handleCourseRoundChange = (
    courseId: string,
    delta: number,
    maxRounds?: number | null,
  ) => {
    setCourseRounds((prev) => {
      const current = prev[courseId] || 0
      const cap =
        typeof maxRounds === 'number' && maxRounds > 0
          ? maxRounds
          : Number.POSITIVE_INFINITY
      const nextValue = Math.min(cap, Math.max(0, current + delta))

      const next = { ...prev }
      if (nextValue <= 0) {
        delete next[courseId]
      } else {
        next[courseId] = nextValue
      }
      return next
    })
  }

  const generateCalendarDays = (month: Date) => {
    const year = month.getFullYear()
    const monthIndex = month.getMonth()
    const firstDay = new Date(year, monthIndex, 1)
    const lastDay = new Date(year, monthIndex + 1, 0)
    const startPadding = (firstDay.getDay() + 6) % 7

    const days: (Date | null)[] = []
    for (let i = 0; i < startPadding; i++) {
      days.push(null)
    }
    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push(new Date(year, monthIndex, d))
    }
    return days
  }

  const handleProceedToPayment = (e: React.FormEvent) => {
    e.preventDefault()

    if (!travelDateRange.from || !travelDateRange.to) {
      alert('Please select your travel dates')
      return
    }

    if (!roomType) {
      alert('Please select a room type (Double or Single Occupancy)')
      return
    }

    if (!selectedPlan) {
      alert('Please select a package')
      return
    }

    // Proceed to Stripe checkout
    setShowStripeCheckout(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // This is now only for the legacy inquiry flow (fallback)
    if (!currentUser) {
      alert('Please sign in to submit an inquiry')
      return
    }

    if (!travelDateRange.from || !travelDateRange.to) {
      alert('Please select your travel dates')
      return
    }

    if (!roomType) {
      alert('Please select a room type (Double or Single Occupancy)')
      return
    }

    setSubmitting(true)

    try {
      const total = calculateTotal()
      const startDate = travelDateRange.from.toISOString().split('T')[0]
      const endDate = travelDateRange.to.toISOString().split('T')[0]

      const selectedPackage = packages.find((p: any) => p.id === selectedPlan)
      const packageName = selectedPackage?.name || ''
      const occupancyType =
        roomType === 'double' ? 'Double Occupancy' : 'Single Occupancy'

      const courseDetails = Object.entries(courseRounds)
        .filter(([_, rounds]) => rounds > 0)
        .map(([courseId, rounds]) => {
          const course = golfCourses.find((c: any) => c.id === courseId)
          return course ? `${course.course_name} (${rounds} rounds)` : null
        })
        .filter(Boolean)

      const mealOptionName =
        includedMealIds.length > 0
          ? `${mealOptions
              .filter((meal: any) => meal.is_included)
              .map((meal: any) => meal.name)
              .join(', ')} (Included)`
          : (() => {
              const selectedMealOption = mealOptions.find(
                (meal: any) => String(meal.id) === selectedMeal,
              )
              if (!selectedMealOption) return 'None'
              return selectedMealOption.is_included
                ? `${selectedMealOption.name} (Included)`
                : selectedMealOption.name
            })()

      const transportOptionName =
        includedTransportIds.length > 0
          ? `${transportationOptions
              .filter((t: any) => t.is_included)
              .map((t: any) => t.name)
              .join(', ')} (Included)`
          : (() => {
              const selectedTransportOption = transportationOptions.find(
                (transport: any) => String(transport.id) === selectedTransport,
              )
              if (!selectedTransportOption) return 'None'
              return selectedTransportOption.is_included
                ? `${selectedTransportOption.name} (Included)`
                : selectedTransportOption.name
            })()

      const customerName =
        profile?.display_name || currentUser?.email?.split('@')[0] || 'Guest'
      const customerEmail = profile?.email || currentUser?.email || ''

      const response = await fetch('/api/inquiry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tripId: trip.id,
          tripTitle: trip.title,
          customerName,
          customerEmail,
          packageName: `${packageName} - ${occupancyType}`,
          startDate,
          endDate,
          golfCourses: courseDetails,
          mealOption: mealOptionName,
          transportOption: transportOptionName,
          additionalRequests,
          totalPrice: total,
          roomType: occupancyType,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to send inquiry')
      }

      alert("Your inquiry has been submitted! We'll contact you shortly.")

      setTravelDateRange({ from: undefined, to: undefined })
      setCourseRounds({})
      setRoomType('')
      setSelectedMeal(lockedMealId || '')
      setSelectedTransport(lockedTransportId || '')
      setAdditionalRequests('')
    } catch (error) {
      console.error('Error submitting inquiry:', error)
      alert('There was an error submitting your inquiry. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const calculateTotal = () => {
    let total = 0

    const selectedPackage = packages.find((p: any) => p.id === selectedPlan)
    if (selectedPackage) {
      total += Number(selectedPackage.price)
      
      // Add extra nights cost if applicable
      if (selectedPackage.price_per_extra_night && travelDateRange.from && travelDateRange.to) {
        const nightsBooked = differenceInDays(travelDateRange.to, travelDateRange.from)
        const extraNights = Math.max(0, nightsBooked - minNights)
        if (extraNights > 0) {
          total += extraNights * Number(selectedPackage.price_per_extra_night)
        }
      }
    }

    // Note: Golf courses, meals, and transportation no longer have individual prices
    // All pricing is now included in the package price

    return total
  }

  const totalRounds = Object.values(courseRounds).reduce((sum, r) => sum + r, 0)

  const SectionHeader = ({
    number,
    title,
  }: {
    number: number
    title: string
  }) => (
    <div className="flex items-center bg-[#3D5A80]">
      <span className="flex h-full items-center justify-center bg-[#14184E] px-4 py-3 text-lg font-medium text-white">
        {number}
      </span>
      <h2 className="px-4 py-3 font-serif text-lg text-white">{title}</h2>
    </div>
  )

  const RadioOption = ({
    selected,
    onClick,
    disabled,
    children,
  }: {
    selected: boolean
    onClick: () => void
    disabled?: boolean
    children: React.ReactNode
  }) => (
    <div
      onClick={disabled ? undefined : onClick}
      className={`border bg-[#f5f5f5] px-4 py-3 transition-colors ${
        disabled
          ? 'cursor-not-allowed opacity-60'
          : 'cursor-pointer hover:border-gray-300'
      } ${selected ? 'border-[#3D5A80]' : 'border-gray-200'}`}
    >
      <div className="flex items-center justify-between">
        {children}
        <div
          className={`ml-4 flex h-5 w-5 shrink-0 items-center justify-center border-2 ${
            selected ? 'border-[#3D5A80] bg-[#3D5A80]' : 'border-gray-300'
          }`}
        >
          {selected && <div className="h-2 w-2 bg-white" />}
        </div>
      </div>
    </div>
  )

  // Calendar renderer
  const selectionStep: 'pick-start' | 'pick-end' | 'complete' =
    !travelDateRange.from
      ? 'pick-start'
      : !travelDateRange.to
        ? 'pick-end'
        : 'complete'

  const renderCalendar = () => {
    const days = generateCalendarDays(currentMonth)
    const weekdays = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

    return (
      <div className="border border-border bg-white p-4 sm:p-5 flex-1">
        {/* Month nav */}
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold font-serif">
            {format(currentMonth, 'MMMM yyyy')}
          </h3>
          <div className="flex gap-1">
            <button
              type="button"
              className="rounded p-1.5 hover:bg-muted transition-colors"
              onClick={() =>
                setCurrentMonth(
                  new Date(
                    currentMonth.getFullYear(),
                    currentMonth.getMonth() - 1,
                  ),
                )
              }
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="rounded p-1.5 hover:bg-muted transition-colors"
              onClick={() =>
                setCurrentMonth(
                  new Date(
                    currentMonth.getFullYear(),
                    currentMonth.getMonth() + 1,
                  ),
                )
              }
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Weekday headers */}
        <div className="mb-1 grid grid-cols-7 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {weekdays.map((day) => (
            <div key={day} className="py-1.5">
              {day}
            </div>
          ))}
        </div>

        {/* Day grid */}
        <div className="grid grid-cols-7">
          {days.map((date, idx) => {
            if (!date) {
              return <div key={`empty-${idx}`} className="p-2" />
            }

            const isDisabled = isBefore(date, minDate)
            const isTravel = isTravelDate(date)
            const isStart =
              travelDateRange.from && isSameDay(date, travelDateRange.from)
            const isEnd =
              travelDateRange.to && isSameDay(date, travelDateRange.to)
            const isMid = isTravel && !isStart && !isEnd
            const isTodayDate = isToday(date)

            return (
              <button
                key={date.toISOString()}
                type="button"
                onClick={() => handleTravelDateSelect(date)}
                disabled={isDisabled}
                className={`
                  relative p-2 text-center text-sm transition-colors
                  ${isDisabled ? 'cursor-not-allowed text-muted-foreground/30' : 'cursor-pointer'}
                  ${!isTravel && !isDisabled ? 'hover:bg-[#3D5A80]/10' : ''}
                  ${isStart ? 'bg-[#14184E] text-white rounded-l font-semibold' : ''}
                  ${isEnd ? 'bg-[#14184E] text-white rounded-r font-semibold' : ''}
                  ${isMid ? 'bg-[#3D5A80]/20 text-[#14184E]' : ''}
                  ${isStart && !travelDateRange.to ? 'rounded' : ''}
                `}
              >
                {date.getDate()}
                {isTodayDate && !isTravel && (
                  <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-[#3D5A80]" />
                )}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  const selectedPackage = packages.find((p: any) => p.id === selectedPlan)
  const selectedMealOption = mealOptions.find(
    (meal: any) => meal.id === selectedMeal,
  )
  const selectedTransportOption = transportationOptions.find(
    (transport: any) => transport.id === selectedTransport,
  )
  const includedServices = serviceOptions.filter(
    (service: any) => service.is_included,
  )
  const additionalRequestsSectionNumber = serviceOptions.length > 0 ? 8 : 7

  // Get booking details for Stripe checkout
  const getBookingDetails = () => {
    const startDate = travelDateRange.from
      ? format(travelDateRange.from, 'yyyy-MM-dd')
      : ''
    const endDate = travelDateRange.to
      ? format(travelDateRange.to, 'yyyy-MM-dd')
      : ''
    const occupancyType =
      roomType === 'double' ? 'Double Occupancy' : 'Single Occupancy'

    const courseDetails = Object.entries(courseRounds)
      .filter(([_, rounds]) => rounds > 0)
      .map(([courseId, rounds]) => {
        const course = golfCourses.find((c: any) => c.id === courseId)
        return course ? `${course.course_name} (${rounds} rounds)` : null
      })
      .filter(Boolean) as string[]

    const mealOptionName =
      includedMealIds.length > 0
        ? mealOptions
            .filter((meal: any) => meal.is_included)
            .map((meal: any) => meal.name)
            .join(', ')
        : selectedMealOption?.name || ''

    const transportOptionName =
      includedTransportIds.length > 0
        ? transportationOptions
            .filter((t: any) => t.is_included)
            .map((t: any) => t.name)
            .join(', ')
        : selectedTransportOption?.name || ''

    return {
      startDate,
      endDate,
      roomType: occupancyType,
      golfCourses: courseDetails,
      mealOption: mealOptionName,
      transportOption: transportOptionName,
    }
  }

  // Show success message after payment
  if (bookingSuccess) {
    return (
      <div className="w-full max-w-2xl mx-auto text-center py-16">
        <div className="mb-6">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <Check className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <h1 className="font-serif text-3xl font-bold mb-4">
          {t('bookingConfirmed')}
        </h1>
        <p className="text-muted-foreground mb-6">
          {t('bookingConfirmedMessage')}
        </p>
        {!currentUser && (
          <div className="bg-[#3D5A80]/10 border border-[#3D5A80]/20 p-4 rounded-lg mb-6">
            <p className="text-sm text-[#3D5A80] font-medium mb-2">
              {t('createAccountPrompt')}
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              {t('createAccountDescription')}
            </p>
            <a
              href="/auth/sign-up"
              className="inline-block bg-[#3D5A80] text-white px-6 py-2 font-medium hover:bg-[#3D5A80]/90 transition-colors"
            >
              {t('createAccount')}
            </a>
          </div>
        )}
        <a
          href={`/trips/${trip.slug}`}
          className="text-[#3D5A80] hover:underline"
        >
          {t('returnToTrip')}
        </a>
      </div>
    )
  }

  // Show Stripe checkout
  if (showStripeCheckout && selectedPackage) {
    const bookingDetails = getBookingDetails()
    const nightsBooked = travelDateRange.from && travelDateRange.to 
      ? differenceInDays(travelDateRange.to, travelDateRange.from) 
      : minNights
    const extraNightsCount = selectedPackage.price_per_extra_night 
      ? Math.max(0, nightsBooked - minNights) 
      : 0
    
    return (
      <div className="w-full max-w-2xl mx-auto">
        <StripeCheckout
          tripId={trip.id}
          tripTitle={trip.title}
          packageId={selectedPackage.id}
          packageName={`${getLocalizedField(selectedPackage, 'name', locale as any)} - ${bookingDetails.roomType}`}
          packagePrice={calculateTotal()}
          basePrice={selectedPackage.price}
          extraNights={extraNightsCount}
          extraNightPrice={selectedPackage.price_per_extra_night || 0}
          startDate={bookingDetails.startDate}
          endDate={bookingDetails.endDate}
          roomType={bookingDetails.roomType}
          golfCourses={bookingDetails.golfCourses}
          mealOption={bookingDetails.mealOption}
          transportOption={bookingDetails.transportOption}
          additionalRequests={additionalRequests}
          prefillName={profile?.display_name || ''}
          prefillEmail={profile?.email || currentUser?.email || ''}
          prefillPhone={profile?.phone || ''}
          isGuest={!currentUser}
          onBack={() => setShowStripeCheckout(false)}
          onSuccess={() => setBookingSuccess(true)}
        />
      </div>
    )
  }

  return (
    <form onSubmit={handleProceedToPayment} className="w-full">
      <div className="flex flex-col gap-16 lg:flex-row">
        {/* Left Column - Form Sections */}
        <div className="flex-1 space-y-8">
          <h1 className="font-serif text-[40px] font-bold leading-tight text-foreground">
            {t('makeReservation')}
          </h1>

          {/* Section 1: Select Your Plan */}
          <div className="overflow-hidden">
            <SectionHeader number={1} title={t('selectPlan')} />
            <div className="mt-6 space-y-4">
              {packages.map((pkg) => (
                <PlanCard
                  key={pkg.id}
                  pkg={pkg}
                  selected={selectedPlan === pkg.id}
                  onSelect={() => setSelectedPlan(pkg.id)}
                  t={t}
                  locale={locale}
                />
              ))}
            </div>
          </div>

          {/* Section 2: Select Room Type */}
          <div className="overflow-hidden">
            <SectionHeader number={2} title={t('selectRoomType')} />
            <div className="mt-6 space-y-4">
              <RadioOption
                selected={roomType === 'double'}
                onClick={() => setRoomType('double')}
              >
                <div className="flex items-start gap-3">
                  <Users className="mt-0.5 h-5 w-5 text-muted-foreground" />
                  <div>
                    <h3 className="font-serif text-xl font-medium">
                      {t('doubleOccupancy')}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {t('doubleDescription')}
                    </p>
                  </div>
                </div>
              </RadioOption>

              <RadioOption
                selected={roomType === 'single'}
                onClick={() => setRoomType('single')}
              >
                <div className="flex items-start gap-3">
                  <User className="mt-0.5 h-5 w-5 text-muted-foreground" />
                  <div>
                    <h3 className="font-serif text-xl font-medium">
                      {t('singleOccupancy')}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {t('singleDescription')}
                    </p>
                  </div>
                </div>
              </RadioOption>
            </div>
          </div>

          {/* Section 3: Travel Duration */}
          <div className="overflow-hidden">
            <SectionHeader number={3} title={t('travelDuration')} />
            <div className="py-6">
              <div className="mb-1">
                <Label className="text-base font-medium">{t('selectDates')}</Label>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t('selectDatesDescription')}
                </p>
                <p className="mt-1 text-sm text-muted-foreground italic">
                  {t('maximumStay').replace('{days}', String(maxNights))}
                </p>
                {minNights > 1 && (
                  <p className="mt-1 text-sm text-muted-foreground italic">
                    {t('minimumStay').replace('{days}', String(minNights))}
                  </p>
                )}
                {minAdvanceDays > 0 && (
                  <p className="mt-1 text-sm text-muted-foreground italic">
                    {t('advanceBooking').replace('{days}', String(minAdvanceDays)).replace('{date}', format(minDate, 'MMM d, yyyy'))}
                  </p>
                )}
              </div>

              {/* Step indicator */}
              <div className="mt-4 mb-2 flex items-center gap-2">
                <div className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                  selectionStep === 'pick-start' ? 'bg-[#3D5A80] text-white' : 'bg-[#3D5A80]/15 text-[#3D5A80]'
                }`}>
                  {selectionStep !== 'pick-start' ? <Check className="h-3.5 w-3.5" /> : '1'}
                </div>
                <span className={`text-sm ${selectionStep === 'pick-start' ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
                  {t('selectCheckIn')}
                </span>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
                <div className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                  selectionStep === 'pick-end' ? 'bg-[#3D5A80] text-white' : selectionStep === 'complete' ? 'bg-[#3D5A80]/15 text-[#3D5A80]' : 'bg-gray-100 text-muted-foreground'
                }`}>
                  {selectionStep === 'complete' ? <Check className="h-3.5 w-3.5" /> : '2'}
                </div>
                <span className={`text-sm ${selectionStep === 'pick-end' ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
                  {t('selectCheckOut')}
                </span>
              </div>

              <div className="flex flex-col gap-4 lg:flex-row">
                {renderCalendar()}

                {/* Legend & summary side panel */}
                <div className="flex flex-col gap-4 lg:w-48 shrink-0">
                  <div className="border border-border bg-white p-4 space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('legend')}</p>
                    <div className="flex items-center gap-2.5">
                      <div className="h-5 w-5 rounded-sm bg-[#14184E]" />
                      <span className="text-sm">{t('checkInOut')}</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <div className="h-5 w-5 rounded-sm bg-[#3D5A80]/20 border border-[#3D5A80]/30" />
                      <span className="text-sm">{t('travelDays')}</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <div className="relative h-5 w-5 rounded-sm border border-gray-200 flex items-center justify-center">
                        <span className="h-1 w-1 rounded-full bg-[#3D5A80]" />
                      </div>
                      <span className="text-sm">{t('today')}</span>
                    </div>
                  </div>

                  {/* Check-in / Check-out display */}
                  <div className="border border-border bg-white p-4 space-y-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('checkIn')}</p>
                      <p className="font-serif text-base font-medium mt-0.5">
                        {travelDateRange.from ? format(travelDateRange.from, 'EEE, MMM d, yyyy') : '—'}
                      </p>
                    </div>
                    <div className="border-t border-border pt-2">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('checkOut')}</p>
                      <p className="font-serif text-base font-medium mt-0.5">
                        {travelDateRange.to ? format(travelDateRange.to, 'EEE, MMM d, yyyy') : '—'}
                      </p>
                    </div>
                    {travelDateRange.from && travelDateRange.to && (
                      <div className="border-t border-border pt-2">
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('duration')}</p>
                        <p className="font-serif text-base font-medium mt-0.5">
                          {differenceInDays(travelDateRange.to, travelDateRange.from)} {t('nights')}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Clear dates */}
                  {travelDateRange.from && (
                    <button
                      type="button"
                      onClick={() => setTravelDateRange({ from: undefined, to: undefined })}
                      className="flex items-center justify-center gap-1.5 border border-gray-200 bg-white px-3 py-2 text-sm text-muted-foreground hover:bg-gray-50 hover:text-foreground transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                      {t('clearDates')}
                    </button>
                  )}
                </div>
              </div>

              {travelDateRange.from && travelDateRange.to && (
                <div className="mt-4 border-2 border-[#3D5A80]/20 bg-[#3D5A80]/5 px-6 py-3 w-fit">
                  <span className="text-sm">
                    {t('reservationFor')}{' '}
                    <strong className="font-serif">
                      {format(travelDateRange.from, 'MMM d')} –{' '}
                      {format(travelDateRange.to, 'MMM d, yyyy')}
                    </strong>
                    <span className="text-muted-foreground ml-2">
                      ({differenceInDays(travelDateRange.to, travelDateRange.from)} {t('nights')})
                    </span>
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Section 4: Golf Courses & Rounds */}
          {golfCourses.length > 0 && (
            <div className="overflow-hidden">
              <SectionHeader number={4} title={t('golfCoursesRounds')} />
              <div className="py-6">
                <div className="mb-4">
                  <Label className="text-base font-medium">
                    {t('selectCourses')}
                  </Label>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t('selectCoursesDescription')}
                  </p>
                </div>

                <div className="mb-6 space-y-3">
                  {golfCourses.map((course: any) => {
                    const isSelected = (courseRounds[course.id] || 0) > 0
                    const rounds = courseRounds[course.id] || 0
                    const maxRounds = course.max_rounds
                    return (
                      <div
                        key={course.id}
                        onClick={() => {
                          if (isSelected) {
                            setCourseRounds((prev) => {
                              const next = { ...prev }
                              delete next[course.id]
                              return next
                            })
                            return
                          }

                          handleCourseRoundChange(course.id, 1, maxRounds)
                        }}
                        className={`cursor-pointer border-2 px-6 py-4 transition-colors ${
                          isSelected
                            ? 'border-[#3D5A80]'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-4">
                          <span className="font-serif text-lg font-medium">
                            {getLocalizedField(course, 'course_name', locale as any)}
                          </span>

                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                handleCourseRoundChange(
                                  course.id,
                                  -1,
                                  maxRounds,
                                )
                              }}
                              className="flex h-9 w-9 items-center justify-center border-2 border-gray-200 hover:bg-gray-50"
                              aria-label={`Decrease rounds for ${course.course_name}`}
                            >
                              <Minus className="h-4 w-4" />
                            </button>

                            <span className="flex h-9 w-10 items-center justify-center border-y-2 border-gray-200 text-base font-medium">
                              {rounds}
                            </span>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                handleCourseRoundChange(course.id, 1, maxRounds)
                              }}
                              className="flex h-9 w-9 items-center justify-center border-2 border-gray-200 hover:bg-gray-50"
                              aria-label={`Increase rounds for ${course.course_name}`}
                            >
                              <Plus className="h-4 w-4" />
                            </button>

                            <div
                              className={`flex h-6 w-6 items-center justify-center border-2 ${
                                isSelected
                                  ? 'border-[#3D5A80] bg-[#3D5A80]'
                                  : 'border-gray-300'
                              }`}
                            >
                              {isSelected && (
                                <div className="h-2.5 w-2.5 bg-white" />
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="mt-2 flex gap-4 text-sm text-muted-foreground">
                          {course.num_holes && (
                            <span>{course.num_holes} {t('holes')}</span>
                          )}
                          {typeof maxRounds === 'number' && maxRounds > 0 && (
                            <span>{t('maxRounds')} {maxRounds}</span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div className="mt-4 border-2 border-gray-200 bg-gray-50 px-6 py-3">
                  <span className="text-sm">
                    {t('numberOfRounds')} {totalRounds}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Section 5: Meals */}
          {mealOptions.length > 0 && (
            <div className="overflow-hidden">
              <SectionHeader number={5} title={t('meals')} />
              <div className="mt-6 space-y-4">
                {mealOptions.map((meal: any) => (
                  <RadioOption
                    key={meal.id}
                    selected={
                      includedMealIds.length > 0
                        ? includedMealIds.includes(String(meal.id))
                        : selectedMeal === String(meal.id)
                    }
                    disabled={includedMealIds.length > 0}
                    onClick={() => setSelectedMeal(String(meal.id))}
                  >
                    <div className="flex items-center gap-3">
                      {meal.is_included && (
                        <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3.5 py-1.5 text-sm font-semibold text-emerald-700">
                          <Check className="h-4 w-4 stroke-[3]" />
                          {t('included')}
                        </span>
                      )}
                      <span className="font-serif text-lg font-medium">
                        {getLocalizedField(meal, 'name', locale as any)}
                      </span>
                    </div>
                  </RadioOption>
                ))}
              </div>
            </div>
          )}

          {/* Section 6: Transportation */}
          {transportationOptions.length > 0 && (
            <div className="overflow-hidden">
              <SectionHeader number={6} title={t('transportation')} />
              <div className="mt-6 space-y-4">
                {transportationOptions.map((transport: any) => (
                  <RadioOption
                    key={transport.id}
                    selected={
                      includedTransportIds.length > 0
                        ? includedTransportIds.includes(String(transport.id))
                        : selectedTransport === String(transport.id)
                    }
                    disabled={includedTransportIds.length > 0}
                    onClick={() => setSelectedTransport(String(transport.id))}
                  >
                    <div className="flex items-center gap-3">
                      {transport.is_included && (
                        <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3.5 py-1.5 text-sm font-semibold text-emerald-700">
                          <Check className="h-4 w-4 stroke-[3]" />
                          {t('included')}
                        </span>
                      )}
                      <span className="font-serif text-lg font-medium">
                        {getLocalizedField(transport, 'name', locale as any)}
                      </span>
                    </div>
                  </RadioOption>
                ))}
              </div>
            </div>
          )}

          {/* Section 7/8: Service Options */}
          {serviceOptions.length > 0 && (
            <div className="overflow-hidden">
              <SectionHeader number={7} title={t('additionalServices')} />
              <div className="py-6">
                <div className="space-y-4">
                  {serviceOptions.map((service: any) => {
                    const id = String(service.id)
                    const isIncluded = !!service.is_included
                    const isSelected =
                      isIncluded || selectedServiceIds.includes(id)

                    return (
                      <RadioOption
                        key={service.id || service.name}
                        selected={isSelected}
                        disabled={isIncluded}
                        onClick={() => toggleService(id)}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            {isIncluded && (
                              <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3.5 py-1.5 text-sm font-semibold text-emerald-700">
                                <Check className="h-4 w-4 stroke-[3]" />
                                {t('included')}
                              </span>
                            )}
                            <span className="font-serif text-lg font-medium">{getLocalizedField(service, 'name', locale as any)}</span>
                          </div>
                          {service.description && (
                            <p className="mt-1 text-sm text-muted-foreground">
                              {getLocalizedField(service, 'description', locale as any)}
                            </p>
                          )}
                        </div>
                      </RadioOption>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Section 7 or 8: Additional Requests */}
          <div className="overflow-hidden">
            <SectionHeader
              number={additionalRequestsSectionNumber}
              title={t('additionalRequests')}
            />
            <div className="py-6">
              <Label className="text-base font-medium">{t('additionalRequestsLabel')}</Label>
              <Textarea
                value={additionalRequests}
                onChange={(e) => setAdditionalRequests(e.target.value)}
                placeholder={t('additionalRequestsPlaceholder')}
                className="min-h-[100px] border-2 border-gray-200 bg-gray-50 mt-2"
              />
            </div>
          </div>
        </div>

        {/* Right Column - Confirmation Sidebar */}
        <div className="lg:w-80">
          <div className="sticky top-24">
            {/* Confirmation Card */}
            <div className="border border-x-3 border-b-3 border-[#3D5A80]">
              <div className="relative flex">
                <div className="absolute left-[-3px] top-0 h-[45px] w-[48px] bg-[#14184E] z-10" />
                <div className="flex-1 bg-[#3D5A80] px-4 h-[45px] flex items-center pl-[60px]">
                  <h3 className="font-serif text-lg text-white">
                    {t('bookingSummary')}
                  </h3>
                </div>
              </div>
              <div className="bg-white p-5">
                <div className="space-y-3 text-sm">
                  {travelDateRange.from && travelDateRange.to && (
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">
                        {t('reservationFor')} {format(travelDateRange.from, 'MMM d')}{' '}
                        – {format(travelDateRange.to, 'MMM d')}
                      </span>
                      <Check className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}

                  {roomType && (
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">
                        {roomType === 'single'
                          ? t('singleOccupancy')
                          : t('doubleOccupancy')}
                      </span>
                      <Check className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}

                  {Object.entries(courseRounds)
                    .filter(([_, rounds]) => rounds > 0)
                    .map(([courseId, rounds]) => {
                      const course = golfCourses.find(
                        (c: any) => c.id === courseId,
                      )
                      return course ? (
                        <div key={courseId} className="flex items-center gap-2">
                          <span className="text-muted-foreground">
                            {getLocalizedField(course, 'course_name', locale as any)}{course.num_holes ? ` (${course.num_holes} holes)` : ''}
                          </span>
                          <Check className="h-4 w-4 text-muted-foreground" />
                        </div>
                      ) : null
                    })}

                  {totalRounds > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">
                        {totalRounds} {t('rounds')}
                      </span>
                      <Check className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}

                  {selectedTransportOption && (
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">
                        {getLocalizedField(selectedTransportOption, 'name', locale as any)}
                      </span>
                      <Check className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}

                  {selectedMealOption && (
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">
                        {getLocalizedField(selectedMealOption, 'name', locale as any)}
                      </span>
                      <Check className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}

                  {includedServices.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">
                        {t('includedServices')}:{' '}
                        {includedServices
                          .map((service: any) => getLocalizedField(service, 'name', locale as any))
                          .join(', ')}
                      </span>
                      <Check className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-4">
                  {(() => {
                    const selectedPackage = packages.find((p: any) => p.id === selectedPlan)
                    const hasExtraNights = selectedPackage?.price_per_extra_night && travelDateRange.from && travelDateRange.to
                    const nightsBooked = hasExtraNights ? differenceInDays(travelDateRange.to, travelDateRange.from) : 0
                    const extraNights = hasExtraNights ? Math.max(0, nightsBooked - minNights) : 0
                    const extraNightsCost = extraNights * Number(selectedPackage?.price_per_extra_night || 0)
                    
                    return (
                      <>
                        {hasExtraNights && extraNights > 0 && (
                          <div className="text-sm space-y-1 mb-2 pb-2 border-b border-border">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">{t('basePrice')}</span>
                              <span>${selectedPackage.price}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">
                                {t('extraNightsCost')
                                  .replace('{nights}', String(extraNights))
                                  .replace('{price}', String(selectedPackage.price_per_extra_night))}
                              </span>
                              <span>${extraNightsCost.toFixed(2)}</span>
                            </div>
                          </div>
                        )}
                        <div className="flex items-baseline gap-1 font-serif text-xl">
                          <span>{t('total')}:</span>
                          <span>${calculateTotal()}</span>
                        </div>
                      </>
                    )
                  })()}
                  <div className="text-sm text-muted-foreground mt-1">
                    {t('depositDue')} ${(calculateTotal() * 0.3).toFixed(2)}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!selectedPlan || !roomType || !travelDateRange.from || !travelDateRange.to}
                  className="mt-4 w-full text-xl bg-[#14184E] py-3 font-medium text-white transition-colors hover:bg-[#0d0f38] disabled:opacity-50"
                >
                  {t('proceedToPayment')}
                </button>
              </div>
            </div>

            {/* Trip Images */}
            {tripImages.length > 0 && (
              <div className="mt-6">
                <div className="flex gap-3">
                  {/* Main large image */}
                  <div className="relative aspect-[4/3] flex-1 overflow-hidden">
                    <Image
                      src={tripImages[0]?.image_url || '/placeholder.svg'}
                      alt={trip.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  {/* Stacked thumbnails on the right */}
                  {tripImages.length > 1 && (
                    <div className="flex w-20 flex-col gap-3">
                      {tripImages.slice(1, 3).map((img, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            if (idx === 1 && tripImages.length > 2) {
                              setGalleryIndex(0)
                              setGalleryOpen(true)
                            }
                          }}
                          className="relative aspect-square w-full overflow-hidden"
                        >
                          <Image
                            src={img.image_url || '/placeholder.svg'}
                            alt={`${trip.title} ${idx + 2}`}
                            fill
                            className="object-cover"
                          />
                          {idx === 1 && tripImages.length > 2 && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                              <span className="text-sm font-medium text-white">
                                + {tripImages.length - 2} Photos
                              </span>
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="mt-4">
                  <p className="text-sm italic text-muted-foreground">
                    {roomType === 'single'
                      ? t('singleOccupancy')
                      : t('doubleOccupancy')}
                  </p>
                  <p className="font-serif text-lg font-medium">
                    {getLocalizedField(trip, 'location', locale as any)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {galleryOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setGalleryOpen(false)}
        >
          <div
            className="relative h-full w-full flex items-center justify-center p-4 sm:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              type="button"
              onClick={() => setGalleryOpen(false)}
              className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition-all hover:bg-white/20 hover:scale-110 sm:right-8 sm:top-8"
              aria-label="Close gallery"
            >
              <X className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>

            {/* Main image container */}
            <div className="relative w-full max-w-6xl">
              <div className="relative aspect-[16/10] w-full overflow-hidden rounded-lg shadow-2xl">
                <Image
                  src={
                    tripImages[galleryIndex]?.image_url || '/placeholder.svg'
                  }
                  alt={`${trip.title} ${galleryIndex + 1}`}
                  fill
                  className="object-contain"
                  priority
                />
              </div>

              {/* Navigation arrows */}
              {tripImages.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setGalleryIndex((prev) =>
                        prev === 0 ? tripImages.length - 1 : prev - 1,
                      )
                    }
                    className="absolute left-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition-all hover:bg-white/20 hover:scale-110 sm:left-4 sm:h-12 sm:w-12"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setGalleryIndex((prev) =>
                        prev === tripImages.length - 1 ? 0 : prev + 1,
                      )
                    }
                    className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition-all hover:bg-white/20 hover:scale-110 sm:right-4 sm:h-12 sm:w-12"
                    aria-label="Next image"
                  >
                    <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
                  </button>
                </>
              )}

              {/* Image counter and title */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4 sm:p-6">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-sm text-white/80 sm:text-base">
                      {trip.title}
                    </p>
                    <p className="text-xs text-white/60 sm:text-sm">
                      {trip.location}
                    </p>
                  </div>
                  <div className="rounded-full bg-black/40 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm sm:px-4 sm:py-2 sm:text-sm">
                    {galleryIndex + 1} / {tripImages.length}
                  </div>
                </div>
              </div>

              {/* Thumbnail strip for desktop */}
              {tripImages.length > 1 && (
                <div className="mt-4 hidden sm:flex gap-2 justify-center overflow-x-auto pb-2">
                  {tripImages.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setGalleryIndex(idx)}
                      className={`relative h-16 w-24 flex-shrink-0 overflow-hidden rounded transition-all ${
                        idx === galleryIndex
                          ? 'ring-2 ring-white ring-offset-2 ring-offset-black/50 scale-105'
                          : 'opacity-60 hover:opacity-100'
                      }`}
                    >
                      <Image
                        src={img.image_url || '/placeholder.svg'}
                        alt={`Thumbnail ${idx + 1}`}
                        fill
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </form>
  )
}
