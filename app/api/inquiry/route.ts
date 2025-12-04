import { NextResponse } from "next/server"
import { Resend } from "resend"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const supabase = await createClient()

    const body = await request.json()
    const {
      tripId,
      tripTitle,
      customerName,
      customerEmail,
      packageName,
      startDate,
      endDate,
      courseStartDate,
      courseEndDate,
      addOns,
      rounds,
      additionalRequests,
      totalPrice,
    } = body

    const { data: inquiry, error: dbError } = await supabase
      .from("inquiries")
      .insert({
        trip_id: tripId,
        trip_title: tripTitle,
        customer_name: customerName,
        customer_email: customerEmail,
        package_name: packageName,
        start_date: startDate,
        end_date: endDate,
        course_start_date: courseStartDate,
        course_end_date: courseEndDate,
        add_ons: addOns,
        rounds: rounds,
        additional_requests: additionalRequests,
        total_price: totalPrice,
        status: "pending",
      })
      .select()
      .single()

    if (dbError) {
      console.error("[v0] Database error:", dbError)
    }

    // Format the email content
    const emailContent = `
New Trip Inquiry

Trip: ${tripTitle}

Customer Information:
Name: ${customerName}
Email: ${customerEmail}

Booking Details:
Package: ${packageName}
Travel Dates: ${startDate} to ${endDate}
Course Dates: ${courseStartDate} to ${courseEndDate}
Selected Add-ons: ${addOns && addOns.length > 0 ? addOns.join(", ") : "None"}
Number of Rounds: ${rounds}

Total Price: $${totalPrice}

Additional Requests:
${additionalRequests || "None"}

---
This inquiry was submitted through the booking form.
Inquiry ID: ${inquiry?.id || "N/A"}
    `.trim()

    // Send email
    const adminEmail = process.env.ADMIN_EMAIL || "admin@example.com"

    await resend.emails.send({
      from: "Golf Trips <noreply@yourdomain.com>",
      to: adminEmail,
      subject: `New Inquiry: ${tripTitle}`,
      text: emailContent,
    })

    return NextResponse.json({ success: true, inquiryId: inquiry?.id })
  } catch (error) {
    console.error("[v0] Error sending inquiry:", error)
    return NextResponse.json({ error: "Failed to send inquiry" }, { status: 500 })
  }
}
