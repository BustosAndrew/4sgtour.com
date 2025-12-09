import { createClient } from "@/lib/supabase/server"
import { getUserType } from "@/lib/supabase/get-user-type"
import { NextResponse } from "next/server"

export async function PATCH(
  request: Request,
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

    // Get the new status from request body
    const { status } = await request.json()

    // Validate status
    const validStatuses = ["pending", "contacted", "converted", "cancelled"]
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    // Update the inquiry status
    const { data, error } = await supabase
      .from("inquiries")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Error updating inquiry status:", error)
      return NextResponse.json(
        { error: "Failed to update status" },
        { status: 500 },
      )
    }

    return NextResponse.json({ inquiry: data })
  } catch (error) {
    console.error("Error in status update route:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    )
  }
}
