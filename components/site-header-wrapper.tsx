import { createClient } from "@/lib/supabase/server"
import { SiteHeader } from "@/components/site-header"

export async function SiteHeaderWrapper() {
  const supabase = await createClient()

  let user = null
  let userType = "regular"

  try {
    const { data, error } = await supabase.auth.getUser()

    if (!error && data.user) {
      user = data.user
      const { data: profile } = await supabase.from("profiles").select("user_type").eq("id", user.id).single()
      if (profile) {
        userType = profile.user_type
      }
    }
  } catch (error) {
    console.error("[v0] Auth error in header:", error)
  }

  return <SiteHeader user={user} userType={userType} />
}
