import { createClient } from "@/lib/supabase/server"
import { getUserType } from "@/lib/supabase/get-user-type"
import { redirect, notFound } from "next/navigation"
import { EditTournamentForm } from "@/components/admin/edit-tournament-form"

export default async function EditTournamentPage({
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
    .select("*")
    .eq("id", id)
    .single()

  if (!tournament) {
    notFound()
  }

  return <EditTournamentForm tournament={tournament} />
}
