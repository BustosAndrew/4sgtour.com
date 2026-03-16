import { SiteHeaderWrapper } from "@/components/site-header-wrapper"
import { SiteFooter } from "@/components/site-footer"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { BookingsContent } from "@/components/bookings/bookings-content"

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("email, display_name")
    .eq("id", user.id)
    .single()

  const { data: inquiries } = await supabase
    .from("inquiries")
    .select("*")
    .eq("customer_email", profile?.email || user.email)
    .order("created_at", { ascending: false })

  return (
    <div className="bg-background">
      <SiteHeaderWrapper />
      <main className="container px-4 pt-28 pb-8 sm:px-6 lg:px-8 lg:pt-32 min-h-screen">
        <BookingsContent
          inquiries={inquiries || []}
          showSuccess={params.success === "true"}
          profile={profile}
          userEmail={user.email || ""}
        />
      </main>
      <SiteFooter />
    </div>
  )
}
