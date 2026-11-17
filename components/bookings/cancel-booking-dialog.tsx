'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslations } from '@/lib/i18n/provider'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  CARD_REFUND_FEE_PERCENT,
  quoteCancellation,
  toCancellationSchedule,
  type CancellableBooking,
  type CancellationQuote,
} from '@/lib/cancellation-policy'

function formatMoney(amount: number) {
  return `$${Number(amount || 0).toFixed(2)}`
}

interface CancelBookingDialogProps {
  booking: CancellableBooking & {
    id: string
    payment_method?: string | null
    trip?: { cancellation_schedule?: string | null } | null
  }
  tripTitle: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Shows what cancelling costs under the policy, then cancels. The figures
 * here are an estimate computed in the browser; the server recomputes them
 * and refuses with `quote_changed` if they differ (e.g. the date rolled
 * over while the dialog was open), in which case its quote is shown.
 */
export function CancelBookingDialog({
  booking,
  tripTitle,
  open,
  onOpenChange,
}: CancelBookingDialogProps) {
  const t = useTranslations('bookingsPage')
  const router = useRouter()
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [serverQuote, setServerQuote] = useState<CancellationQuote | null>(null)

  const schedule = toCancellationSchedule(booking.trip?.cancellation_schedule)
  const localQuote = useMemo(
    () => (open ? quoteCancellation(booking, schedule) : null),
    // Recomputed each time the dialog opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [open, booking.id, schedule],
  )
  const quote = serverQuote || localQuote
  const paidByBank =
    booking.payment_method === 'ach' || booking.payment_method === 'us_bank_account'
  const hasUnpaidBalance =
    !booking.remaining_balance_charged && Number(booking.remaining_balance || 0) > 0

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setError(null)
      setServerQuote(null)
    }
    onOpenChange(next)
  }

  const submit = async () => {
    if (!quote) return
    setSubmitting(true)
    setError(null)
    try {
      const response = await fetch(`/api/bookings/${booking.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expectedFeePercent: quote.feePercent,
          reason: reason.trim() || undefined,
        }),
      })
      const data = await response.json().catch(() => ({}))
      if (data.ok) {
        handleOpenChange(false)
        router.refresh()
        return
      }
      if (data.code === 'quote_changed' && data.quote) {
        setServerQuote(data.quote)
        setError(t('cancelQuoteChanged'))
      } else if (data.code === 'payment_clearing') {
        setError(t('cancelPaymentClearing'))
      } else if (data.code === 'already_cancelled') {
        handleOpenChange(false)
        router.refresh()
      } else if (data.code === 'departed' || data.code === 'no_departure_date') {
        setError(t('cancelNotOnline'))
      } else {
        setError(t('cancelError'))
      }
    } catch {
      setError(t('cancelError'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('cancelTitle')}</DialogTitle>
          <DialogDescription>{tripTitle}</DialogDescription>
        </DialogHeader>

        {!quote ? (
          <p className="text-sm text-muted-foreground">{t('cancelNotOnline')}</p>
        ) : (
          <div className="space-y-4 text-sm">
            <p>
              {quote.lastMinuteBooking
                ? t('cancelLastMinute')
                : quote.daysBeforeDeparture === 0
                  ? t('cancelDepartureToday')
                  : t(quote.daysBeforeDeparture === 1 ? 'cancelIntroOne' : 'cancelIntro', {
                      days: quote.daysBeforeDeparture,
                      percent: quote.feePercent,
                    })}
            </p>

            <div className="space-y-2 border border-border bg-muted/40 p-3">
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">{t('cancelPaid')}</span>
                <span className="font-medium">{formatMoney(quote.paidTowardTrip)}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">
                  {t('cancelFee', {
                    percent: quote.feePercent,
                    total: formatMoney(quote.tripTotal),
                  })}
                </span>
                <span className="font-medium">−{formatMoney(quote.fee)}</span>
              </div>
              <div className="flex justify-between gap-4 border-t border-border pt-2">
                <span className="font-medium">{t('cancelRefund')}</span>
                <span className="font-semibold">{formatMoney(quote.refundDue)}</span>
              </div>
            </div>

            <ul className="list-disc space-y-1 pl-5 text-xs text-muted-foreground">
              {hasUnpaidBalance && <li>{t('cancelBalanceNote')}</li>}
              {quote.refundDue > 0 && !paidByBank && (
                <li>{t('cancelCardFeeNote', { percent: CARD_REFUND_FEE_PERCENT })}</li>
              )}
              <li>{t('cancelReviewNote')}</li>
              <li>
                <Link href="/terms" target="_blank" className="underline">
                  {t('cancelPolicyLink')}
                </Link>
              </li>
            </ul>

            <div className="space-y-2">
              <Label htmlFor="cancel-reason">{t('cancelReasonLabel')}</Label>
              <Textarea
                id="cancel-reason"
                value={reason}
                maxLength={1000}
                rows={3}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
          </div>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={submitting}
          >
            {t('keepBooking')}
          </Button>
          <Button
            variant="destructive"
            onClick={submit}
            disabled={!quote || submitting}
          >
            {submitting ? t('cancelling') : t('confirmCancel')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
