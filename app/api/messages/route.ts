import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { Resend } from "resend"
import { getSiteUrl } from "@/lib/site-url"
import { getFromEmail, getAdminEmail, getSupportEmail } from "@/lib/site-email"
import { getUserType } from "@/lib/supabase/get-user-type"
import { escapeHtml, escapeHtmlMultiline } from "@/lib/escape-html"
import { resolveConversationInquiryId } from "@/lib/booking-conversation"

export async function GET(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const inquiryId = searchParams.get("inquiryId")

  if (!inquiryId) {
    return NextResponse.json({ error: "Inquiry ID required" }, { status: 400 })
  }

  try {
    // The UI may pass a paid booking's id; find the inquiry holding its
    // conversation (none yet → no messages).
    const conversationId = await resolveConversationInquiryId(supabase, inquiryId, {
      create: false,
    })
    if (!conversationId) return NextResponse.json([])

    const { data: messages, error } = await supabase
      .from("messages")
      .select("*")
      .eq("inquiry_id", conversationId)
      .order("created_at", { ascending: true })

    if (error) {
      throw error
    }

    return NextResponse.json(messages)
  } catch (error) {
    console.error("Error fetching messages:", error)
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { inquiryId: requestedId, messageText, senderName } = body

    if (!requestedId || !messageText) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      )
    }

    // Paid bookings are listed by booking id; messages need an inquiry.
    // Find the booking's conversation, or start one (lib/booking-conversation.ts).
    const inquiryId = await resolveConversationInquiryId(supabase, requestedId, {
      create: true,
    })
    if (!inquiryId) {
      return NextResponse.json({ error: "Inquiry not found" }, { status: 404 })
    }

    // Decided here, never taken from the browser: a customer sending
    // isAdmin=true could post "as the team", and the flag also decides who
    // is emailed. The RLS insert policy enforces the same (migration 059).
    const isAdmin = (await getUserType()) === "admin"

    const { data: message, error } = await supabase
      .from("messages")
      .insert({
        inquiry_id: inquiryId,
        sender_id: user.id,
        sender_email: user.email,
        sender_name: (isAdmin && senderName) || senderName || user.email,
        is_admin: isAdmin,
        message_text: messageText,
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    // Send email notification
    try {
      const resend = new Resend(process.env.RESEND_API_KEY)

      // Read with the sender's own session: an admin may read every inquiry,
      // a customer only their own. (The old fallback to customer details
      // sent in the request body let the caller choose who got emailed.)
      const { data: inquiry } = await supabase
        .from("inquiries")
        .select("trip_title, customer_name, customer_email, site_url")
        .eq("id", inquiryId)
        .single()

      if (inquiry) {
        // The site the customer used — this route can run on any of the
        // three deployments (an admin replying from 4sgtour.com to a .de
        // customer must still send .de mail with .de links).
        const siteUrl = (inquiry.site_url || getSiteUrl()).replace(/\/+$/, "")
        const tripTitle = escapeHtml(inquiry.trip_title)
        const customerName = escapeHtml(inquiry.customer_name)
        const messageHtml = escapeHtmlMultiline(messageText)

        if (isAdmin) {
          // Admin sent message -> notify customer
          const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #274C77; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background-color: #f9f9f9; }
    .message-box { background-color: white; padding: 15px; border-left: 4px solid #6096BA; margin: 15px 0; }
    .cta-button { display: inline-block; background-color: #6096BA; color: white; padding: 12px 24px; text-decoration: none; margin-top: 15px; }
    .footer { padding: 15px; font-size: 12px; color: #666; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>New Message About Your Trip</h2>
    </div>
    <div class="content">
      <p>Hello ${customerName},</p>
      <p>You have received a new message regarding your inquiry for <strong>"${tripTitle}"</strong>.</p>

      <div class="message-box">
        <p><strong>Message from our team:</strong></p>
        <p>${messageHtml}</p>
      </div>

      <p>You can respond in two ways:</p>
      <ul>
        <li><strong>Reply directly</strong> to this email</li>
        <li><strong>Log in</strong> to your account for the full conversation</li>
      </ul>

      <a href="${siteUrl}/bookings" class="cta-button">View Your Inquiries</a>
    </div>
    <div class="footer">
      <p>This email was sent regarding your inquiry. Reply directly or log in to continue the conversation.</p>
    </div>
  </div>
</body>
</html>
          `.trim()

          await resend.emails.send({
            from: getFromEmail(inquiry.site_url),
            replyTo: getSupportEmail(inquiry.site_url),
            to: inquiry.customer_email,
            subject: `New Message: ${inquiry.trip_title}`,
            html: emailHtml,
            text: `Hello ${inquiry.customer_name},\n\nYou have received a new message regarding your inquiry for "${inquiry.trip_title}".\n\nMessage from our team:\n${messageText}\n\n---\nYou can reply directly to this email or log in to your account to view the full conversation.\n\nView your inquiries: ${siteUrl}/bookings`,
          })
        } else {
          // Customer sent message -> notify admin. The inbox is a tab on
          // /admin (there is no /admin/inbox page).
          const inboxUrl = `${siteUrl}/admin?tab=inbox&inquiryId=${encodeURIComponent(inquiryId)}`

          const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #274C77; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background-color: #f9f9f9; }
    .customer-info { background-color: #e8f4f8; padding: 10px 15px; margin-bottom: 15px; }
    .message-box { background-color: white; padding: 15px; border-left: 4px solid #6096BA; margin: 15px 0; }
    .cta-button { display: inline-block; background-color: #274C77; color: white; padding: 12px 24px; text-decoration: none; margin-top: 15px; }
    .footer { padding: 15px; font-size: 12px; color: #666; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>New Customer Message</h2>
    </div>
    <div class="content">
      <p>A customer has sent a new message regarding <strong>"${tripTitle}"</strong>.</p>

      <div class="customer-info">
        <strong>Customer:</strong> ${customerName}<br>
        <strong>Email:</strong> ${escapeHtml(inquiry.customer_email)}
      </div>

      <div class="message-box">
        <p><strong>Message:</strong></p>
        <p>${messageHtml}</p>
      </div>

      <p>You can respond in two ways:</p>
      <ul>
        <li><strong>Reply directly</strong> to this email (goes to customer)</li>
        <li><strong>Use the admin dashboard</strong> for full conversation history</li>
      </ul>

      <a href="${inboxUrl}" class="cta-button">Open Admin Inbox</a>
    </div>
    <div class="footer">
      <p>Reply directly to respond to the customer via email.</p>
    </div>
  </div>
</body>
</html>
          `.trim()

          await resend.emails.send({
            from: getFromEmail(inquiry.site_url),
            replyTo: inquiry.customer_email,
            to: getAdminEmail(inquiry.site_url),
            subject: `New Customer Message: ${inquiry.trip_title}`,
            html: emailHtml,
            text: `New message from ${inquiry.customer_name} (${inquiry.customer_email}) regarding "${inquiry.trip_title}".\n\nMessage:\n${messageText}\n\n---\nReply directly to this email to respond to the customer, or log in to the admin dashboard.\n\nAdmin Inbox: ${inboxUrl}`,
          })
        }
      }
    } catch (emailError) {
      // Log email error but don't fail the request
      console.error("Error sending notification email:", emailError)
    }

    return NextResponse.json(message, { status: 201 })
  } catch (error) {
    console.error("Error sending message:", error)
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 },
    )
  }
}
