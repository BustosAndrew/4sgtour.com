import { NextResponse } from "next/server"
import { Resend } from "resend"
import { createClient } from "@/lib/supabase/server"
import { getFromEmail, getAdminEmail } from "@/lib/site-email"

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
      addOns,
      rounds,
      golfCourses,
      mealOption,
      transportOption,
      roomType,
      additionalRequests,
      totalPrice,
      guests,
    } = body

    const totalRounds = golfCourses?.length || rounds || 0

    const finalAddOns =
      addOns ||
      [
        ...(golfCourses || []),
        mealOption ? `Meals: ${mealOption}` : null,
        transportOption ? `Transport: ${transportOption}` : null,
        roomType ? `Room: ${roomType}` : null,
      ].filter(Boolean)

    const { data: inquiry, error: dbError } = await supabase
      .from("inquiries")
      .insert({
        trip_id: tripId,
        trip_title: tripTitle,
        customer_name: customerName || "Guest",
        customer_email: customerEmail || "",
        package_name: packageName,
        start_date: startDate,
        end_date: endDate,
        add_ons: finalAddOns,
        rounds: totalRounds,
        additional_requests: additionalRequests,
        total_price: totalPrice,
        guests: guests || [],
        status: "pending",
      })
      .select()
      .single()

    if (dbError) {
      console.error("[v0] Database error:", dbError)
      // Don't fail the request if DB insert fails, still send email
    }

    const emailContent = `
New Trip Inquiry

Trip: ${tripTitle}

Customer Information:
Name: ${customerName || "Guest"}
Email: ${customerEmail || "Not provided"}

Booking Details:
Package: ${packageName}
Travel Dates: ${startDate} to ${endDate}
${roomType ? `Room Type: ${roomType}` : ""}
${golfCourses?.length > 0 ? `Golf Courses: ${golfCourses.join(", ")}` : ""}
${mealOption ? `Meals: ${mealOption}` : ""}
${transportOption ? `Transportation: ${transportOption}` : ""}

Total Price: $${totalPrice}
${guests && guests.length > 0
  ? `\nAdditional Guests (${guests.length}):\n${guests.map((g: any, i: number) => `  ${i + 1}. ${g.name} | ${g.phone} | ${g.occupancy === 'single' ? 'Single Occupancy (+12%)' : 'Double Occupancy'}`).join('\n')}`
  : ''}

Additional Requests:
${additionalRequests || "None"}

---
This inquiry was submitted through the booking form.
Inquiry ID: ${inquiry?.id || "N/A"}
    `.trim()

    // Send email
    const adminEmail = getAdminEmail()

    await resend.emails.send({
      from: getFromEmail(),
      replyTo: customerEmail,
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
