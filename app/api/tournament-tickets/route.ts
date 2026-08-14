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
      eventId,
      eventTitle,
      tierName,
      tierPrice,
      name,
      email,
      participants,
      notes,
    } = body

    if (!name || !email || !participants) {
      return NextResponse.json(
        { error: "Name, email, and number of participants are required." },
        { status: 400 },
      )
    }

    // Save to inquiries table
    const { data: inquiry, error: dbError } = await supabase
      .from("inquiries")
      .insert({
        trip_id: eventId || null,
        trip_title: eventTitle,
        customer_name: name,
        customer_email: email,
        package_name: tierName ? `${tierName}${tierPrice ? ` — ${tierPrice}` : ""}` : null,
        additional_requests: notes || null,
        participants: Number(participants),
        inquiry_type: "tournament",
        status: "pending",
      })
      .select()
      .single()

    if (dbError) {
      console.error("[v0] Tournament inquiry DB error:", dbError)
    }

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #495c48; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background-color: #f9f9f9; }
    .detail-row { padding: 8px 0; border-bottom: 1px solid #e5e5e5; }
    .detail-label { font-weight: bold; color: #22333b; }
    .detail-value { color: #555; }
    .notes-box { background-color: white; padding: 15px; border-left: 4px solid #495c48; margin: 15px 0; }
    .footer { padding: 15px; font-size: 12px; color: #666; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>New Tournament Ticket Inquiry</h2>
    </div>
    <div class="content">
      <h3 style="color: #22333b; margin-top: 0;">${eventTitle}</h3>
      ${tierName ? `<p><span class="detail-label">Package:</span> ${tierName} — ${tierPrice}</p>` : ""}

      <div class="detail-row">
        <span class="detail-label">Name:</span>
        <span class="detail-value"> ${name}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Email:</span>
        <span class="detail-value"> ${email}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Number of Participants:</span>
        <span class="detail-value"> ${participants}</span>
      </div>

      ${
        notes
          ? `
      <div class="notes-box">
        <p class="detail-label" style="margin-top:0;">Additional Notes:</p>
        <p style="margin-bottom:0;">${notes.replace(/\n/g, "<br>")}</p>
      </div>
      `
          : ""
      }
    </div>
    <div class="footer">
      <p>This inquiry was submitted through the tournament tickets form.</p>
    </div>
  </div>
</body>
</html>
    `.trim()

    const textContent = `
New Tournament Ticket Inquiry

Event: ${eventTitle}
${tierName ? `Package: ${tierName} — ${tierPrice}` : ""}

Name: ${name}
Email: ${email}
Number of Participants: ${participants}

Additional Notes:
${notes || "None"}

---
This inquiry was submitted through the tournament tickets form.
    `.trim()

    await resend.emails.send({
      from: getFromEmail(),
      replyTo: email,
      to: getAdminEmail(),
      subject: `Tournament Ticket Inquiry: ${eventTitle}`,
      html: emailHtml,
      text: textContent,
    })

    return NextResponse.json({ success: true, inquiryId: inquiry?.id })
  } catch (error) {
    console.error("Error sending tournament ticket inquiry:", error)
    return NextResponse.json(
      { error: "Failed to send inquiry" },
      { status: 500 },
    )
  }
}
