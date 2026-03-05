import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { getUserType } from "@/lib/supabase/get-user-type"

export async function GET() {
  const supabase = await createClient()

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

  try {
    const { data: tournaments, error } = await supabase
      .from("tournaments")
      .select(`
        *,
        tournament_events(id, title, slug, date, image, location)
      `)
      .order("name", { ascending: true })

    if (error) throw error

    return NextResponse.json(tournaments)
  } catch (error) {
    console.error("Error fetching tournaments:", error)
    return NextResponse.json(
      { error: "Failed to fetch tournaments" },
      { status: 500 }
    )
  }
}

// POST is disabled - tournaments are fixed (Masters, Ryder Cup, The Open, US Open)
export async function POST() {
  return NextResponse.json(
    { error: "Tournament creation is not allowed. Tournaments are fixed." },
    { status: 403 }
  )
}
