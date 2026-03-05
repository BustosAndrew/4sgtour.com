import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { getUserType } from "@/lib/supabase/get-user-type"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
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
    const { data: tournament, error } = await supabase
      .from("tournaments")
      .select(`
        *,
        tournament_events(
          *,
          tournament_event_itinerary_days(*),
          tournament_event_gallery_images(*),
          tournament_event_pricing_tiers(*)
        )
      `)
      .eq("id", id)
      .single()

    if (error) throw error

    return NextResponse.json(tournament)
  } catch (error) {
    console.error("Error fetching tournament:", error)
    return NextResponse.json(
      { error: "Failed to fetch tournament" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
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
    const body = await request.json()
    // Tournament names are fixed (Masters, Ryder Cup, The Open, US Open)
    // Only images (logo and hero_image) can be updated
    const { logo, hero_image } = body

    const { data: tournament, error } = await supabase
      .from("tournaments")
      .update({
        logo: logo || null,
        hero_image: hero_image || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(tournament)
  } catch (error) {
    console.error("Error updating tournament:", error)
    return NextResponse.json(
      { error: "Failed to update tournament" },
      { status: 500 }
    )
  }
}

// DELETE is disabled - tournaments are fixed (Masters, Ryder Cup, The Open, US Open)
export async function DELETE() {
  return NextResponse.json(
    { error: "Tournament deletion is not allowed. Tournaments are fixed." },
    { status: 403 }
  )
}
