import { createClient } from "@/lib/supabase/server"
import { getUserType } from "@/lib/supabase/get-user-type"
import { redirect } from "next/navigation"
import { notFound } from "next/navigation"
import { EditTripForm } from "@/components/admin/edit-trip-form"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { AccountSettingsDialog } from "@/components/admin/account-settings-dialog"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

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

  // Fetch related data
  const { data: packages } = await supabase
    .from("packages")
    .select("*")
    .eq("trip_id", id)
    .order("created_at", { ascending: true })

  const { data: golfCourses } = await supabase
    .from("trip_golf_courses")
    .select("*")
    .eq("trip_id", id)
    .order("created_at", { ascending: true })

  const { data: mealOptions } = await supabase
    .from("trip_meal_options")
    .select("*")
    .eq("trip_id", id)
    .order("created_at", { ascending: true })

  const { data: transportationOptions } = await supabase
    .from("trip_transportation_options")
    .select("*")
    .eq("trip_id", id)
    .order("created_at", { ascending: true })

  // Combine all data
  const tripWithRelations = {
    ...trip,
    packages: packages || [],
    golf_courses: golfCourses || [],
    meal_options: mealOptions || [],
    transportation_options: transportationOptions || [],
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, email, phone, photo_url")
    .eq("id", user.id)
    .single()

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background px-4 py-4 sm:px-6 sm:py-6 md:px-8">
        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin">
              <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="h-4 w-4" />
                Back to Admin
              </button>
            </Link>
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
              <p className="text-xs text-muted-foreground hidden sm:block">Admin</p>
            </button>
          </AccountSettingsDialog>
        </div>
      </div>

      {/* Main Content */}
      <main className="p-4 sm:p-6 md:p-8">
        <EditTripForm trip={tripWithRelations} />
      </main>
    </div>
  )
}
