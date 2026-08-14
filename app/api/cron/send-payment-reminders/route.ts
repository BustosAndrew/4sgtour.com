import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { getSiteUrl } from "@/lib/site-url"
import twilio from "twilio"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export const dynamic = "force-dynamic"
export const maxDuration = 60

export async function GET(request: Request) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get("authorization")
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const appUrl = getSiteUrl()

    // Calculate the target date (5 days from now)
    const targetDate = new Date()
    targetDate.setDate(targetDate.getDate() + 5)
    const targetDateString = targetDate.toISOString().split("T")[0]

    console.log(
      `[v0] Payment Reminder Cron: Checking for reminders on ${targetDateString}`
    )

    // Initialize Twilio client
    const twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID!,
      process.env.TWILIO_AUTH_TOKEN!
    )

    let totalRemindersSent = 0

    // ========================================
    // Check inquiries table
    // ========================================
    const { data: inquiries, error: inquiriesError } = await supabase
      .from("inquiries")
      .select("*")
      .lt("deposit_percentage", 100) // Only partial payments
      .eq("remainder_due_date", targetDateString) // Due in 5 days
      .is("payment_reminder_sent_at", null) // Not already sent

    if (inquiriesError) {
      console.error("[v0] Error fetching inquiries:", inquiriesError)
    } else if (inquiries && inquiries.length > 0) {
      console.log(
        `[v0] Found ${inquiries.length} inquiries needing reminders`
      )

      for (const inquiry of inquiries) {
        try {
          const totalPrice = inquiry.total_price || 0
          const depositPercentage = inquiry.deposit_percentage || 30
          const remainderAmount = totalPrice * (1 - depositPercentage / 100)
          const packageName = inquiry.is_custom_package
            ? inquiry.trip_title || "Custom Package"
            : inquiry.package_name || inquiry.trip_title || "Golf Package"

          // Build message with appropriate link
          let messageBody = ""
          
          if (inquiry.is_custom_package && inquiry.id) {
            // Link to custom package page
            const packagePageUrl = `${appUrl}/package/${inquiry.id}`
            messageBody = `4 Seasons Golf Tour: Reminder - Your remaining balance of $${remainderAmount.toFixed(
              2
            )} for "${packageName}" is due in 5 days (${new Date(targetDateString).toLocaleDateString()}). View details and pay: ${packagePageUrl} Reply STOP to opt out.`
          } else if (inquiry.payment_link) {
            // Use existing payment link
            messageBody = `4 Seasons Golf Tour: Reminder - Your remaining balance of $${remainderAmount.toFixed(
              2
            )} for "${packageName}" is due in 5 days (${new Date(targetDateString).toLocaleDateString()}). Complete payment: ${inquiry.payment_link} Reply STOP to opt out.`
          } else {
            // No link available - generic reminder
            messageBody = `4 Seasons Golf Tour: Reminder - Your remaining balance of $${remainderAmount.toFixed(
              2
            )} for "${packageName}" is due in 5 days (${new Date(targetDateString).toLocaleDateString()}). Please contact us to complete payment. Reply STOP to opt out.`
          }

          // Send SMS reminder
          if (inquiry.customer_phone) {
            await twilioClient.messages.create({
              to: inquiry.customer_phone,
              from: process.env.TWILIO_PHONE_NUMBER!,
              body: messageBody,
            })

            console.log(
              `[v0] Sent reminder to ${inquiry.customer_name} (${inquiry.customer_phone})`
            )

            // Update reminder sent timestamp
            await supabase
              .from("inquiries")
              .update({ payment_reminder_sent_at: new Date().toISOString() })
              .eq("id", inquiry.id)

            totalRemindersSent++
          }
        } catch (error) {
          console.error(
            `[v0] Error sending reminder for inquiry ${inquiry.id}:`,
            error
          )
          // Continue with next inquiry
        }
      }
    }

    // ========================================
    // Check stripe_bookings table
    // ========================================
    const { data: bookings, error: bookingsError } = await supabase
      .from("stripe_bookings")
      .select("*")
      .lt("deposit_percentage", 100) // Only partial payments
      .eq("remainder_due_date", targetDateString) // Due in 5 days
      .is("payment_reminder_sent_at", null) // Not already sent

    if (bookingsError) {
      console.error("[v0] Error fetching stripe_bookings:", bookingsError)
    } else if (bookings && bookings.length > 0) {
      console.log(
        `[v0] Found ${bookings.length} stripe_bookings needing reminders`
      )

      for (const booking of bookings) {
        try {
          const totalPrice = booking.total_price || 0
          const depositPercentage = booking.deposit_percentage || 30
          const remainderAmount = totalPrice * (1 - depositPercentage / 100)
          const packageName = booking.trip_title || "Golf Package"

          // Build message
          const messageBody = booking.remainder_payment_link
            ? `4 Seasons Golf Tour: Reminder - Your remaining balance of $${remainderAmount.toFixed(
                2
              )} for "${packageName}" is due in 5 days (${new Date(targetDateString).toLocaleDateString()}). Complete payment: ${
                booking.remainder_payment_link
              } Reply STOP to opt out.`
            : `4 Seasons Golf Tour: Reminder - Your remaining balance of $${remainderAmount.toFixed(
                2
              )} for "${packageName}" is due in 5 days (${new Date(targetDateString).toLocaleDateString()}). Please contact us to complete payment. Reply STOP to opt out.`

          // Send SMS reminder
          if (booking.customer_phone) {
            await twilioClient.messages.create({
              to: booking.customer_phone,
              from: process.env.TWILIO_PHONE_NUMBER!,
              body: messageBody,
            })

            console.log(
              `[v0] Sent reminder to ${booking.customer_name} (${booking.customer_phone})`
            )

            // Update reminder sent timestamp
            await supabase
              .from("stripe_bookings")
              .update({ payment_reminder_sent_at: new Date().toISOString() })
              .eq("id", booking.id)

            totalRemindersSent++
          }
        } catch (error) {
          console.error(
            `[v0] Error sending reminder for booking ${booking.id}:`,
            error
          )
          // Continue with next booking
        }
      }
    }

    console.log(
      `[v0] Payment Reminder Cron: Sent ${totalRemindersSent} reminders`
    )

    return NextResponse.json({
      success: true,
      remindersSent: totalRemindersSent,
      targetDate: targetDateString,
    })
  } catch (error) {
    console.error("[v0] Payment Reminder Cron Error:", error)
    return NextResponse.json(
      { error: "Failed to send payment reminders" },
      { status: 500 }
    )
  }
}
