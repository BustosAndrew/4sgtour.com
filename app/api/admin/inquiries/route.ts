import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getUserType } from "@/lib/supabase/get-user-type"

export async function GET() {
  try {
    const supabase = await createClient()
    const userType = await getUserType()

    if (userType !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get all inquiries ordered by most recent first
    const { data: inquiries, error } = await supabase
      .from("inquiries")
      .select(`
        *,
        trip:trips(title, slug)
      `)
      .order("created_at", { ascending: false })

    if (error) throw error

    return NextResponse.json({ inquiries })
  } catch (error) {
    console.error("[v0] Error fetching inquiries:", error)
    return NextResponse.json({ error: "Failed to fetch inquiries" }, { status: 500 })
  }
}
