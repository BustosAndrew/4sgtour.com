'use client'

import { useTranslations } from '@/lib/i18n/provider'
import { Button } from '@/components/ui/button'
import { differenceInDays, format } from 'date-fns'
import { CheckCircle2, Calendar, MapPin, Users, Clock, Trophy } from 'lucide-react'
import Link from 'next/link'
import { UserInquiryMessages } from '@/components/user-inquiry-messages'

interface BookingsContentProps {
  inquiries: any[]
  showSuccess: boolean
  profile: { email?: string; display_name?: string } | null
  userEmail: string
}

export function BookingsContent({
  inquiries,
  showSuccess,
  profile,
  userEmail,
}: BookingsContentProps) {
  const t = useTranslations('bookingsPage')

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
              <h2 className="font-semibold text-foreground">
                {t('inquirySubmitted')}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {t('inquirySubmittedMessage')}
              </p>
            </div>
          </div>
        </div>
      )}

      <h1 className="mb-8 text-2xl font-semibold sm:text-3xl">{t('title')}</h1>

      {inquiries && inquiries.length > 0 ? (
        <div className="space-y-4">
          {inquiries.map((inquiry) => (
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
      ) : (
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
