import { createClient } from "./server"

export async function getUserType(): Promise<"regular" | "admin"> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return "regular"
    }

    const { data: profile, error } = await supabase.from("profiles").select("user_type").eq("id", user.id).single()

    if (error) {
      console.error("[v0] Error fetching user profile:", error.message)
      return "regular"
    }

    return (profile?.user_type as "regular" | "admin") || "regular"
  } catch (error) {
    console.error("[v0] Unexpected error in getUserType:", error)
    return "regular"
  }
}
