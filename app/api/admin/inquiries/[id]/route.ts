import { createClient } from "@/lib/supabase/server"
import { getUserType } from "@/lib/supabase/get-user-type"
import { NextResponse } from "next/server"

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient()
    const { id } = await params

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const userType = await getUserType()
    if (userType !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // First delete any associated messages
    const { error: messagesError } = await supabase
      .from("messages")
      .delete()
      .eq("inquiry_id", id)

    if (messagesError) {
      console.error("Error deleting messages:", messagesError)
      // Continue anyway - messages may not exist
    }

    // Delete the inquiry and verify it was deleted
    const { data, error } = await supabase
      .from("inquiries")
      .delete()
      .eq("id", id)
      .select()

    if (error) {
      console.error("Error deleting inquiry:", error)
      return NextResponse.json(
        { error: "Failed to delete inquiry" },
        { status: 500 },
      )
    }

    // Check if any row was actually deleted
    if (!data || data.length === 0) {
      console.error("No inquiry found or RLS blocked deletion for id:", id)
      return NextResponse.json(
        { error: "Inquiry not found or access denied" },
        { status: 404 },
      )
    }

    return NextResponse.json({ success: true, deleted: data.length })
  } catch (error) {
    console.error("Error in inquiry delete route:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    )
  }
}
