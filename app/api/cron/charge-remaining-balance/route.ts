import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'
import { getFromEmail, getAdminEmail } from '@/lib/site-email'
import { getSiteUrl } from '@/lib/site-url'
import { cardFeeCents } from '@/lib/booking-price'
import { isCardPaymentMethod } from '@/lib/stripe-card-fee'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-02-25.clover',
})

// Use service role for cron (bypasses RLS)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

// A declined remaining-balance charge is retried on this many daily runs
// (attempts are counted in stripe_bookings.charge_attempts, migration 059).
const MAX_CHARGE_ATTEMPTS = 3

// Verify cron secret to prevent unauthorized access
const CRON_SECRET = process.env.CRON_SECRET

export async function GET(request: Request) {
  const headersList = await headers()
  const authHeader = headersList.get('authorization')

  // Verify cron secret (Vercel Cron sends this automatically). Fail CLOSED:
  // this job charges real cards for every site's bookings, so a deployment
  // without CRON_SECRET must refuse rather than run for anyone who asks
  // (it used to skip the check entirely when the secret was unset).
  if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
    console.error('[v0] Unauthorized cron access attempt')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  console.log('[v0] Starting remaining balance charge cron job')

  try {
    // Find all bookings that need to be charged today or earlier
    const today = new Date().toISOString().split('T')[0]
    
    const { data: bookings, error: fetchError } = await supabase
      .from('stripe_bookings')
      .select('*')
      .eq('status', 'confirmed')
      .eq('remaining_balance_charged', false)
      .lte('auto_charge_date', today)
      .gt('remaining_balance', 0)
      .not('stripe_customer_id', 'is', null)
      .not('stripe_payment_method_id', 'is', null)

    if (fetchError) {
      console.error('[v0] Error fetching bookings to charge:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 })
    }

    if (!bookings || bookings.length === 0) {
      console.log('[v0] No bookings to charge today')
      return NextResponse.json({ 
        success: true, 
        message: 'No bookings to charge',
        charged: 0 
      })
    }

    console.log(`[v0] Found ${bookings.length} bookings to charge`)

    const results = {
      success: [] as string[],
      failed: [] as { id: string; error: string }[],
    }

    for (const booking of bookings) {
      try {
        // Check if the trip still exists (may have been deleted/cancelled)
        const { data: trip } = await supabase
          .from('trips')
          .select('id')
          .eq('id', booking.trip_id)
          .single()

        if (!trip) {
          console.log(`[v0] Skipping booking ${booking.id} - trip ${booking.trip_id} no longer exists`)
          // Mark as cancelled to prevent future charge attempts
          await supabase
            .from('stripe_bookings')
            .update({
              status: 'cancelled',
              remaining_balance_charged: true,
              updated_at: new Date().toISOString(),
            })
            .eq('id', booking.id)
          continue
        }

        // The card processing fee applies whenever the saved method is a
        // card — decided from the payment method itself, because SMS-link and
        // custom-package bookings are recorded as 'sms_link' even when the
        // customer paid by card.
        const remainingBalanceCents = Math.round(booking.remaining_balance * 100)
        const isCard = await isCardPaymentMethod(
          stripe,
          booking.stripe_payment_method_id,
        )
        const processingFee = isCard ? cardFeeCents(remainingBalanceCents) : 0
        const totalChargeCents = remainingBalanceCents + processingFee

        console.log(`[v0] Charging booking ${booking.id}: $${(totalChargeCents / 100).toFixed(2)}`)

        // Create a payment intent and charge immediately
        const paymentIntent = await stripe.paymentIntents.create({
          amount: totalChargeCents,
          currency: 'usd',
          customer: booking.stripe_customer_id,
          payment_method: booking.stripe_payment_method_id,
          off_session: true,
          confirm: true,
          description: `Remaining balance for ${booking.booking_details?.trip_title || 'Golf Trip'} - ${booking.booking_details?.package_name || 'Package'}`,
          metadata: {
            booking_id: booking.id,
            trip_id: booking.trip_id,
            type: 'remaining_balance',
            original_remaining_balance: String(booking.remaining_balance),
            processing_fee: String(processingFee / 100),
          },
        }, {
          // One charge per booking per day: a re-run (or a run whose DB
          // update failed) gets the same PaymentIntent back from Stripe
          // instead of charging again. A declined card still retries the
          // next day under a new key. ('-fee' keeps a key used before the
          // card fee applied here from being replayed with a new amount.)
          idempotencyKey: `remaining-balance-${booking.id}-${today}-fee`,
        })

        if (paymentIntent.status === 'succeeded') {
          // Update the booking record
          const { error: updateError } = await supabase
            .from('stripe_bookings')
            .update({
              remaining_balance_charged: true,
              remaining_balance_charged_at: new Date().toISOString(),
              remaining_balance_payment_intent_id: paymentIntent.id,
              total_paid: Number(booking.total_paid || 0) + totalChargeCents / 100,
              // Every card fee collected, not only the deposit's.
              processing_fee: Number(booking.processing_fee || 0) + processingFee / 100,
            })
            .eq('id', booking.id)

          if (updateError) {
            console.error(`[v0] Error updating booking ${booking.id}:`, updateError)
          }

          // Send confirmation email
          await sendRemainingBalanceChargedEmail(booking, totalChargeCents / 100, processingFee / 100)

          results.success.push(booking.id)
          console.log(`[v0] Successfully charged booking ${booking.id}`)
        } else if (paymentIntent.status === 'processing') {
          // A US bank account debit: accepted, settling over several days.
          // Record it NOW so tomorrow's run doesn't debit the customer a
          // second time. remaining_balance_charged_at stays null until the
          // webhook's payment_intent.succeeded fills it in (and emails the
          // customer); payment_intent.payment_failed re-opens the balance.
          const { error: updateError } = await supabase
            .from('stripe_bookings')
            .update({
              remaining_balance_charged: true,
              remaining_balance_charged_at: null,
              remaining_balance_payment_intent_id: paymentIntent.id,
            })
            .eq('id', booking.id)

          if (updateError) {
            console.error(`[v0] Error recording processing charge for ${booking.id}:`, updateError)
          }
          results.success.push(booking.id)
          console.log(`[v0] Bank debit processing for booking ${booking.id}: ${paymentIntent.id}`)
        } else {
          console.error(`[v0] Payment intent status not succeeded: ${paymentIntent.status}`)
          results.failed.push({ id: booking.id, error: `Payment status: ${paymentIntent.status}` })
        }
      } catch (error: any) {
        console.error(`[v0] Error charging booking ${booking.id}:`, error)
        
        // A decline is retried on the next daily runs, up to
        // MAX_CHARGE_ATTEMPTS; then automatic charging stops for the
        // booking. (It used to retry — and email the admin — every day,
        // forever.) A card that needs the customer to authenticate (3-D
        // Secure) can never succeed off-session, so that stops at once.
        if (error.type === 'StripeCardError' || error.code === 'authentication_required') {
          const attempts = (booking.charge_attempts || 0) + 1
          const needsCustomer = error.code === 'authentication_required'
          const giveUp = needsCustomer || attempts >= MAX_CHARGE_ATTEMPTS

          const { error: updateError } = await supabase
            .from('stripe_bookings')
            .update({
              charge_attempts: attempts,
              last_charge_error: String(error.message || error.code || 'declined').slice(0, 500),
              ...(giveUp ? { auto_charge_date: null } : {}),
            })
            .eq('id', booking.id)
          if (updateError) {
            console.error(`[v0] Error recording failed charge for ${booking.id}:`, updateError)
          }

          // Admin: on the first failure and when retries stop — not daily.
          if (attempts === 1 || giveUp) {
            await sendPaymentFailedEmail(booking, error.message, { attempts, giveUp })
          }
          if (giveUp) {
            await sendBalanceUnpaidCustomerEmail(booking)
          }
        }
        
        results.failed.push({ id: booking.id, error: error.message })
      }
    }

    console.log(`[v0] Cron job completed. Success: ${results.success.length}, Failed: ${results.failed.length}`)

    return NextResponse.json({
      success: true,
      charged: results.success.length,
      failed: results.failed.length,
      details: results,
    })
  } catch (error: any) {
    console.error('[v0] Cron job error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

async function sendRemainingBalanceChargedEmail(
  booking: any,
  amountCharged: number,
  processingFee: number,
) {
  const resend = new Resend(process.env.RESEND_API_KEY)
  const chargeDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const customerEmailContent = `
Dear ${booking.customer_name},

Your remaining balance has been successfully charged for your upcoming golf trip.

PAYMENT CONFIRMATION
====================

Trip: ${booking.booking_details?.trip_title || 'Golf Trip'}
Package: ${booking.booking_details?.package_name || 'Package'}
Travel Dates: ${booking.booking_details?.start_date} to ${booking.booking_details?.end_date}

Payment Details:
- Remaining Balance: $${(amountCharged - processingFee).toFixed(2)}${processingFee > 0 ? `\n- Processing Fee: $${processingFee.toFixed(2)}` : ''}
- Total Charged: $${amountCharged.toFixed(2)}
- Payment Method: ${booking.payment_method === 'ach' ? 'Bank Transfer (ACH)' : 'Credit/Debit Card'}
- Date: ${chargeDate}

Your trip is now fully paid! We look forward to seeing you soon.

If you have any questions, please don't hesitate to contact us.

Best regards,
4 Seasons Golf Tour Team
  `.trim()

  try {
    await resend.emails.send({
      from: getFromEmail(booking.site_url),
      to: booking.customer_email,
      subject: `Payment Confirmed: Remaining Balance for ${booking.booking_details?.trip_title || 'Your Golf Trip'}`,
      text: customerEmailContent,
    })
    console.log(`[v0] Sent remaining balance charged email to ${booking.customer_email}`)
  } catch (error) {
    console.error('[v0] Error sending remaining balance charged email:', error)
  }

  // Also notify admin
  const adminEmail = getAdminEmail(booking.site_url)
  const adminEmailContent = `
REMAINING BALANCE CHARGED

Customer: ${booking.customer_name}
Email: ${booking.customer_email}
Phone: ${booking.customer_phone}

Trip: ${booking.booking_details?.trip_title || 'Golf Trip'}
Package: ${booking.booking_details?.package_name || 'Package'}
Travel Dates: ${booking.booking_details?.start_date} to ${booking.booking_details?.end_date}

Payment:
- Amount Charged: $${amountCharged.toFixed(2)}
- Payment Method: ${booking.payment_method === 'ach' ? 'ACH' : 'Card'}
- Booking ID: ${booking.id}

This booking is now fully paid.
  `.trim()

  try {
    await resend.emails.send({
      from: getFromEmail(booking.site_url),
      to: adminEmail,
      subject: `Remaining Balance Charged: ${booking.customer_name} - ${booking.booking_details?.trip_title || 'Golf Trip'}`,
      text: adminEmailContent,
    })
  } catch (error) {
    console.error('[v0] Error sending admin notification:', error)
  }
}

async function sendPaymentFailedEmail(
  booking: any,
  errorMessage: string,
  { attempts, giveUp }: { attempts: number; giveUp: boolean },
) {
  const resend = new Resend(process.env.RESEND_API_KEY)
  const adminEmail = getAdminEmail(booking.site_url)

  const status = giveUp
    ? `Automatic charging has STOPPED for this booking after ${attempts} attempt${attempts === 1 ? '' : 's'}. The customer has been emailed. Please contact them to arrange payment.`
    : `It will be retried automatically on the next daily run (attempt ${attempts} of ${MAX_CHARGE_ATTEMPTS}). You'll be emailed again only if it still fails after the last attempt.`

  const adminEmailContent = `
PAYMENT FAILED - ${giveUp ? 'ACTION REQUIRED' : 'WILL RETRY'}

A remaining balance charge has failed.

${status}

Customer: ${booking.customer_name}
Email: ${booking.customer_email}
Phone: ${booking.customer_phone}

Trip: ${booking.booking_details?.trip_title || 'Golf Trip'}
Travel Dates: ${booking.booking_details?.start_date} to ${booking.booking_details?.end_date}

Failed Payment:
- Amount: $${booking.remaining_balance.toFixed(2)}
- Error: ${errorMessage}
- Booking ID: ${booking.id}

- Attempt: ${attempts} of ${MAX_CHARGE_ATTEMPTS}
  `.trim()

  try {
    await resend.emails.send({
      from: getFromEmail(booking.site_url),
      to: adminEmail,
      subject: giveUp
        ? `URGENT: Payment Failed - ${booking.customer_name}`
        : `Payment Failed (will retry) - ${booking.customer_name}`,
      text: adminEmailContent,
    })
  } catch (error) {
    console.error('[v0] Error sending payment failed email:', error)
  }
}

/** Retries are over: tell the customer their balance still needs paying. */
async function sendBalanceUnpaidCustomerEmail(booking: any) {
  if (!booking.customer_email) return
  const resend = new Resend(process.env.RESEND_API_KEY)
  const siteUrl = (booking.site_url || getSiteUrl()).replace(/\/+$/, '')
  const trip = booking.booking_details?.trip_title || booking.trip_title || 'your golf trip'
  const amount = `$${Number(booking.remaining_balance || 0).toFixed(2)}`
  const howToPay = booking.inquiry_id
    ? `You can pay it with a card or bank account here:\n${siteUrl}/package/${booking.inquiry_id}`
    : `Please reply to this email or contact us so we can arrange payment.`

  try {
    await resend.emails.send({
      from: getFromEmail(booking.site_url),
      replyTo: getAdminEmail(booking.site_url),
      to: booking.customer_email,
      subject: `Action needed: remaining balance for ${trip}`,
      text: `Dear ${booking.customer_name},

We weren't able to charge the remaining balance of ${amount} for ${trip} to the payment method on file.

${howToPay}

Best regards,
4 Seasons Golf Tour Team`,
    })
  } catch (error) {
    console.error('[v0] Error sending balance unpaid email:', error)
  }
}
