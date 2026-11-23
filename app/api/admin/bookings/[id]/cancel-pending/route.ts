import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getUserType } from '@/lib/supabase/get-user-type'
import { stripe } from '@/lib/stripe'

/**
 * POST /api/admin/bookings/[id]/cancel-pending — admin only.
 *
 * Cancels a payment that was started but never made: a checkout the customer
 * opened, or an SMS payment link (/pay/[id]) that was texted. Its Stripe
 * Checkout Session is expired, so the customer can no longer pay it, and the
 * row becomes 'expired' — the status an abandoned checkout ends in anyway, so
 * it drops out of every booking list and no refund is ever owed.
 *
 * Only 'pending' rows: once money has moved (confirmed, or a bank payment
 * clearing) use Cancel booking in Admin → Inquiries, which keeps the payment
 * record for the refund.
 */
export async function POST(
  _request: Request,
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

  const service = createServiceClient()
  const { data: row, error: readError } = await service
    .from('stripe_bookings')
    .select('id, status, stripe_checkout_session_id, booking_details')
    .eq('id', id)
    .maybeSingle()
  if (readError) {
    console.error('[admin-payments] Error reading booking:', readError)
    return NextResponse.json({ error: 'Failed to load payment' }, { status: 500 })
  }
  if (!row) return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
  if (row.status !== 'pending') {
    return NextResponse.json(
      {
        error:
          row.status === 'processing'
            ? 'This bank payment has already been submitted and is clearing, so it cannot be stopped here. Once it settles, cancel the booking from Inquiries and refund it.'
            : 'This payment is no longer pending. Refresh to see its current state.',
      },
      { status: 409 },
    )
  }

  // Close the Stripe page first, so nothing can be paid after we say it's
  // cancelled. An SMS link no one has opened yet has only a 'paylink_…'
  // placeholder and no session.
  const sessionId: string | null = row.stripe_checkout_session_id
  if (sessionId && sessionId.startsWith('cs_')) {
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId)
      if (session.status === 'complete') {
        return NextResponse.json(
          {
            error:
              'The customer has just paid this. It will show as paid within a minute — refresh, and cancel the booking from Inquiries if needed.',
          },
          { status: 409 },
        )
      }
      if (session.status === 'open') {
        await stripe.checkout.sessions.expire(sessionId)
      }
    } catch (error: any) {
      // A session Stripe no longer has can't be paid either.
      if (error?.code !== 'resource_missing') {
        console.error('[admin-payments] Could not expire checkout session:', error)
        return NextResponse.json(
          { error: 'Stripe could not close the checkout. Nothing was changed; please try again.' },
          { status: 502 },
        )
      }
    }
  }

  const now = new Date().toISOString()
  const { data: updated, error: updateError } = await service
    .from('stripe_bookings')
    .update({
      status: 'expired',
      // Read by /pay/[id]: a link the admin cancelled stays closed even if
      // the customer pressed Pay at the same moment.
      booking_details: {
        ...((row.booking_details as Record<string, unknown>) || {}),
        admin_cancelled_at: now,
        admin_cancelled_by: user.id,
      },
      updated_at: now,
    })
    .eq('id', id)
    .eq('status', 'pending')
    .select('id')
  if (updateError) {
    console.error('[admin-payments] Error cancelling pending payment:', updateError)
    return NextResponse.json({ error: 'Failed to cancel payment' }, { status: 500 })
  }
  if (!updated || updated.length === 0) {
    return NextResponse.json(
      { error: 'This payment changed while cancelling it. Refresh to see its current state.' },
      { status: 409 },
    )
  }

  console.log(`[admin-payments] Pending payment ${id} cancelled by ${user.id}`)
  return NextResponse.json({ success: true })
}
