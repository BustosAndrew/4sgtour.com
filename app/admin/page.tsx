import { createClient } from "@/lib/supabase/server"
import { getUserType } from "@/lib/supabase/get-user-type"
import { redirect } from "next/navigation"
import { AdminCourses } from "@/components/admin/admin-courses"

export default async function AdminDashboardPage() {
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

  const { data: profile } = await supabase.from("profiles").select("display_name, email").eq("id", user.id).single()

  const { data: trips } = await supabase
    .from("trips")
    .select("*")
    .not("continent", "is", null)
    .order("continent", { ascending: true })
    .order("title", { ascending: true })

  return (
    <div className="min-h-screen bg-background">
      <AdminCourses userName={profile?.display_name || profile?.email || "Admin"} trips={trips || []} />
    </div>
  )
}
