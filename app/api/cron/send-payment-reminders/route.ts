import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { getSiteUrl } from "@/lib/site-url"
import { phoneForSms } from "@/lib/phone"
import twilio from "twilio"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export const dynamic = "force-dynamic"
export const maxDuration = 60

const REMINDER_DAYS_AHEAD = 5

// Texts customers 5 days before an outstanding balance is due.
//
// Driven entirely by stripe_bookings — the rows the Stripe webhook writes
// when money actually arrives — so it only ever reminds people who have paid
// a deposit and still owe the rest. (It used to read inquiries, which have no
// payment state: customers who had paid in full, never paid, or cancelled were
// told a balance was due. And its stripe_bookings branch matched a column
// nothing ever set, so card bookings were auto-charged with no heads-up.)
//
//  - auto_charge_date in 5 days, with a saved card → "will be charged
//    automatically on <date>" (standard trips, and custom packages whose
//    admin chose auto-charge)
//  - remainder_due_date in 5 days, no auto-charge → "is due on <date>", with
//    the custom-package page link where it can be paid
export async function GET(request: Request) {
  try {
    // Verify cron secret for security. Fail closed: with CRON_SECRET unset
    // the expected header would be the literal "Bearer undefined".
    const authHeader = request.headers.get("authorization")
    if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    if (
      !process.env.TWILIO_ACCOUNT_SID ||
      !process.env.TWILIO_AUTH_TOKEN ||
      !process.env.TWILIO_PHONE_NUMBER
    ) {
      console.error("[payment-reminders] Twilio is not configured")
      return NextResponse.json({ error: "Twilio is not configured" }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const appUrl = getSiteUrl()
    const twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN,
    )

    const targetDate = new Date()
    targetDate.setUTCDate(targetDate.getUTCDate() + REMINDER_DAYS_AHEAD)
    const targetDateString = targetDate.toISOString().split("T")[0]
    const displayDate = new Date(`${targetDateString}T12:00:00Z`).toLocaleDateString(
      "en-US",
      { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" },
    )

    console.log(`[payment-reminders] Checking balances due ${targetDateString}`)

    const { data: bookings, error } = await supabase
      .from("stripe_bookings")
      .select(
        "id, site_url, inquiry_id, customer_name, customer_phone, trip_title, booking_details, remaining_balance, auto_charge_date, remainder_due_date, stripe_customer_id, stripe_payment_method_id",
      )
      .in("status", ["confirmed", "completed"])
      .eq("remaining_balance_charged", false)
      .gt("remaining_balance", 0)
      .is("payment_reminder_sent_at", null)
      .or(
        `auto_charge_date.eq.${targetDateString},remainder_due_date.eq.${targetDateString}`,
      )

    if (error) {
      console.error("[payment-reminders] Error fetching bookings:", error)
      return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 })
    }

    let sent = 0
    const skipped: string[] = []

    for (const booking of bookings || []) {
      try {
        const to = phoneForSms(booking.customer_phone)
        if (!to) {
          skipped.push(booking.id)
          continue
        }

        const amount = `$${Number(booking.remaining_balance).toFixed(2)}`
        const tripName =
          (booking.booking_details as any)?.trip_title ||
          booking.trip_title ||
          "your golf trip"
        const siteUrl = (booking.site_url || appUrl).replace(/\/+$/, "")
        const willAutoCharge =
          booking.auto_charge_date === targetDateString &&
          booking.stripe_customer_id &&
          booking.stripe_payment_method_id

        let body: string
        if (willAutoCharge) {
          body = `4 Seasons Golf Tour: Reminder - the remaining balance of ${amount} for "${tripName}" will be charged automatically on ${displayDate} to the payment method used for your deposit. No action is needed. Reply STOP to opt out.`
        } else if (booking.inquiry_id) {
          body = `4 Seasons Golf Tour: Reminder - the remaining balance of ${amount} for "${tripName}" is due on ${displayDate}. Pay here: ${siteUrl}/package/${booking.inquiry_id} Reply STOP to opt out.`
        } else {
          body = `4 Seasons Golf Tour: Reminder - the remaining balance of ${amount} for "${tripName}" is due on ${displayDate}. Please contact us to complete payment. Reply STOP to opt out.`
        }

        await twilioClient.messages.create({
          to,
          from: process.env.TWILIO_PHONE_NUMBER,
          body,
        })

        await supabase
          .from("stripe_bookings")
          .update({ payment_reminder_sent_at: new Date().toISOString() })
          .eq("id", booking.id)

        sent++
        console.log(`[payment-reminders] Sent reminder for booking ${booking.id}`)
      } catch (error) {
        console.error(
          `[payment-reminders] Error sending reminder for booking ${booking.id}:`,
          error,
        )
        // Continue with next booking; it is retried tomorrow only if still
        // due tomorrow, so a failure here is logged for the admin to follow up.
      }
    }

    // Custom packages whose deposit was paid through the old pre-created
    // links, before payments were linked to their package (migration 058):
    // there is no stripe_bookings row to drive the reminder, so use the
    // inquiry. The old webhook only marked an inquiry 'converted' when its
    // deposit was paid, so these still owe the rest — payable from the page.
    const { data: legacyInquiries, error: legacyError } = await supabase
      .from("inquiries")
      .select(
        "id, site_url, customer_phone, trip_title, total_price, deposit_percentage",
      )
      .eq("is_custom_package", true)
      .in("status", ["converted", "paid", "completed"])
      .lt("deposit_percentage", 100)
      .eq("remainder_due_date", targetDateString)
      .is("payment_reminder_sent_at", null)

    if (legacyError) {
      console.error("[payment-reminders] Error fetching legacy custom packages:", legacyError)
    }

    for (const inquiry of legacyInquiries || []) {
      try {
        // Packages with linked payments were handled above.
        const { count } = await supabase
          .from("stripe_bookings")
          .select("id", { count: "exact", head: true })
          .eq("inquiry_id", inquiry.id)
        if (count && count > 0) continue

        const to = phoneForSms(inquiry.customer_phone)
        if (!to) {
          skipped.push(inquiry.id)
          continue
        }

        const totalCents = Math.round(Number(inquiry.total_price || 0) * 100)
        const depositCents = Math.round(
          totalCents * ((inquiry.deposit_percentage || 100) / 100),
        )
        const amount = `$${((totalCents - depositCents) / 100).toFixed(2)}`
        const siteUrl = (inquiry.site_url || appUrl).replace(/\/+$/, "")

        await twilioClient.messages.create({
          to,
          from: process.env.TWILIO_PHONE_NUMBER,
          body: `4 Seasons Golf Tour: Reminder - the remaining balance of ${amount} for "${inquiry.trip_title || "your golf trip"}" is due on ${displayDate}. Pay here: ${siteUrl}/package/${inquiry.id} Reply STOP to opt out.`,
        })

        await supabase
          .from("inquiries")
          .update({ payment_reminder_sent_at: new Date().toISOString() })
          .eq("id", inquiry.id)

        sent++
        console.log(`[payment-reminders] Sent legacy reminder for inquiry ${inquiry.id}`)
      } catch (error) {
        console.error(
          `[payment-reminders] Error sending legacy reminder for inquiry ${inquiry.id}:`,
          error,
        )
      }
    }

    console.log(`[payment-reminders] Sent ${sent} reminders, skipped ${skipped.length} without a phone`)

    return NextResponse.json({
      success: true,
      remindersSent: sent,
      skippedNoPhone: skipped.length,
      targetDate: targetDateString,
    })
  } catch (error) {
    console.error("[payment-reminders] Cron error:", error)
    return NextResponse.json(
      { error: "Failed to send payment reminders" },
      { status: 500 },
    )
  }
}
