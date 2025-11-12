import { createClient } from "@/lib/supabase/server"
import { getUserType } from "@/lib/supabase/get-user-type"
import { redirect } from "next/navigation"
import { notFound } from "next/navigation"
import { EditTripForm } from "@/components/admin/edit-trip-form"
import { AdminSidebar } from "@/components/admin/admin-sidebar"

interface AdminTripPageProps {
  params: Promise<{ id: string }>
}

export default async function AdminTripPage({ params }: AdminTripPageProps) {
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

  const { data: trip } = await supabase.from("trips").select("*").eq("id", id).single()

  if (!trip) {
    notFound()
  }

  const { data: profile } = await supabase.from("profiles").select("display_name, email").eq("id", user.id).single()

  return (
    <div className="flex min-h-screen">
      <AdminSidebar userName={profile?.display_name || profile?.email || "Admin"} />
      <div className="flex-1">
        {/* Header */}
        <div className="border-b bg-background px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Hello, {profile?.display_name || "Admin"}!</h1>
              <p className="text-sm text-muted-foreground">Welcome Back!</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-medium">{profile?.display_name || profile?.email}</p>
                <p className="text-xs text-muted-foreground">Admin</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-muted" />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="p-8">
          <EditTripForm trip={trip} />
        </main>
      </div>
    </div>
  )
}
