import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserType } from '@/lib/supabase/get-user-type'
import { PAYMENT_COLUMNS, toAdminPayment } from '@/lib/admin-payments'

/**
 * GET /api/admin/payments — Admin → Payments.
 *
 * Every stripe_bookings row that is waiting for money or still owes it, plus
 * the ones paid in full: pending checkouts and texted links, bank payments
 * clearing, balances due (with their charge / due date) and paid bookings.
 * Cancelled and refunded bookings are managed in Admin → Inquiries; expired
 * and failed checkouts never took money and are left out.
 *
 * Cookie-bound client: RLS lets admins read stripe_bookings, so it is a
 * second gate after getUserType().
 */
const LISTED_STATUSES = ['pending', 'processing', 'confirmed', 'completed']

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if ((await getUserType()) !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data, error } = await supabase
    .from('stripe_bookings')
    .select(PAYMENT_COLUMNS)
    .in('status', LISTED_STATUSES)
    .order('created_at', { ascending: false })
    .limit(1000)

  if (error) {
    console.error('[admin-payments] Error loading payments:', error)
    return NextResponse.json({ error: 'Failed to load payments' }, { status: 500 })
  }

  const now = Date.now()
  return NextResponse.json({
    payments: (data || []).map((row) => toAdminPayment(row, now)),
  })
}
