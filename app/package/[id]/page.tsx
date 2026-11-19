import { SiteHeaderWrapper } from '@/components/site-header-wrapper'
import { SiteFooter } from '@/components/site-footer'
import { AnimatedButton } from '@/components/ui/animated-button'
import { AnimatedHr } from '@/components/ui/animated-hr'
import {
  TripImageGallery,
  RoomImageSection,
} from '@/components/trip-image-gallery'
import { PaymentConsent } from '@/components/payment-consent'
import { notFound } from 'next/navigation'
import {
  AlertCircle,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Flag,
  Mail,
} from 'lucide-react'
import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { getServerLocale, getServerTranslations } from '@/lib/i18n/server'
import { getLocalizedField } from '@/lib/i18n/get-localized-field'
import { loadCustomPackage, loadCustomTrip } from '@/lib/custom-package-server'
import { getCustomPackageState, type CustomPaymentType } from '@/lib/custom-package'
import { parseCalendarDate } from '@/lib/calendar-date'
import { getSupportEmail } from '@/lib/site-email'
import { cardFeeCents } from '@/lib/booking-price'

// A customer opens this from the SMS link, usually signed out. The inquiry is
// read with the service role (lib/custom-package-server.ts) — the
// unguessable id in the URL is the credential, as with a Stripe link. Reading
// it with the visitor's session (as before) returned nothing for anyone but
// admins, so every customer got a 404.

const ROBOTS: Metadata['robots'] = {
  index: false,
  follow: false,
  nocache: true,
  googleBot: { index: false, follow: false },
}

interface PackagePageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string }>
}

export async function generateMetadata({
  params,
}: PackagePageProps): Promise<Metadata> {
  const { id } = await params
  const data = await loadCustomPackage(id)
  if (!data) return { robots: ROBOTS }
  const locale = await getServerLocale()
  const trip = await loadCustomTrip(data.inquiry.trip_id)
  const title =
    (trip ? (getLocalizedField(trip, 'title', locale) as string) : '') ||
    data.inquiry.trip_title ||
    'Custom Package'
  return { title: `${title} | 4 Seasons Golf Tour`, robots: ROBOTS }
}

function formatMoney(cents: number) {
  return `$${(cents / 100).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

const ERROR_KEYS: Record<string, string> = {
  already_paid: 'errorAlreadyPaid',
  not_available: 'errorNotAvailable',
  invalid_request: 'errorNotAvailable',
  checkout_failed: 'errorCheckoutFailed',
}

export default async function PrivatePackagePage({
  params,
  searchParams,
}: PackagePageProps) {
  const { id } = await params
  const { error: errorCode } = await searchParams
  const data = await loadCustomPackage(id)
  if (!data) notFound()

  const { inquiry, bookings } = data
  const locale = await getServerLocale()
  const t = await getServerTranslations('customPackage')
  const trip = await loadCustomTrip(inquiry.trip_id)
  const state = getCustomPackageState(inquiry, bookings)

  const dateFormat = new Intl.DateTimeFormat(
    locale === 'ko' ? 'ko-KR' : locale === 'de' ? 'de-DE' : 'en-US',
    { year: 'numeric', month: 'long', day: 'numeric' },
  )
  const formatDate = (value: string) => dateFormat.format(parseCalendarDate(value))
  const localized = (row: any, field: string) =>
    (getLocalizedField(row, field, locale) as string) || row?.[field] || ''

  // ── Trip content, in the visitor's language with English fallback ──
  const tripTitle = (trip && localized(trip, 'title')) || inquiry.trip_title || ''
  const tripLocation = trip ? localized(trip, 'location') : ''
  const tripOverview =
    (trip && (localized(trip, 'overview_content') || localized(trip, 'description'))) ||
    inquiry.custom_package_description ||
    ''
  const refundPolicy = trip ? localized(trip, 'refund_policy') : ''
  const highlights: string[] = trip
    ? ((getLocalizedField(trip, 'highlights', locale, true) as string[]) || [])
    : []
  const mainImage = trip?.courses_photo_url || null
  const galleryImages: string[] = (trip?.trip_images || [])
    .sort((a: any, b: any) => (a.display_order ?? 0) - (b.display_order ?? 0))
    .map((img: any) => img.image_url)
  const roomImage = trip?.room_photo_url || null

  // ── What's included: the only place a custom-package customer sees the
  //    courses, meals, transport and services the admin put together ──
  const packageDetails: { name: string; description: string }[] = (
    trip?.packages || []
  )
    .map((pkg: any) => ({
      name: localized(pkg, 'name'),
      description: localized(pkg, 'description'),
    }))
    .filter((pkg: { description: string }) => pkg.description)
  const golfCourses = (trip?.trip_golf_courses || []).map((course: any) => ({
    id: course.id,
    name: localized(course, 'course_name'),
    description: localized(course, 'description'),
    holes: course.num_holes,
    rounds: course.max_rounds,
  }))
  const optionGroups = [
    { key: 'meals', rows: trip?.trip_meal_options || [] },
    { key: 'transportation', rows: trip?.trip_transportation_options || [] },
    { key: 'services', rows: trip?.trip_service_options || [] },
  ].map((group) => ({
    key: group.key,
    included: group.rows.filter((r: any) => r.is_included),
    onRequest: group.rows.filter((r: any) => !r.is_included),
  }))
  const hasIncluded =
    packageDetails.length > 0 ||
    golfCourses.length > 0 ||
    optionGroups.some((g) => g.included.length > 0)
  const onRequest = optionGroups.flatMap((g) => g.onRequest)

  const nights =
    inquiry.start_date && inquiry.end_date
      ? Math.round(
          (parseCalendarDate(inquiry.end_date).getTime() -
            parseCalendarDate(inquiry.start_date).getTime()) /
            86_400_000,
        )
      : null

  const supportEmail = getSupportEmail(inquiry.site_url)
  const errorKey = errorCode ? ERROR_KEYS[errorCode] : undefined

  // ── Payment ─────────────────────────────────────────────────────────
  const remainingAfterDeposit = state.totalCents - state.depositCents
  const payForm = (
    type: CustomPaymentType,
    method: 'ach' | 'card',
    label: string,
    colors: { start: string; end: string },
  ) => (
    // A plain form POST: works without JavaScript, and the route creates a
    // fresh Stripe session from today's price, then redirects to it.
    <form action={`/api/package/${id}/checkout`} method="post" className="shrink-0">
      <input type="hidden" name="type" value={type} />
      <input type="hidden" name="method" value={method} />
      <AnimatedButton
        type="submit"
        startColor={colors.start}
        endColor={colors.end}
        hoverText={t('letsGo')}
        className="w-full sm:w-auto sm:px-8"
      >
        {label}
      </AnimatedButton>
    </form>
  )
  // One button per method: a card payment adds the card processing fee
  // (lib/booking-price.ts), so the customer sees both totals before choosing.
  const payButtons = (
    type: CustomPaymentType,
    amountCents: number,
    colors: { start: string; end: string },
  ) => (
    <div className="space-y-2">
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {payForm(type, 'ach', t('payByBank', { amount: formatMoney(amountCents) }), colors)}
        {payForm(
          type,
          'card',
          t('payByCard', { amount: formatMoney(amountCents + cardFeeCents(amountCents)) }),
          colors,
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        {t('cardFeeNote', { fee: formatMoney(cardFeeCents(amountCents)) })}
      </p>
    </div>
  )

  const optionBlock = (
    borderColor: string,
    title: string,
    amount: string,
    note: string | null,
    action: ReactNode,
  ) => (
    <div
      className="group flex flex-col gap-4 border-l-[3px] py-4 pl-5 pr-2 transition-colors"
      style={{ borderColor }}
    >
      <div className="flex-1">
        <h3 className="font-serif text-lg font-bold text-foreground sm:text-xl">
          {title}
        </h3>
        <p className="mt-1 text-2xl font-bold text-foreground sm:text-3xl">
          {amount}
        </p>
        {note && <p className="mt-1 text-sm text-muted-foreground">{note}</p>}
      </div>
      {action}
    </div>
  )

  const statusPanel = (
    tone: 'success' | 'info',
    title: string,
    message: string,
  ) => (
    <div
      className={`rounded-lg p-4 ${
        tone === 'success' ? 'bg-emerald-50 text-emerald-800' : 'bg-muted text-foreground'
      }`}
    >
      <div className="flex items-start gap-3">
        <CheckCircle2
          className={`mt-0.5 h-5 w-5 shrink-0 ${
            tone === 'success' ? 'text-emerald-600' : 'text-[#274C77]'
          }`}
        />
        <div>
          <p className="font-semibold">{title}</p>
          <p className="mt-1 text-sm opacity-90">{message}</p>
        </div>
      </div>
    </div>
  )

  const paymentSection = (
    <div className="space-y-4">
      {errorKey && (
        <div
          role="alert"
          className="flex gap-3 rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <p>{t(errorKey)}</p>
        </div>
      )}

      {state.stage === 'unpaid' && (
        <>
          {state.depositPercentage < 100 && (
            <p className="text-sm text-muted-foreground">
              {t('chooseOption', { percentage: state.depositPercentage })}
            </p>
          )}
          {/* Compliance consent (SMS opt-in + Terms/Privacy). Optional — it
              does not gate payment — but must be presented. */}
          <PaymentConsent />
          {state.depositPercentage < 100 &&
            optionBlock(
              '#274C77',
              t('depositTitle', { percentage: state.depositPercentage }),
              formatMoney(state.depositCents),
              inquiry.remainder_due_date
                ? t('remainingDueBy', {
                    amount: formatMoney(remainingAfterDeposit),
                    date: formatDate(inquiry.remainder_due_date),
                  })
                : t('remainingLater', { amount: formatMoney(remainingAfterDeposit) }),
              payButtons('deposit', state.depositCents, { start: '#274C77', end: '#1a3a5c' }),
            )}
          {optionBlock(
            state.depositPercentage < 100 ? '#6096BA' : '#274C77',
            t('fullTitle'),
            formatMoney(state.totalCents),
            t('fullDescription'),
            payButtons(
              'full',
              state.totalCents,
              state.depositPercentage < 100
                ? { start: '#6096BA', end: '#4a7a9e' }
                : { start: '#274C77', end: '#1a3a5c' },
            ),
          )}
        </>
      )}

      {state.stage === 'deposit_paid' && (
        <>
          {statusPanel(
            'success',
            t('depositReceived'),
            state.legacy
              ? t('depositReceivedLegacy')
              : t('paidSoFar', { amount: formatMoney(state.paidCents) }),
          )}
          {optionBlock(
            '#6096BA',
            t('balanceTitle'),
            formatMoney(state.remainingCents),
            state.balanceProcessing
              ? t('balanceProcessing')
              : state.autoChargeDate
              ? t('balanceAutoCharge', { date: formatDate(state.autoChargeDate) })
              : inquiry.remainder_due_date
                ? t('balanceDueBy', { date: formatDate(inquiry.remainder_due_date) })
                : null,
            state.allowed.includes('remainder')
              ? payButtons('remainder', state.remainingCents, { start: '#6096BA', end: '#4a7a9e' })
              : null,
          )}
        </>
      )}

      {state.stage === 'paid' &&
        statusPanel('success', t('paidInFull'), t('paidInFullMessage'))}

      {state.stage === 'cancelled' &&
        statusPanel('info', t('packageCancelled'), t('packageCancelledMessage'))}

      {state.stage === 'processing' &&
        statusPanel('info', t('paymentProcessing'), t('paymentProcessingMessage'))}

      {(state.stage === 'unpaid' || state.allowed.length > 0) && (
        <p className="text-xs text-muted-foreground">{t('secureNote')}</p>
      )}
    </div>
  )

  const sectionHeading = (title: string) => (
    <>
      <h2 className="text-xl font-bold text-foreground sm:text-2xl md:text-3xl">
        {title}
      </h2>
      <div className="mt-2 mb-4">
        <AnimatedHr />
      </div>
    </>
  )

  const paymentBlock = (
    <>
      {sectionHeading(t('paymentHeading'))}
      <p className="text-xs text-muted-foreground sm:text-sm md:text-base">
        {t('paymentIntro')}
      </p>
      <div className="mt-6">{paymentSection}</div>
    </>
  )

  return (
    <div className="min-h-screen bg-background">
      <SiteHeaderWrapper />

      {/* Hero Section */}
      <section className="relative h-[50vh] sm:h-[60vh] md:h-[70vh] w-full">
        {mainImage ? (
          <img src={mainImage} alt={tripTitle} className="h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#274C77] to-[#6096BA]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        <div className="absolute inset-x-0 top-0 pt-24 sm:pt-28 md:pt-32 lg:pt-36">
          <div className="container px-4 sm:px-6 lg:px-8">
            <p className="text-sm font-medium uppercase tracking-wider text-white/80">
              {t('eyebrow')}
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
                {t('preparedFor', { name: inquiry.customer_name })}
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
            <div className="hidden lg:block">{paymentBlock}</div>

            {galleryImages.length > 0 && (
              <TripImageGallery images={galleryImages} title={tripTitle} />
            )}

            {roomImage && (
              <RoomImageSection
                imageUrl={roomImage}
                heading={t('accommodation')}
                title={tripTitle}
              />
            )}
          </div>

          {/* Left Column - Text Content */}
          <div className="order-2 space-y-8 lg:order-1">
            {/* Overview */}
            <div>
              {sectionHeading(t('overview'))}
              <p className="text-sm leading-relaxed text-muted-foreground sm:text-base lg:text-lg whitespace-pre-wrap">
                {tripOverview || t('defaultOverview')}
              </p>
            </div>

            {/* Travel Dates */}
            {inquiry.start_date && (
              <div>
                {sectionHeading(t('travelDates'))}
                <p className="flex items-start gap-3 text-sm text-foreground sm:text-base">
                  <Calendar className="mt-0.5 h-5 w-5 shrink-0 text-[#274C77]" />
                  <span>
                    {formatDate(inquiry.start_date)}
                    {inquiry.end_date && ` – ${formatDate(inquiry.end_date)}`}
                    {nights !== null && nights > 0 && (
                      <span className="text-muted-foreground">
                        {' '}
                        · {t('nights', { nights })}
                      </span>
                    )}
                  </span>
                </p>
              </div>
            )}

            {/* What's Included */}
            {hasIncluded && (
              <div>
                {sectionHeading(t('included'))}
                <div className="space-y-6">
                  {packageDetails.map((pkg, idx) => (
                    <p
                      key={idx}
                      className="text-sm text-muted-foreground sm:text-base whitespace-pre-wrap"
                    >
                      {pkg.description}
                    </p>
                  ))}

                  {golfCourses.length > 0 && (
                    <div>
                      <h3 className="mb-3 font-serif text-lg font-bold">
                        {t('golfCourses')}
                      </h3>
                      <ul className="space-y-3">
                        {golfCourses.map((course: any) => (
                          <li key={course.id} className="flex items-start gap-3">
                            <Flag className="mt-0.5 h-5 w-5 shrink-0 text-[#274C77]" />
                            <div className="text-sm sm:text-base">
                              <p className="font-medium text-foreground">{course.name}</p>
                              <p className="text-muted-foreground">
                                {[
                                  course.holes ? t('holes', { holes: course.holes }) : null,
                                  course.rounds ? t('upToRounds', { rounds: course.rounds }) : null,
                                ]
                                  .filter(Boolean)
                                  .join(' · ')}
                              </p>
                              {course.description && (
                                <p className="mt-1 text-muted-foreground whitespace-pre-wrap">
                                  {course.description}
                                </p>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {optionGroups
                    .filter((group) => group.included.length > 0)
                    .map((group) => (
                      <div key={group.key}>
                        <h3 className="mb-3 font-serif text-lg font-bold">
                          {t(group.key)}
                        </h3>
                        <ul className="space-y-3">
                          {group.included.map((row: any) => (
                            <li key={row.id} className="flex items-start gap-3">
                              <Check className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                              <div className="text-sm sm:text-base">
                                <p className="font-medium text-foreground">
                                  {localized(row, 'name')}
                                </p>
                                {localized(row, 'description') && (
                                  <p className="text-muted-foreground whitespace-pre-wrap">
                                    {localized(row, 'description')}
                                  </p>
                                )}
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Optional extras the admin listed but didn't include */}
            {onRequest.length > 0 && (
              <div>
                {sectionHeading(t('availableOnRequest'))}
                <ul className="space-y-2">
                  {onRequest.map((row: any) => (
                    <li key={row.id} className="text-sm text-muted-foreground sm:text-base">
                      <span className="font-medium text-foreground">
                        {localized(row, 'name')}
                      </span>
                      {localized(row, 'description') && ` — ${localized(row, 'description')}`}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Highlights */}
            {highlights.length > 0 && (
              <div>
                {sectionHeading(t('highlights'))}
                <ul className="space-y-3">
                  {highlights.map((highlight, idx) => (
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

            {/* Refund Policy */}
            {refundPolicy && (
              <div>
                {sectionHeading(t('refundPolicy'))}
                <p className="max-h-[7.5rem] overflow-y-auto text-sm leading-relaxed text-muted-foreground sm:text-base whitespace-pre-wrap">
                  {refundPolicy}
                </p>
              </div>
            )}

            {/* Questions — how to reach us (previously this section echoed
                the customer's own contact details back to them) */}
            <div>
              {sectionHeading(t('questions'))}
              <p className="flex items-start gap-3 text-sm text-foreground sm:text-base">
                <Mail className="mt-0.5 h-5 w-5 shrink-0 text-[#274C77]" />
                <span>
                  {t('questionsMessage')}{' '}
                  <a href={`mailto:${supportEmail}`} className="text-[#274C77] underline">
                    {supportEmail}
                  </a>
                </span>
              </p>
              {state.stage === 'deposit_paid' && inquiry.remainder_due_date && (
                <p className="mt-3 flex items-start gap-3 text-sm text-muted-foreground">
                  <Clock className="mt-0.5 h-5 w-5 shrink-0 text-[#274C77]" />
                  <span>
                    {t('balanceDueBy', { date: formatDate(inquiry.remainder_due_date) })}
                  </span>
                </p>
              )}
            </div>

            {/* Payment - Mobile Only */}
            <div className="lg:hidden">{paymentBlock}</div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}
