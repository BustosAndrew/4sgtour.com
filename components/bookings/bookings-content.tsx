'use client'

import { useTranslations } from '@/lib/i18n/provider'
import { Button } from '@/components/ui/button'
import { differenceInDays, format } from 'date-fns'
import { CheckCircle2, Calendar, MapPin, Users, Clock, Trophy } from 'lucide-react'
import Link from 'next/link'
import { UserInquiryMessages } from '@/components/user-inquiry-messages'

interface BookingsContentProps {
  bookings: any[]
  inquiries: any[]
  showSuccess: boolean
  profile: { email?: string; display_name?: string } | null
  userEmail: string
}

// `yyyy-MM-dd` strings are calendar dates. `new Date('2026-12-01')` parses
// them as UTC midnight, which renders as the previous day west of UTC.
function parseCalendarDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  return match
    ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
    : new Date(value)
}

function formatMoney(amount: unknown) {
  return `$${Number(amount || 0).toFixed(2)}`
}

export function BookingsContent({
  bookings,
  inquiries,
  showSuccess,
  profile,
  userEmail,
}: BookingsContentProps) {
  const t = useTranslations('bookingsPage')

  // An SMS payment link (and a custom package) writes both an inquiry and a
  // stripe_bookings row for the same Stripe session. Show the booking once,
  // carrying the inquiry's message thread, instead of two cards.
  const inquiryBySession = new Map<string, any>()
  for (const inquiry of inquiries || []) {
    if (inquiry.stripe_session_id) {
      inquiryBySession.set(inquiry.stripe_session_id, inquiry)
    }
  }
  const bookedSessionIds = new Set(
    (bookings || [])
      .map((booking) => booking.stripe_checkout_session_id)
      .filter(Boolean),
  )
  const openInquiries = (inquiries || []).filter(
    (inquiry) =>
      !(inquiry.stripe_session_id && bookedSessionIds.has(inquiry.stripe_session_id)),
  )

  const getBookingStatusLabel = (status: string) => {
    switch (status) {
      case 'cancelled':
        return t('cancelled')
      case 'refunded':
        return t('refunded')
      default:
        return t('confirmed')
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'converted':
        return t('confirmed')
      case 'contacted':
        return t('inProgress')
      case 'cancelled':
        return t('cancelled')
      default:
        return t('pending')
    }
  }

  return (
    <>
      {showSuccess && (
        <div className="mb-8 border border-primary/20 bg-primary/10 p-4 sm:p-6">
          <div className="flex items-start gap-4">
            <CheckCircle2 className="h-6 w-6 flex-shrink-0 text-primary" />
            <div>
              {/* Every link to /bookings?success=true comes from a completed
                  Stripe payment (embedded checkout, SMS link, custom package). */}
              <h2 className="font-semibold text-foreground">
                {t('paymentReceived')}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {t('paymentReceivedMessage')}
              </p>
            </div>
          </div>
        </div>
      )}

      <h1 className="mb-8 text-2xl font-semibold sm:text-3xl">{t('title')}</h1>

      {bookings && bookings.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-4 text-lg font-semibold">{t('bookingsHeading')}</h2>
          <div className="space-y-4">
            {bookings.map((booking) => {
              const details = (booking.booking_details || {}) as Record<
                string,
                any
              >
              const startDate = details.start_date || booking.trip_start_date
              const endDate = details.end_date
              const isActive =
                booking.status === 'confirmed' || booking.status === 'completed'
              const remaining = Number(booking.remaining_balance || 0)
              const hasBalanceDue =
                isActive && remaining > 0 && !booking.remaining_balance_charged
              const linkedInquiry = booking.stripe_checkout_session_id
                ? inquiryBySession.get(booking.stripe_checkout_session_id)
                : null

              return (
                <div
                  key={booking.id}
                  className="border border-border bg-card p-4 sm:p-6"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground text-lg">
                        {booking.trip?.slug ? (
                          <Link
                            href={`/trips/${booking.trip.slug}`}
                            className="hover:underline"
                          >
                            {details.trip_title || booking.trip_title}
                          </Link>
                        ) : (
                          details.trip_title || booking.trip_title
                        )}
                      </h3>
                      {details.package_name && (
                        <p className="mt-1 text-sm text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <Users className="h-3.5 w-3.5" />
                            {t('package')} {details.package_name}
                          </span>
                        </p>
                      )}
                      <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                        {startDate && (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">
                              {t('start')}
                            </span>{' '}
                            <span className="font-medium">
                              {format(parseCalendarDate(startDate), 'MMM d, yyyy')}
                            </span>
                          </div>
                        )}
                        {endDate && (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">
                              {t('end')}
                            </span>{' '}
                            <span className="font-medium">
                              {format(parseCalendarDate(endDate), 'MMM d, yyyy')}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            {t('booked')}
                          </span>{' '}
                          <span className="font-medium">
                            {format(new Date(booking.created_at), 'MMM d, yyyy')}
                          </span>
                        </div>
                      </div>
                      <div className="mt-4 space-y-1 text-sm">
                        <div>
                          <span className="text-muted-foreground">
                            {t('amountPaid')}
                          </span>{' '}
                          <span className="font-medium">
                            {formatMoney(booking.total_paid)}
                          </span>
                        </div>
                        {hasBalanceDue ? (
                          <div>
                            <span className="text-muted-foreground">
                              {t('remainingBalance')}
                            </span>{' '}
                            <span className="font-medium">
                              {formatMoney(remaining)}
                            </span>
                            {booking.auto_charge_date && (
                              <span className="text-muted-foreground">
                                {' '}
                                (
                                {t('autoChargeOn', {
                                  date: format(
                                    parseCalendarDate(booking.auto_charge_date),
                                    'MMM d, yyyy',
                                  ),
                                })}
                                )
                              </span>
                            )}
                          </div>
                        ) : (
                          isActive && (
                            <div className="font-medium text-primary">
                              {t('paidInFull')}
                            </div>
                          )
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:ml-4 sm:flex-col sm:items-end sm:text-right">
                      <div className="mb-0 sm:mb-2">
                        <span
                          className={`inline-block px-3 py-1 text-xs font-medium ${
                            isActive
                              ? 'bg-primary/10 text-primary'
                              : 'bg-destructive/10 text-destructive'
                          }`}
                        >
                          {getBookingStatusLabel(booking.status)}
                        </span>
                      </div>
                      {Number(booking.total_price) > 0 && (
                        <div>
                          <p className="text-xs text-muted-foreground">
                            {t('tripTotal')}
                          </p>
                          <p className="text-lg font-bold sm:text-xl">
                            {formatMoney(booking.total_price)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {linkedInquiry && (
                    <UserInquiryMessages
                      inquiryId={linkedInquiry.id}
                      userName={
                        profile?.display_name || profile?.email || 'Guest'
                      }
                      userEmail={profile?.email || userEmail || ''}
                      tripTitle={linkedInquiry.trip_title}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </section>
      )}

      {openInquiries.length > 0 ? (
        <section>
          {bookings && bookings.length > 0 && (
            <h2 className="mb-4 text-lg font-semibold">
              {t('inquiriesHeading')}
            </h2>
          )}
        <div className="space-y-4">
          {openInquiries.map((inquiry) => (
            <div
              key={inquiry.id}
              className="border border-border bg-card p-4 sm:p-6"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex-1">
                  <div className="flex items-start gap-2 flex-wrap">
                    <h3 className="font-semibold text-foreground text-lg">
                      {inquiry.trip_title}
                    </h3>
                    {inquiry.inquiry_type === 'tournament' && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800 shrink-0 mt-0.5">
                        <Trophy className="h-3 w-3" />
                        {t('tournamentInquiry')}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {inquiry.package_name && (
                      <span className="inline-flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        {inquiry.package_name}
                      </span>
                    )}
                  </p>
                  <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                    {inquiry.inquiry_type === 'tournament' ? (
                      <>
                        {inquiry.participants > 0 && (
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">
                              {t('participants')}
                            </span>{' '}
                            <span className="font-medium">{inquiry.participants}</span>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        {inquiry.start_date && (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">
                              {t('start')}
                            </span>{' '}
                            <span className="font-medium">
                              {format(new Date(inquiry.start_date), 'MMM d, yyyy')}
                            </span>
                          </div>
                        )}
                        {inquiry.end_date && (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">
                              {t('end')}
                            </span>{' '}
                            <span className="font-medium">
                              {format(new Date(inquiry.end_date), 'MMM d, yyyy')}
                            </span>
                          </div>
                        )}
                        {inquiry.start_date && inquiry.end_date && (
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">
                              {t('duration')}
                            </span>{' '}
                            <span className="font-medium">
                              {differenceInDays(
                                new Date(inquiry.end_date),
                                new Date(inquiry.start_date)
                              ) + 1}{' '}
                              {t('days')}
                            </span>
                          </div>
                        )}
                        {inquiry.rounds > 0 && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">
                              {t('rounds')}
                            </span>{' '}
                            <span className="font-medium">{inquiry.rounds}</span>
                          </div>
                        )}
                      </>
                    )}
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {t('submitted')}
                      </span>{' '}
                      <span className="font-medium">
                        {format(new Date(inquiry.created_at), 'MMM d, yyyy')}
                      </span>
                    </div>
                  </div>
                  {inquiry.additional_requests && (
                    <div className="mt-3 text-sm">
                      <span className="text-muted-foreground">{t('notes')}</span>{' '}
                      <span className="text-foreground">
                        {inquiry.additional_requests}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between sm:ml-4 sm:flex-col sm:items-end sm:text-right">
                  <div className="mb-0 sm:mb-2">
                    <span
                      className={`inline-block px-3 py-1 text-xs font-medium ${
                        inquiry.status === 'converted'
                          ? 'bg-primary/10 text-primary'
                          : inquiry.status === 'contacted'
                            ? 'bg-blue-100 text-blue-700'
                            : inquiry.status === 'cancelled'
                              ? 'bg-destructive/10 text-destructive'
                              : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {getStatusLabel(inquiry.status)}
                    </span>
                  </div>
                  {inquiry.total_price > 0 && (
                    <p className="text-lg font-bold sm:text-xl">
                      ${inquiry.total_price.toFixed(2)}
                    </p>
                  )}
                </div>
              </div>

              <UserInquiryMessages
                inquiryId={inquiry.id}
                userName={profile?.display_name || profile?.email || 'Guest'}
                userEmail={profile?.email || userEmail || ''}
                tripTitle={inquiry.trip_title}
              />
            </div>
          ))}
        </div>
        </section>
      ) : (bookings || []).length > 0 ? null : (
        <div className="border border-border bg-card p-8 text-center sm:p-12">
          <p className="text-muted-foreground">{t('empty')}</p>
          <Button asChild className="mt-4">
            <Link href="/destinations">{t('browseDestinations')}</Link>
          </Button>
        </div>
      )}
    </>
  )
}
