import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient()
  const { id } = await params

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { messageText } = await request.json()

    if (!messageText?.trim()) {
      return NextResponse.json(
        { error: "Message text is required" },
        { status: 400 },
      )
    }

    const { data: message, error } = await supabase
      .from("messages")
      .update({
        message_text: messageText.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("sender_id", user.id)
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json(message)
  } catch (error) {
    console.error("Error editing message:", error)
    return NextResponse.json(
      { error: "Failed to edit message" },
      { status: 500 },
    )
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient()
  const { id } = await params

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { error } = await supabase
      .from("messages")
      .delete()
      .eq("id", id)
      .eq("sender_id", user.id)

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting message:", error)
    return NextResponse.json(
      { error: "Failed to delete message" },
      { status: 500 },
    )
  }
}
