import { createClient } from "@/lib/supabase/server"
import { getUserType } from "@/lib/supabase/get-user-type"
import { redirect } from "next/navigation"
import { AdminTournaments } from "@/components/admin/admin-tournaments"

export default async function AdminTournamentsPage() {
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

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, email, phone, photo_url")
    .eq("id", user.id)
    .single()

  const { data: tournaments } = await supabase
    .from("tournaments")
    .select(`
      *,
      tournament_events(id, name, slug, event_date, image_url, location)
    `)
    .order("name", { ascending: true })

  return (
    <AdminTournaments
      userName={profile?.display_name || profile?.email || "Admin"}
      tournaments={tournaments || []}
      userEmail={profile?.email || user.email || ""}
      userPhone={profile?.phone || null}
      userPhotoUrl={profile?.photo_url || null}
    />
  )
}
