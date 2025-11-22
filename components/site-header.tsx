"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { UserNav } from "@/components/user-nav"
import { Menu, X } from "lucide-react"
import { useState } from "react"

type SiteHeaderProps = {
  user?: any
  userType?: string
}

export function SiteHeader({ user, userType = "regular" }: SiteHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b-1 border-black bg-white/100">
      <div className="container">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="text-xl font-semibold">
            Logo
          </Link>

          <div className="hidden items-center gap-4 md:flex">
            <div className="flex h-8 w-8 items-center justify-center rounded-full overflow-hidden">
              <img src="https://flagcdn.com/w40/us.png" alt="US" className="h-full w-full object-cover" />
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

          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden" aria-label="Toggle menu">
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="border-t border-border/40 py-4 md:hidden">
            <nav className="flex flex-col gap-4">
              <Link
                href="/"
                className="text-sm font-medium text-foreground/80 transition-colors hover:text-foreground"
                onClick={() => setMobileMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                href="/destinations"
                className="text-sm font-medium text-foreground/80 transition-colors hover:text-foreground"
                onClick={() => setMobileMenuOpen(false)}
              >
                Destinations
              </Link>
              <Link
                href="/contact"
                className="text-sm font-medium text-foreground/80 transition-colors hover:text-foreground"
                onClick={() => setMobileMenuOpen(false)}
              >
                Contact Us
              </Link>
              <div className="border-t border-border/40 pt-4">
                {user ? (
                  <div className="text-sm">Logged in as {user.email}</div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <Button variant="ghost" asChild className="w-full justify-start">
                      <Link href="/auth/sign-up" onClick={() => setMobileMenuOpen(false)}>
                        Sign Up
                      </Link>
                    </Button>
                    <Button asChild className="w-full">
                      <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)}>
                        Log In
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>

      <div className="hidden border-t-[1px] border-black md:block w-full">
        <nav className="container flex items-center justify-center gap-8 py-4">
          <Link href="/" className="font-medium transition-colors hover:text-foreground text-xl text-black">
            Home
          </Link>
          <Link href="/destinations" className="font-medium transition-colors hover:text-foreground text-xl text-black">
            Destinations
          </Link>
          <Link href="/contact" className="font-medium transition-colors hover:text-foreground text-xl text-black">
            Contact Us
          </Link>
        </nav>
      </div>
    </header>
  )
}
