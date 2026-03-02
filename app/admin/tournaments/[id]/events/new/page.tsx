import { createClient } from "@/lib/supabase/server"
import { getUserType } from "@/lib/supabase/get-user-type"
import { redirect, notFound } from "next/navigation"
import { CreateTournamentEventForm } from "@/components/admin/create-tournament-event-form"

export default async function NewTournamentEventPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
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

  return (
    <CreateTournamentEventForm
      tournamentId={tournament.id}
      tournamentName={tournament.name}
    />
  )
}
