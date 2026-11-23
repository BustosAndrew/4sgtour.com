import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getUserType } from '@/lib/supabase/get-user-type'
import { toCalendarDate } from '@/lib/calendar-date'
import {
  PAYMENT_COLUMNS,
  paymentStage,
  toAdminPayment,
  todayUtc,
} from '@/lib/admin-payments'

/**
 * PATCH /api/admin/bookings/[id]/schedule — admin only.
 * Body: { date: 'yyyy-MM-dd' | null }
 *
 * When the remaining balance of a booking is collected.
 *
 *  - A payment method was saved with the deposit: `date` is when the charge
 *    cron (daily, 08:00 UTC) bills it — `auto_charge_date`. null stops
 *    automatic charging; the customer then pays another way.
 *    Setting a date also restarts the cron's 3 retries, so a booking whose
 *    card was declined can be tried again.
 *  - No saved payment method: `date` is the due date the customer is
 *    reminded of — `remainder_due_date`.
 *
 * Either way the 5-day reminder text is re-armed for the new date. For a
 * custom package the package itself (inquiries.remainder_due_date /
 * balance_flow) is updated too, so saving the package later doesn't put the
 * old date back.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if ((await getUserType()) !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  const rawDate = body?.date
  const date = rawDate === null ? null : toCalendarDate(rawDate)
  if (rawDate !== null && (!date || !/^\d{4}-\d{2}-\d{2}$/.test(String(rawDate)))) {
    return NextResponse.json({ error: 'Choose a valid date.' }, { status: 400 })
  }
  if (date && date < todayUtc()) {
    return NextResponse.json({ error: 'The date cannot be in the past.' }, { status: 400 })
  }

  const service = createServiceClient()
  const { data: row, error: readError } = await service
    .from('stripe_bookings')
    .select(PAYMENT_COLUMNS)
    .eq('id', id)
    .maybeSingle()
  if (readError) {
    console.error('[admin-payments] Error reading booking:', readError)
    return NextResponse.json({ error: 'Failed to load booking' }, { status: 500 })
  }
  if (!row) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })

  const booking = row as any
  if (!['confirmed', 'completed'].includes(booking.status)) {
    return NextResponse.json(
      { error: 'Only a booking with a paid deposit has a balance to schedule.' },
      { status: 409 },
    )
  }
  const stage = paymentStage(booking)
  if (stage === 'balance_clearing') {
    return NextResponse.json(
      { error: 'A bank payment for the balance is clearing. Wait for it to settle or bounce.' },
      { status: 409 },
    )
  }
  if (stage !== 'balance_due') {
    return NextResponse.json(
      { error: 'Nothing is left to pay on this booking.' },
      { status: 409 },
    )
  }

  const hasSavedMethod = !!(booking.stripe_customer_id && booking.stripe_payment_method_id)
  const now = new Date().toISOString()
  const update: Record<string, unknown> = { updated_at: now }
  let dateChanged: boolean

  if (hasSavedMethod) {
    dateChanged = date !== booking.auto_charge_date
    update.auto_charge_date = date
    if (date) {
      update.charge_attempts = 0
      update.last_charge_error = null
      // A custom package's due date follows its charge date.
      if (booking.inquiry_id) update.remainder_due_date = date
    }
  } else {
    if (date === null) {
      // Nothing would collect it and nothing would remind anyone.
      return NextResponse.json(
        { error: 'No card was saved for this booking, so a due date is needed.' },
        { status: 400 },
      )
    }
    dateChanged = date !== booking.remainder_due_date
    update.remainder_due_date = date
  }
  if (dateChanged) update.payment_reminder_sent_at = null

  // Guarded on the balance still being open, so a cron run that charged it a
  // moment ago isn't overwritten.
  const { data: updated, error: updateError } = await service
    .from('stripe_bookings')
    .update(update)
    .eq('id', id)
    .eq('remaining_balance_charged', false)
    .select(PAYMENT_COLUMNS)
  if (updateError) {
    console.error('[admin-payments] Error updating schedule:', updateError)
    return NextResponse.json({ error: 'Failed to save the date' }, { status: 500 })
  }
  if (!updated || updated.length === 0) {
    return NextResponse.json(
      { error: 'The balance was just collected. Refresh to see it.' },
      { status: 409 },
    )
  }

  if (booking.inquiry_id) {
    const inquiryUpdate: Record<string, unknown> = { updated_at: now }
    if (date) inquiryUpdate.remainder_due_date = date
    if (hasSavedMethod) inquiryUpdate.balance_flow = date ? 'auto_charge' : 'pay_link'
    if (dateChanged) inquiryUpdate.payment_reminder_sent_at = null
    const { error } = await service
      .from('inquiries')
      .update(inquiryUpdate)
      .eq('id', booking.inquiry_id)
    if (error) console.error('[admin-payments] Error updating custom package date:', error)
  }

  console.log(
    `[admin-payments] Balance schedule for ${id} set to ${date ?? 'none'} (${hasSavedMethod ? 'auto-charge' : 'due date'}) by ${user.id}`,
  )
  return NextResponse.json({ payment: toAdminPayment(updated[0]) })
}
