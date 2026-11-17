import { createClient } from '@/lib/supabase/server'
import { getUserType } from '@/lib/supabase/get-user-type'
import { type NextRequest, NextResponse } from 'next/server'
import { normalizeE164 } from '@/lib/phone'
import { toCalendarDate } from '@/lib/calendar-date'
import { getBalanceFlow } from '@/lib/custom-package'
import { toCancellationSchedule } from '@/lib/cancellation-policy'

// Translation columns are never written from here unless the form sends
// them: child rows are updated in place by id, so their Korean/German
// columns survive a Save. (This route used to delete and re-insert every
// package, golf course, meal, transport and service option without those
// columns — wiping their translations on every edit.)
const TRIP_TRANSLATED_FIELDS = [
  'title',
  'description',
  'refund_policy',
  'location',
  'highlights',
  'overview_content',
]

/**
 * Bring a trip's child rows in line with what the form submitted: update
 * rows whose id already exists (only the listed base columns), insert the
 * rest, delete the ones the admin removed. Inserts and updates happen before
 * deletes, so a failure never leaves the trip empty.
 */
async function syncTripRows(
  supabase: Awaited<ReturnType<typeof createClient>>,
  table: string,
  tripId: string,
  submitted: any[],
  toRow: (item: any) => Record<string, any>,
) {
  const { data: existing } = await supabase
    .from(table)
    .select('id')
    .eq('trip_id', tripId)
  const existingIds = new Set((existing || []).map((r: any) => r.id))

  const kept = new Set<string>()
  const toInsert: Record<string, any>[] = []
  for (const item of submitted) {
    const row = toRow(item)
    if (item.id && existingIds.has(item.id)) {
      kept.add(item.id)
      const { error } = await supabase.from(table).update(row).eq('id', item.id)
      if (error) console.error(`[custom-booking] Error updating ${table}:`, error)
    } else {
      toInsert.push({ ...row, trip_id: tripId })
    }
  }

  if (toInsert.length > 0) {
    const { error } = await supabase.from(table).insert(toInsert)
    if (error) console.error(`[custom-booking] Error inserting ${table}:`, error)
  }

  const removed = [...existingIds].filter((id) => !kept.has(id))
  if (removed.length > 0) {
    const { error } = await supabase.from(table).delete().in('id', removed)
    if (error) console.error(`[custom-booking] Error deleting ${table}:`, error)
  }
}

/**
 * Once a deposit is in, the balance still owed lives on the stripe_bookings
 * row (it is what the package page, the charge cron and the reminders use).
 * Bring it in line with an edited price / due date / balance flow.
 * Returns a message for the admin when something needs their attention.
 */
async function recalculateRecordedBalance(
  supabase: Awaited<ReturnType<typeof createClient>>,
  inquiryId: string,
  next: { totalPrice: number; dueDate: string | null; balanceFlow: string | null },
): Promise<string | null> {
  const { data: rows, error } = await supabase
    .from('stripe_bookings')
    .select(
      'id, status, total_paid, remaining_balance, remaining_balance_charged, remaining_balance_payment_intent_id, remainder_due_date, auto_charge_date, stripe_customer_id, stripe_payment_method_id, created_at',
    )
    .eq('inquiry_id', inquiryId)
    .in('status', ['confirmed', 'completed', 'processing'])
    .order('created_at', { ascending: true })

  if (error) {
    console.error('[custom-booking] Error reading recorded payments:', error)
    return null
  }
  if (!rows || rows.length === 0) return null // nothing paid yet

  if (
    rows.some(
      (r) =>
        r.status === 'processing' ||
        (r.remaining_balance_payment_intent_id && !r.remaining_balance_charged),
    )
  ) {
    return 'A bank payment for this package is still clearing, so the recorded balance was not changed. Save again once it has cleared.'
  }

  const paidCents = rows.reduce(
    (sum, r) => sum + Math.round(Number(r.total_paid || 0) * 100),
    0,
  )
  const totalCents = Math.round(next.totalPrice * 100)
  const remainingCents = Math.max(0, totalCents - paidCents)
  const target = rows[rows.length - 1]
  const remaining = remainingCents / 100
  const canAutoCharge =
    next.balanceFlow === 'auto_charge' &&
    !!next.dueDate &&
    !!target.stripe_customer_id &&
    !!target.stripe_payment_method_id

  const update: Record<string, any> = {
    total_price: next.totalPrice,
    total_package_price: next.totalPrice,
    remaining_balance: remaining,
    remaining_balance_charged: remainingCents <= 0,
    remainder_due_date: remainingCents > 0 ? next.dueDate : null,
    auto_charge_date: remainingCents > 0 && canAutoCharge ? next.dueDate : null,
    updated_at: new Date().toISOString(),
  }
  // A new due date (or a re-opened balance) deserves a new 5-day reminder.
  if (
    remainingCents > 0 &&
    (next.dueDate !== target.remainder_due_date ||
      Number(target.remaining_balance) !== remaining ||
      target.remaining_balance_charged)
  ) {
    update.payment_reminder_sent_at = null
  }

  // Only the last row carries the balance; earlier ones are settled.
  const { error: updateError } = await supabase
    .from('stripe_bookings')
    .update(update)
    .eq('id', target.id)
  if (updateError) {
    console.error('[custom-booking] Error updating recorded balance:', updateError)
    return `The booking was saved, but the recorded balance could not be updated: ${updateError.message}`
  }
  for (const row of rows.slice(0, -1)) {
    if (Number(row.remaining_balance) > 0 && !row.remaining_balance_charged) {
      await supabase
        .from('stripe_bookings')
        .update({ remaining_balance: 0, remaining_balance_charged: true, auto_charge_date: null })
        .eq('id', row.id)
    }
  }

  if (paidCents > totalCents) {
    return `The customer has already paid $${(paidCents / 100).toFixed(2)}, which is $${((paidCents - totalCents) / 100).toFixed(2)} more than the new price. Nothing more will be collected; refund the difference in Stripe if needed.`
  }
  if (next.balanceFlow === 'auto_charge' && remainingCents > 0 && !canAutoCharge) {
    return 'Auto-charge was chosen, but no reusable card was saved with the deposit, so the customer will pay the remaining balance from their package page instead.'
  }
  return null
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: tripId } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userType = await getUserType()
  if (userType !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()

  // Validate before writing anything
  const phone =
    body.customerPhone !== undefined ? normalizeE164(body.customerPhone) : null
  if (body.inquiryId && !phone) {
    return NextResponse.json(
      {
        error:
          'Customer phone must be a full international number, e.g. +82 10 1234 5678',
      },
      { status: 400 },
    )
  }
  if (
    body.inquiryId &&
    Number(body.depositPercentage) < 100 &&
    !toCalendarDate(body.remainderDueDate)
  ) {
    return NextResponse.json(
      { error: 'A remainder due date is required when taking a deposit' },
      { status: 400 },
    )
  }

  // ── 1. Update trip record ──────────────────────────────────────────
  const updateData: Record<string, any> = {
    title: body.title,
    description: body.description,
    refund_policy: body.refund_policy || null,
    location: body.location,
    continent: body.continent,
    price_regular: body.price_regular,
    max_guests: body.max_guests,
    max_nights: body.max_nights || body.max_days,
    min_nights: body.min_nights || body.min_days || 1,
    min_days_advance: body.min_days_advance,
    highlights: body.highlights,
    overview_content: body.overview_content,
    courses_photo_url: body.courses_photo_url,
    room_photo_url: body.room_photo_url,
    show_from_price: body.show_from_price ?? false,
    updated_at: new Date().toISOString(),
  }
  if ('cancellation_schedule' in body) {
    updateData.cancellation_schedule = toCancellationSchedule(
      body.cancellation_schedule,
    )
  }

  // Korean and German only when the form sends them (German is the primary
  // language of two of the three sites).
  for (const field of TRIP_TRANSLATED_FIELDS) {
    for (const suffix of ['_ko', '_de']) {
      if (`${field}${suffix}` in body) {
        updateData[`${field}${suffix}`] = body[`${field}${suffix}`]
      }
    }
  }

  const { error: tripError } = await supabase
    .from('trips')
    .update(updateData)
    .eq('id', tripId)

  if (tripError) {
    console.error('[v0] Error updating custom trip:', tripError)
    return NextResponse.json({ error: tripError.message }, { status: 500 })
  }

  // ── 2. Packages ────────────────────────────────────────────────────
  // Updated in place: a deleted package nulls stripe_bookings.package_id.
  if (Array.isArray(body.packages)) {
    await syncTripRows(
      supabase,
      'packages',
      tripId,
      body.packages.filter((pkg: any) => pkg.name?.trim()),
      (pkg) => ({
        name: pkg.name,
        description: pkg.description || null,
        price: pkg.price || 0,
        price_per_extra_night: pkg.price_per_extra_night || null,
        availability: pkg.availability || 'unlimited',
        quantity: pkg.availability === 'limited' ? pkg.quantity : null,
        participants_per_booking: pkg.participants_per_booking || 1,
      }),
    )
  }

  // ── 3. Golf courses ────────────────────────────────────────────────
  if (Array.isArray(body.golf_courses)) {
    await syncTripRows(
      supabase,
      'trip_golf_courses',
      tripId,
      body.golf_courses.filter((c: any) => c.course_name?.trim()),
      (c) => ({
        course_name: c.course_name,
        ...(c.description !== undefined && { description: c.description || null }),
        max_rounds: c.max_rounds || 5,
        num_holes: c.num_holes || 18,
      }),
    )
  }

  // ── 4. Course images ───────────────────────────────────────────────
  if (Array.isArray(body.course_images)) {
    await supabase.from('trip_images').delete().eq('trip_id', tripId)

    const photos = body.course_images
      .slice(0, 5)
      .filter((url: string) => url && url.trim())
      .map((url: string, idx: number) => ({
        trip_id: tripId,
        image_url: url,
        display_order: idx,
      }))

    if (photos.length > 0) {
      const { error } = await supabase.from('trip_images').insert(photos)
      if (error) console.error('Error updating course photos:', error)
    }
  }

  // ── 5–7. Meal, transportation and service options ──────────────────
  const optionRow = (o: any) => ({
    name: o.name,
    description: o.description || null,
    is_included: o.is_included || false,
  })
  for (const [key, table] of [
    ['meal_options', 'trip_meal_options'],
    ['transportation_options', 'trip_transportation_options'],
    ['service_options', 'trip_service_options'],
  ] as const) {
    if (Array.isArray(body[key])) {
      await syncTripRows(
        supabase,
        table,
        tripId,
        body[key].filter((o: any) => o.name?.trim()),
        optionRow,
      )
    }
  }

  // ── 8. Update inquiry record ───────────────────────────────────────
  // Price and deposit changes reach the customer automatically: payments
  // start from /package/[id], which creates a Stripe session from these
  // values at the moment the customer pays.
  if (body.inquiryId) {
    const depositPercentage = Number(body.depositPercentage) || 100
    const inquiryUpdate: Record<string, any> = {
      trip_title: body.title,
      customer_name: body.customerName,
      customer_email: body.customerEmail,
      customer_phone: phone,
      total_price: body.totalPrice,
      deposit_percentage: depositPercentage,
      custom_package_description: body.description || '',
      start_date: toCalendarDate(body.startDate),
      end_date: toCalendarDate(body.endDate),
      remainder_due_date:
        depositPercentage < 100 ? toCalendarDate(body.remainderDueDate) : null,
      balance_flow:
        depositPercentage < 100 ? getBalanceFlow(body.balanceFlow) : null,
    }

    const { error: inquiryError } = await supabase
      .from('inquiries')
      .update(inquiryUpdate)
      .eq('id', body.inquiryId)

    if (inquiryError) {
      console.error('[v0] Error updating inquiry:', inquiryError)
      return NextResponse.json(
        { error: `Trip saved, but the booking details were not: ${inquiryError.message}` },
        { status: 500 },
      )
    }

    const warning = await recalculateRecordedBalance(supabase, body.inquiryId, {
      totalPrice: Number(body.totalPrice) || 0,
      dueDate: inquiryUpdate.remainder_due_date,
      balanceFlow: inquiryUpdate.balance_flow,
    })
    if (warning) {
      return NextResponse.json({ success: true, warning })
    }
  }

  // Auto-translation is intentionally NOT triggered on edit. Admins
  // should use the dedicated "Translate" dialog in the admin UI
  // (POST /api/admin/translate-trip/[id]) to re-translate after edits,
  // matching the behavior of regular trips and tournament events.

  return NextResponse.json({ success: true })
}
