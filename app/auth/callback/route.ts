import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const redirect = requestUrl.searchParams.get("redirect")
  const error = requestUrl.searchParams.get("error")
  const errorDescription = requestUrl.searchParams.get("error_description")

  const origin = process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || requestUrl.origin

  if (error) {
    console.error("OAuth error:", error, errorDescription)
    return NextResponse.redirect(`${origin}/auth/login?error=${encodeURIComponent(errorDescription || error)}`)
  }

  if (code) {
    const supabase = await createClient()
    const {
      data: { session },
      error: exchangeError,
    } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      console.error("Auth callback error:", exchangeError)
      return NextResponse.redirect(`${origin}/auth/login?error=auth_failed`)
    }

    if (session?.user) {
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id, phone")
        .eq("id", session.user.id)
        .single()

      if (!existingProfile) {
        // Create profile for new OAuth user
        const { error: profileError } = await supabase.from("profiles").insert({
          id: session.user.id,
          email: session.user.email,
          display_name:
            session.user.user_metadata?.full_name ||
            session.user.user_metadata?.name ||
            session.user.email?.split("@")[0],
          user_type: "customer",
        })

        if (profileError) {
          console.error("Failed to create profile for OAuth user:", profileError)
        }
      }

      // Check if this is a Google OAuth user who needs phone verification
      const isOAuthUser = session.user.app_metadata?.provider === "google"
      const phoneVerified = session.user.user_metadata?.phone_verified === true

      // If OAuth user without verified phone, redirect to complete profile
      if (isOAuthUser && !phoneVerified && !existingProfile?.phone) {
        return NextResponse.redirect(`${origin}/auth/complete-profile`)
      }
    }
  }

  const redirectUrl = redirect ? `${origin}${redirect}` : `${origin}/`
  return NextResponse.redirect(redirectUrl)
}
