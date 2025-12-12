import { SiteHeaderWrapper } from "@/components/site-header-wrapper"
import { SiteFooter } from "@/components/site-footer"
import { CompleteProfileForm } from "@/components/auth/complete-profile-form"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

/**
 * Complete Profile Page (Google OAuth users only)
 *
 * This page is for users who signed up via Google OAuth.
 * Since Google sign-in bypasses the regular sign-up form,
 * these users need to add and verify their phone number here.
 *
 * Regular email/password sign-ups handle phone verification
 * inline within the sign-up form itself.
 */
export default async function CompleteProfilePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // If no user is logged in, redirect to login
  if (!user) {
    redirect("/auth/login")
  }

  // If user already has phone verified, redirect to home
  const phoneVerified = user.user_metadata?.phone_verified === true
  const { data: profile } = await supabase
    .from("profiles")
    .select("phone")
    .eq("id", user.id)
    .single()

  if (phoneVerified || profile?.phone) {
    redirect("/")
  }

  return (
    <>
      <SiteHeaderWrapper />
      <CompleteProfileForm user={user} />
      <SiteFooter />
    </>
  )
}
