import { SiteHeaderWrapper } from '@/components/site-header-wrapper'
import { SiteFooter } from '@/components/site-footer'
import { AnimatedButton } from '@/components/ui/animated-button'
import { AnimatedHr } from '@/components/ui/animated-hr'
import {
  TripImageGallery,
  RoomImageSection,
} from '@/components/trip-image-gallery'
import { PaymentConsent } from '@/components/payment-consent'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { format } from 'date-fns'
import { Calendar, DollarSign, Clock, User, Mail, Phone } from 'lucide-react'
import type { Metadata } from 'next'

// Prevent indexing of private package pages
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
    },
  },
}

interface PackagePageProps {
  params: Promise<{ id: string }>
}

export default async function PrivatePackagePage({ params }: PackagePageProps) {
  const { id } = await params
  const supabase = await createClient()

  // Fetch the custom package inquiry
  const { data: inquiry, error } = await supabase
    .from('inquiries')
    .select('*')
    .eq('id', id)
    .eq('is_custom_package', true)
    .single()

  if (error || !inquiry) {
    notFound()
  }

  // Fetch the linked trip with all relations (if it exists)
  let trip: any = null
  if (inquiry.trip_id) {
    const { data: tripData } = await supabase
      .from('trips')
      .select(
        `
        *,
        packages(id, name, description, price, price_per_extra_night),
        trip_images(id, image_url, display_order),
        trip_golf_courses(id, course_name, max_rounds, num_holes, description),
        trip_meal_options(id, name, description, is_included),
        trip_transportation_options(id, name, description, is_included),
        trip_service_options(id, name, description, is_included)
      `,
      )
      .eq('id', inquiry.trip_id)
      .single()

    trip = tripData
  }

  const isPaid = inquiry.status === 'paid' || inquiry.status === 'completed'
  const configuredDepositPercentage = inquiry.deposit_percentage || 100
  const totalPrice = inquiry.total_price || 0
  const depositAmount = (totalPrice * configuredDepositPercentage) / 100
  const remainderAmount = totalPrice - depositAmount

  // Determine if we should show payment options (deposit vs full)
  // Only show options when deposit percentage is less than 100%
  const showPaymentOptions = configuredDepositPercentage < 100 && !isPaid

  // Trip data
  const mainImage = trip?.courses_photo_url || null
  const tripImages =
    trip?.trip_images?.sort(
      (a: any, b: any) => a.display_order - b.display_order,
    ) || []
  const additionalImages =
    tripImages.length > 0 ? tripImages.map((img: any) => img.image_url) : []
  const roomImage = trip?.room_photo_url || null
  const tripTitle = trip?.title || inquiry.trip_title
  const tripLocation = trip?.location || null
  const tripOverview =
    trip?.overview_content ||
    trip?.description ||
    inquiry.custom_package_description ||
    ''
  const tripRefundPolicy = trip?.refund_policy || null
  const tripHighlights: string[] = trip?.highlights || []
  const tripPackages = trip?.packages || []

  // Payment section JSX (shared between mobile and desktop)
  const paymentSection = (
    <div className="space-y-4">
      {/* Payment Options Description - show when options are available */}
      {showPaymentOptions && (
        <p className="text-sm text-muted-foreground">
          Choose to pay a {configuredDepositPercentage}% deposit now or the full
          amount.
        </p>
      )}

      {/* Compliance consent (SMS opt-in + Terms/Privacy). Both are
          optional — they do not gate the Pay button — but must be
          presented per carrier compliance requirements. */}
      {!isPaid && <PaymentConsent />}

      {/* Deposit Payment Option */}
      {showPaymentOptions && (
        <div
          className="group flex flex-col gap-4 border-l-[3px] py-4 pl-5 pr-2 transition-colors"
          style={{ borderColor: '#274C77' }}
        >
          <div className="flex-1">
            <h3 className="font-serif text-lg font-bold text-foreground sm:text-xl">
              {configuredDepositPercentage}% Deposit
            </h3>
            <p className="mt-1 text-2xl font-bold text-foreground sm:text-3xl">
              $
              {depositAmount.toLocaleString('en-US', {
                minimumFractionDigits: 2,
              })}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Remaining $
              {remainderAmount.toLocaleString('en-US', {
                minimumFractionDigits: 2,
              })}{' '}
              due later
            </p>
          </div>

          {inquiry.payment_link ? (
            <a href={inquiry.payment_link} className="shrink-0">
              <AnimatedButton
                startColor="#274C77"
                endColor="#1a3a5c"
                hoverText="Let's Go!"
                className="w-full sm:w-auto sm:px-8"
              >
                Pay Deposit
              </AnimatedButton>
            </a>
          ) : (
            <div className="rounded-lg bg-amber-50 p-4 text-center">
              <p className="font-semibold text-amber-700">
                Payment Link Pending
              </p>
              <p className="mt-1 text-sm text-amber-600">
                A payment link will be sent to you shortly.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Full Payment Option */}
      {showPaymentOptions && (
        <div
          className="group flex flex-col gap-4 border-l-[3px] py-4 pl-5 pr-2 transition-colors"
          style={{ borderColor: '#6096BA' }}
        >
          <div className="flex-1">
            <h3 className="font-serif text-lg font-bold text-foreground sm:text-xl">
              Full Payment
            </h3>
            <p className="mt-1 text-2xl font-bold text-foreground sm:text-3xl">
              $
              {totalPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Pay the complete package price today
            </p>
          </div>

          {inquiry.remainder_payment_link ? (
            <a href={inquiry.remainder_payment_link} className="shrink-0">
              <AnimatedButton
                startColor="#6096BA"
                endColor="#4a7a9e"
                hoverText="Let's Go!"
                className="w-full sm:w-auto sm:px-8"
              >
                Pay Full Amount
              </AnimatedButton>
            </a>
          ) : (
            <div className="rounded-lg bg-muted p-4 text-center">
              <p className="font-semibold text-muted-foreground">
                Full Payment Link Pending
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Contact us to pay the full amount.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Single Payment Option - show when no options or 100% deposit or paid */}
      {!showPaymentOptions && (
        <div
          className="group flex flex-col gap-4 border-l-[3px] py-4 pl-5 pr-2 transition-colors"
          style={{ borderColor: '#274C77' }}
        >
          <div className="flex-1">
            <h3 className="font-serif text-lg font-bold text-foreground sm:text-xl">
              {configuredDepositPercentage === 100
                ? 'Full Payment'
                : `${configuredDepositPercentage}% Deposit`}
            </h3>
            <p className="mt-1 text-2xl font-bold text-foreground sm:text-3xl">
              $
              {depositAmount.toLocaleString('en-US', {
                minimumFractionDigits: 2,
              })}
            </p>
            {configuredDepositPercentage < 100 && (
              <p className="mt-1 text-sm text-muted-foreground">
                Total: $
                {totalPrice.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                })}
              </p>
            )}
          </div>

          {isPaid ? (
            <div className="rounded-lg bg-emerald-50 p-4 text-center">
              <DollarSign className="mx-auto h-8 w-8 text-emerald-600" />
              <p className="mt-2 font-semibold text-emerald-700">
                Payment Complete
              </p>
              <p className="mt-1 text-sm text-emerald-600">
                Thank you for your payment!
              </p>
            </div>
          ) : inquiry.payment_link ? (
            <a href={inquiry.payment_link} className="shrink-0">
              <AnimatedButton
                startColor="#274C77"
                endColor="#1a3a5c"
                hoverText="Let's Go!"
                className="w-full sm:w-auto sm:px-8"
              >
                Pay Now
              </AnimatedButton>
            </a>
          ) : (
            <div className="rounded-lg bg-amber-50 p-4 text-center">
              <p className="font-semibold text-amber-700">
                Payment Link Pending
              </p>
              <p className="mt-1 text-sm text-amber-600">
                A payment link will be sent to you shortly.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Remainder Info - only show after deposit is paid and there's a remainder */}
      {configuredDepositPercentage < 100 && isPaid && remainderAmount > 0 && (
        <div
          className="group flex flex-col gap-2 border-l-[3px] py-4 pl-5 pr-2 transition-colors"
          style={{ borderColor: '#6096BA' }}
        >
          <div className="flex-1">
            <h3 className="font-serif text-lg font-bold text-foreground sm:text-xl">
              Remainder Due
            </h3>
            <p className="mt-1 text-2xl font-bold text-foreground sm:text-3xl">
              $
              {remainderAmount.toLocaleString('en-US', {
                minimumFractionDigits: 2,
              })}
            </p>
            {inquiry.remainder_due_date && (
              <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>
                  Due by{' '}
                  {format(new Date(inquiry.remainder_due_date), 'MMMM d, yyyy')}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )

  return (
    <div className="min-h-screen bg-background">
      <SiteHeaderWrapper />

      {/* Hero Section */}
      <section className="relative h-[50vh] sm:h-[60vh] md:h-[70vh] w-full">
        {mainImage ? (
          <img
            src={mainImage}
            alt={tripTitle}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#274C77] to-[#6096BA]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        <div className="absolute inset-x-0 top-0 pt-24 sm:pt-28 md:pt-32 lg:pt-36">
          <div className="container px-4 sm:px-6 lg:px-8">
            <p className="text-sm font-medium uppercase tracking-wider text-white/80">
              Custom Package
            </p>
            <h1 className="mt-2 text-2xl font-bold text-white drop-shadow-lg sm:text-3xl md:text-4xl lg:text-5xl">
              {tripTitle}
            </h1>
            {tripLocation && (
              <p className="mt-1 text-sm text-white/90 drop-shadow-lg sm:text-base md:text-lg">
                {tripLocation}
              </p>
            )}
            {inquiry.customer_name && (
              <p className="mt-1 text-sm text-white/80 drop-shadow-lg">
                Prepared for {inquiry.customer_name}
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="container px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-4">
          {/* Right Column - Payment & Images */}
          <div className="order-1 lg:order-2 space-y-8">
            {/* Payment - Desktop Only */}
            <div className="hidden lg:block">
              <h2 className="text-xl font-bold text-foreground sm:text-2xl md:text-3xl">
                Payment
              </h2>
              <div className="mt-2 mb-4">
                <AnimatedHr />
              </div>
              <p className="text-xs text-muted-foreground sm:text-sm md:text-base">
                Review your package details and complete payment below.
              </p>
              <div className="mt-6">{paymentSection}</div>
            </div>

            {/* Course Images Gallery */}
            {additionalImages.length > 0 && (
              <TripImageGallery images={additionalImages} title={tripTitle} />
            )}

            {/* Accommodation Image */}
            {roomImage && (
              <RoomImageSection
                imageUrl={roomImage}
                heading="Accommodation"
                title={tripTitle}
              />
            )}
          </div>

          {/* Left Column - Text Content */}
          <div className="order-2 space-y-8 lg:order-1">
            {/* Overview */}
            <div>
              <h2 className="text-xl font-bold text-foreground sm:text-2xl md:text-3xl">
                Overview
              </h2>
              <div className="mt-2 mb-4">
                <AnimatedHr />
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground sm:text-base lg:text-lg whitespace-pre-wrap">
                {tripOverview ||
                  'Your custom golf package has been prepared. Please review the details and complete your payment to confirm your booking.'}
              </p>
            </div>

            {/* Refund Policy */}
            {tripRefundPolicy && (
              <div>
                <h2 className="text-xl font-bold text-foreground sm:text-2xl md:text-3xl">
                  Refund Policy
                </h2>
                <div className="mt-2 mb-4">
                  <AnimatedHr />
                </div>
                <p className="max-h-[7.5rem] overflow-y-auto text-sm leading-relaxed text-muted-foreground sm:text-base whitespace-pre-wrap">
                  {tripRefundPolicy}
                </p>
              </div>
            )}

            {/* Highlights */}
            {tripHighlights.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-foreground sm:text-2xl md:text-3xl">
                  Highlights
                </h2>
                <div className="mt-2 mb-4">
                  <AnimatedHr />
                </div>
                <ul className="space-y-3">
                  {tripHighlights.map((highlight: string, idx: number) => (
                    <li
                      key={idx}
                      className="flex items-start gap-3 text-sm text-foreground sm:text-base"
                    >
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 bg-foreground" />
                      <span>{highlight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Packages */}
            {tripPackages.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-foreground sm:text-2xl md:text-3xl">
                  Packages
                </h2>
                <div className="mt-2 mb-4">
                  <AnimatedHr />
                </div>
                <div className="space-y-4">
                  {tripPackages.map((pkg: any) => {
                    const isUpgrade = pkg.name === 'Upgrade'
                    return (
                      <div
                        key={pkg.id}
                        className="group flex flex-col gap-4 border-l-[3px] py-4 pl-5 pr-2 transition-colors"
                        style={{
                          borderColor: isUpgrade ? '#274C77' : '#6096BA',
                        }}
                      >
                        <div className="flex-1">
                          <h3 className="font-serif text-lg font-bold text-foreground sm:text-xl">
                            {pkg.name}
                          </h3>
                          <p className="mt-1 text-2xl font-bold text-foreground sm:text-3xl">
                            ${pkg.price?.toFixed(0)}
                          </p>
                          {pkg.description && (
                            <p className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">
                              {pkg.description}
                            </p>
                          )}
                          {pkg.price_per_extra_night && (
                            <p className="mt-1 text-sm text-muted-foreground">
                              +${pkg.price_per_extra_night}/extra night
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Travel Dates */}
            {(inquiry.start_date || inquiry.end_date) && (
              <div>
                <h2 className="text-xl font-bold text-foreground sm:text-2xl md:text-3xl">
                  Travel Dates
                </h2>
                <div className="mt-2 mb-4">
                  <AnimatedHr />
                </div>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3 text-sm text-foreground sm:text-base">
                    <Calendar className="mt-0.5 h-5 w-5 shrink-0 text-[#274C77]" />
                    <span>
                      {inquiry.start_date &&
                        format(new Date(inquiry.start_date), 'MMMM d, yyyy')}
                      {inquiry.start_date && inquiry.end_date && ' - '}
                      {inquiry.end_date &&
                        format(new Date(inquiry.end_date), 'MMMM d, yyyy')}
                    </span>
                  </li>
                </ul>
              </div>
            )}

            {/* Contact Information */}
            <div>
              <h2 className="text-xl font-bold text-foreground sm:text-2xl md:text-3xl">
                Contact Information
              </h2>
              <div className="mt-2 mb-4">
                <AnimatedHr />
              </div>
              <ul className="space-y-3">
                {inquiry.customer_name && (
                  <li className="flex items-start gap-3 text-sm text-foreground sm:text-base">
                    <User className="mt-0.5 h-5 w-5 shrink-0 text-[#274C77]" />
                    <span>{inquiry.customer_name}</span>
                  </li>
                )}
                {inquiry.customer_email && (
                  <li className="flex items-start gap-3 text-sm text-foreground sm:text-base">
                    <Mail className="mt-0.5 h-5 w-5 shrink-0 text-[#274C77]" />
                    <span>{inquiry.customer_email}</span>
                  </li>
                )}
                {inquiry.customer_phone && (
                  <li className="flex items-start gap-3 text-sm text-foreground sm:text-base">
                    <Phone className="mt-0.5 h-5 w-5 shrink-0 text-[#274C77]" />
                    <span>{inquiry.customer_phone}</span>
                  </li>
                )}
              </ul>
            </div>

            {/* Payment - Mobile Only */}
            <div className="lg:hidden">
              <h2 className="text-xl font-bold text-foreground sm:text-2xl md:text-3xl">
                Payment
              </h2>
              <div className="mt-2 mb-4">
                <AnimatedHr />
              </div>
              <p className="text-xs text-muted-foreground sm:text-sm md:text-base">
                Review your package details and complete payment below.
              </p>
              <div className="mt-6">{paymentSection}</div>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}
