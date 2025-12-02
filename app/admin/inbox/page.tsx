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

  const { data: inquiries } = await supabase.from("inquiries").select("*").order("updated_at", { ascending: false })

  return (
    <div className="container mx-auto py-8">
      <h1 className="mb-6 text-3xl font-bold">Inbox - Inquiry Messages</h1>
      <InboxList inquiries={inquiries || []} />
    </div>
  )
}
