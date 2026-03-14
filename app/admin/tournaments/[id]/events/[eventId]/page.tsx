import { createClient } from "@/lib/supabase/server"
import { getUserType } from "@/lib/supabase/get-user-type"
import { redirect, notFound } from "next/navigation"
import { EditTournamentEventForm } from "@/components/admin/edit-tournament-event-form"

export default async function EditTournamentEventPage({
  params,
}: {
  params: Promise<{ id: string; eventId: string }>
}) {
  const { id, eventId } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const userType = await getUserType()

  if (userType !== "admin") {
    redirect("/")
  }

  const { data: tournament } = await supabase
    .from("tournaments")
    .select("id, name")
    .eq("id", id)
    .single()

  if (!tournament) {
    notFound()
  }

  const { data: event } = await supabase
    .from("tournament_events")
    .select(`
      *,
      tournament_event_itinerary_days(id, display_order, title, title_ko, title_de, content, content_ko, content_de),
      tournament_event_gallery_images(id, image_url, display_order, gallery_type),
      tournament_event_pricing_tiers(id, name, name_ko, name_de, price, display_order, booking_url)
    `)
    .eq("id", eventId)
    .eq("tournament_id", id)
    .single()

  if (!event) {
    notFound()
  }

  return (
    <EditTournamentEventForm
      event={event}
      tournamentName={tournament.name}
    />
  )
}
