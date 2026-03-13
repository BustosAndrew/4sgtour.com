import { createClient } from "@/lib/supabase/server"
import { getUserType } from "@/lib/supabase/get-user-type"
import { redirect } from "next/navigation"
import { AdminCourses } from "@/components/admin/admin-courses"

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ inquiryId?: string; tab?: string }>
}) {
  const params = await searchParams
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

  const { data: trips } = await supabase
    .from("trips")
    .select(
      `
      *,
      packages(id, name, price)
    `,
    )
    .order("continent", { ascending: true, nullsFirst: false })
    .order("title", { ascending: true })

  const { data: tournaments } = await supabase
    .from("tournaments")
    .select(`
      *,
      tournament_events(id, title, slug, date, image, location)
    `)
    .order("name", { ascending: true })

  return (
    <AdminCourses
      userName={profile?.display_name || profile?.email || "Admin"}
      trips={trips || []}
      tournaments={tournaments || []}
      userEmail={profile?.email || user.email || ""}
      userPhone={profile?.phone || null}
      userPhotoUrl={profile?.photo_url || null}
      initialInquiryId={params.inquiryId}
      initialTab={params.tab as "courses" | "tournaments" | "inquiries" | "inbox" | undefined}
    />
  )
}
