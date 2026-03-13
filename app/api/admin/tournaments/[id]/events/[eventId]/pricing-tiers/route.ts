import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { getUserType } from "@/lib/supabase/get-user-type"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; eventId: string }> }
) {
  const { eventId } = await params
  const supabase = await createClient()
  const userType = await getUserType()

  if (userType !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data, error } = await supabase
    .from("tournament_event_pricing_tiers")
    .select("id, name, name_ko, name_de, price, display_order, booking_url")
    .eq("event_id", eventId)
    .order("display_order")

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}
