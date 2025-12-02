import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

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
    const { data: messages, error } = await supabase
      .from("messages")
      .select("*")
      .eq("inquiry_id", inquiryId)
      .order("created_at", { ascending: true })

    if (error) {
      throw error
    }

    return NextResponse.json(messages)
  } catch (error) {
    console.error("Error fetching messages:", error)
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 })
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
    const { inquiryId, messageText, isAdmin, senderName, senderEmail } = body

    if (!inquiryId || !messageText) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const { data: message, error } = await supabase
      .from("messages")
      .insert({
        inquiry_id: inquiryId,
        sender_id: user.id,
        sender_email: senderEmail || user.email,
        sender_name: senderName || user.email,
        is_admin: isAdmin || false,
        message_text: messageText,
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json(message, { status: 201 })
  } catch (error) {
    console.error("Error sending message:", error)
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 })
  }
}
