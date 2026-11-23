import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserType } from '@/lib/supabase/get-user-type'
import { getDefaultCardFeePercent } from '@/lib/card-fee-settings'
import {
  CARD_FEE_SETTING_KEY,
  MAX_CARD_FEE_PERCENT,
} from '@/lib/booking-price'

/**
 * The default credit card fee (Admin → Payments). Admin only; the
 * cookie-bound client, so RLS (admins write app_settings and trips) is a
 * second gate after getUserType().
 *
 * GET → { percent, tripsUsingOther }: the default, and how many trips have a
 *        different fee of their own.
 * PUT { percent, applyToAllTrips } → saves the default for new trips; with
 *        applyToAllTrips, also sets every existing trip (custom packages too)
 *        to it. Bookings already made keep the fee they were made with.
 */

async function requireAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }
  if ((await getUserType()) !== 'admin') {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }
  return { supabase, user }
}

export async function GET() {
  const auth = await requireAdmin()
  if ('error' in auth) return auth.error
  const { supabase } = auth

  const percent = await getDefaultCardFeePercent(supabase)
  const { count, error } = await supabase
    .from('trips')
    .select('id', { count: 'exact', head: true })
    .neq('credit_card_fee_percent', percent)
  if (error) console.error('[card-fee] Could not count trips:', error)

  return NextResponse.json({ percent, tripsUsingOther: count ?? null })
}

export async function PUT(request: Request) {
  const auth = await requireAdmin()
  if ('error' in auth) return auth.error
  const { supabase, user } = auth

  const body = await request.json().catch(() => null)
  const percent = Number(body?.percent)
  if (
    body?.percent === '' ||
    body?.percent === null ||
    !Number.isFinite(percent) ||
    percent < 0 ||
    percent > MAX_CARD_FEE_PERCENT
  ) {
    return NextResponse.json(
      { error: `Enter a percentage from 0 to ${MAX_CARD_FEE_PERCENT}.` },
      { status: 400 },
    )
  }
  const value = Math.round(percent * 100) / 100
  const now = new Date().toISOString()

  const { error: settingError } = await supabase.from('app_settings').upsert({
    key: CARD_FEE_SETTING_KEY,
    value,
    updated_at: now,
    updated_by: user.id,
  })
  if (settingError) {
    console.error('[card-fee] Could not save the default card fee:', settingError)
    return NextResponse.json({ error: 'Failed to save the setting' }, { status: 500 })
  }

  let tripsUpdated = 0
  if (body?.applyToAllTrips === true) {
    const { data, error } = await supabase
      .from('trips')
      .update({ credit_card_fee_percent: value, updated_at: now })
      .neq('credit_card_fee_percent', value)
      .select('id')
    if (error) {
      console.error('[card-fee] Could not apply the fee to all trips:', error)
      return NextResponse.json(
        { error: 'The default was saved, but applying it to existing trips failed.' },
        { status: 500 },
      )
    }
    tripsUpdated = data?.length ?? 0
  }

  console.log(
    `[card-fee] Default card fee set to ${value}% by ${user.id}${
      body?.applyToAllTrips === true ? ` and applied to ${tripsUpdated} trips` : ''
    }`,
  )
  return NextResponse.json({ percent: value, tripsUpdated })
}
