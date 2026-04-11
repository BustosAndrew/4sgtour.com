import { createClient } from "@/lib/supabase/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { getUserType } from "@/lib/supabase/get-user-type"
import { NextResponse } from "next/server"

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient()
    const { id } = await params
    console.log("[v0] DELETE inquiry route called with id:", id)

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    console.log("[v0] User authenticated:", !!user, user?.id)

    if (!user) {
      console.log("[v0] Returning 401 - no user")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const userType = await getUserType()
    console.log("[v0] User type:", userType)
    if (userType !== "admin") {
      console.log("[v0] Returning 403 - not admin")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Use service role client for admin operations to bypass RLS
    console.log("[v0] Creating admin client with service role")
    console.log("[v0] SUPABASE_URL exists:", !!process.env.NEXT_PUBLIC_SUPABASE_URL)
    console.log("[v0] SERVICE_ROLE_KEY exists:", !!process.env.SUPABASE_SERVICE_ROLE_KEY)
    const adminClient = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    // First delete any associated messages
    const { error: messagesError } = await adminClient
      .from("messages")
      .delete()
      .eq("inquiry_id", id)

    if (messagesError) {
      console.error("Error deleting messages:", messagesError)
      // Continue anyway - messages may not exist
    }

    // Delete the inquiry and verify it was deleted
    const { data, error } = await adminClient
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
      console.error("No inquiry found for id:", id)
      return NextResponse.json(
        { error: "Inquiry not found" },
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
