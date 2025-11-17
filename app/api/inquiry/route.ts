import { NextResponse } from "next/server"
import { Resend } from "resend"

export async function POST(request: Request) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    
    const body = await request.json()
    const {
      tripTitle,
      roomType,
      startDate,
      endDate,
      courses,
      rounds,
      meal,
      transport,
      additionalRequests,
      totalPrice,
      customerEmail,
      customerName,
    } = body

    // Format the email content
    const emailContent = `
New Trip Inquiry

Trip: ${tripTitle}

Customer Information:
Name: ${customerName || "Not provided"}
Email: ${customerEmail || "Not provided"}

Booking Details:
Room Type: ${roomType}
Travel Dates: ${startDate} to ${endDate}
Selected Courses: ${courses.length > 0 ? courses.join(", ") : "None"}
Number of Rounds: ${rounds}
Meal Selection: ${meal || "None"}
Transportation: ${transport || "None"}

Total Price: $${totalPrice}

Additional Requests:
${additionalRequests || "None"}

---
This inquiry was submitted through the booking form.
    `.trim()

    // Send email (configure recipient in environment variable)
    const adminEmail = process.env.ADMIN_EMAIL || "admin@example.com"

    await resend.emails.send({
      from: "Golf Trips <noreply@yourdomain.com>",
      to: adminEmail,
      subject: `New Inquiry: ${tripTitle}`,
      text: emailContent,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error sending inquiry:", error)
    return NextResponse.json({ error: "Failed to send inquiry" }, { status: 500 })
  }
}
