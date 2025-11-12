import Link from "next/link"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/server"
import { UserNav } from "@/components/user-nav"

export async function SiteHeader() {
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
    // Silently handle auth errors and treat as logged out
    console.error("[v0] Auth error in header:", error)
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container">
        {/* First row: Logo on left, Language + Auth on right */}
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="text-xl font-semibold">
            Logo
          </Link>

          <div className="flex items-center gap-4">
            <div className="hidden items-center gap-2 md:flex">
              <span className="text-sm text-foreground">🇺🇸 English</span>
            </div>
            {user ? (
              <UserNav user={user} userType={userType} />
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link href="/auth/sign-up">Sign Up</Link>
                </Button>
                <Button asChild>
                  <Link href="/auth/login">Log In</Link>
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Second row: Centered navigation links */}
        <nav className="hidden items-center justify-center gap-8 border-t border-border/40 py-4 md:flex">
          <Link href="/" className="text-sm font-medium text-foreground/80 transition-colors hover:text-foreground">
            Home
          </Link>
          <Link
            href="/destinations"
            className="text-sm font-medium text-foreground/80 transition-colors hover:text-foreground"
          >
            Destinations
          </Link>
          <Link
            href="/contact"
            className="text-sm font-medium text-foreground/80 transition-colors hover:text-foreground"
          >
            Contact Us
          </Link>
        </nav>
      </div>
    </header>
  )
}
