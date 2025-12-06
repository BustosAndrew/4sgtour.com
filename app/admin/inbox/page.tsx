import { createClient } from "@/lib/supabase/server"
import { getUserType } from "@/lib/supabase/get-user-type"
import { redirect } from "next/navigation"
import { InboxList } from "@/components/admin/inbox-list"

export default async function AdminInboxPage() {
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

  const { data: inquiries } = await supabase
    .from("inquiries")
    .select("*")
    .order("updated_at", { ascending: false })

  return (
    <div className="container mx-auto px-4 py-4 sm:px-6 sm:py-8">
      <h1 className="mb-4 text-2xl font-bold sm:mb-6 sm:text-3xl">
        Inbox - Inquiry Messages
      </h1>
      <InboxList inquiries={inquiries || []} />
    </div>
  )
}
