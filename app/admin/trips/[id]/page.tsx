import { createClient } from "@/lib/supabase/server"
import { getUserType } from "@/lib/supabase/get-user-type"
import { redirect } from "next/navigation"
import { notFound } from "next/navigation"
import { EditTripForm } from "@/components/admin/edit-trip-form"
import { AdminAvatarButton } from "@/components/admin/admin-avatar-button"
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

  const { data: trip } = await supabase
    .from("trips")
    .select("*")
    .eq("id", id)
    .single()

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

  const { data: serviceOptions } = await supabase
    .from("trip_service_options")
    .select("*")
    .eq("trip_id", id)
    .order("created_at", { ascending: true })

  const { data: images } = await supabase
    .from("trip_images")
    .select("id, image_url, display_order")
    .eq("trip_id", id)
    .order("display_order", { ascending: true, nullsFirst: true })

  // Combine all data
  const tripWithRelations = {
    ...trip,
    packages: packages || [],
    golf_courses: golfCourses || [],
    meal_options: mealOptions || [],
    transportation_options: transportationOptions || [],
    service_options: serviceOptions || [],
    images: images || [],
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
          <AdminAvatarButton
            userName={profile?.display_name || profile?.email || ""}
            userEmail={profile?.email || user.email || ""}
            userPhone={profile?.phone || null}
            userPhotoUrl={profile?.photo_url || null}
          />
        </div>
      </div>

      {/* Main Content */}
      <main className="p-4 sm:p-6 md:p-8">
        <EditTripForm trip={tripWithRelations} />
      </main>
    </div>
  )
}
