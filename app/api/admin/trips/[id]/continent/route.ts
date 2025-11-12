import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getUserType } from "@/lib/supabase/get-user-type"

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Check auth
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userType = await getUserType()

    if (userType !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Get continent from request body
    const { continent } = await request.json()

    if (!continent) {
      return NextResponse.json({ error: "Continent is required" }, { status: 400 })
    }

    // Update trip continent
    const { error } = await supabase.from("trips").update({ continent }).eq("id", id)

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating trip continent:", error)
    return NextResponse.json({ error: "Failed to update continent" }, { status: 500 })
  }
}
