import { createClient } from "@/lib/supabase/server"
import { getUserType } from "@/lib/supabase/get-user-type"
import { redirect } from 'next/navigation'
import { notFound } from 'next/navigation'
import { EditTripForm } from "@/components/admin/edit-trip-form"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { AccountSettingsDialog } from "@/components/admin/account-settings-dialog"

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

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, email, phone, photo_url")
    .eq("id", user.id)
    .single()

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <AdminSidebar userName={profile?.display_name || profile?.email || "Admin"} />
      <div className="flex-1">
        {/* Header - Made mobile responsive with flex-col on mobile */}
        <div className="border-b bg-background px-4 py-4 sm:px-6 sm:py-6 md:px-8">
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl font-semibold text-foreground sm:text-2xl">
                Hello, {profile?.display_name || "Admin"}!
              </h1>
              <p className="text-sm text-muted-foreground">Welcome Back!</p>
            </div>
            <AccountSettingsDialog
              userName={profile?.display_name || profile?.email || ""}
              userEmail={profile?.email || user.email || ""}
              userPhone={profile?.phone || null}
              userPhotoUrl={profile?.photo_url || null}
            >
              <button className="flex items-center gap-3 rounded-lg p-2 hover:bg-muted/50 transition-colors">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={profile?.photo_url || undefined} alt={profile?.display_name || "Admin"} />
                  <AvatarFallback className="bg-muted text-muted-foreground">
                    {(profile?.display_name || profile?.email || "A")[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <p className="text-xs text-muted-foreground md:hidden">Admin</p>
              </button>
            </AccountSettingsDialog>
          </div>
        </div>

        {/* Main Content - Added responsive padding */}
        <main className="p-4 sm:p-6 md:p-8">
          <EditTripForm trip={trip} />
        </main>
      </div>
    </div>
  )
}
