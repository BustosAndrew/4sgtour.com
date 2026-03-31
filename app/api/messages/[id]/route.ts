import { createClient } from "@/lib/supabase/server"
import { getUserType } from "@/lib/supabase/get-user-type"
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

    const isAdmin = (await getUserType()) === "admin"

    // Build query — admins can edit any message, users only their own.
    // RLS policies enforce this at the DB level too.
    let query = supabase
      .from("messages")
      .update({
        message_text: messageText.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)

    if (!isAdmin) {
      query = query.eq("sender_id", user.id)
    }

    const { data: message, error } = await query.select().single()

    if (error) {
      throw error
    }

    if (!message) {
      return NextResponse.json(
        { error: "Message not found or not authorized" },
        { status: 404 },
      )
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
    const isAdmin = (await getUserType()) === "admin"

    let query = supabase.from("messages").delete().eq("id", id)

    if (!isAdmin) {
      query = query.eq("sender_id", user.id)
    }

    const { error } = await query

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
