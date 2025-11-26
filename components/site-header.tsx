"use client"

import Link from "next/link"
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
    <header className="sticky top-0 z-50 w-full bg-gray-500/70 backdrop-blur-md">
      <div className="container">
        <div className="flex h-20 items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="h-12 w-12 bg-white/20 rounded flex items-center justify-center">
              <span className="text-white text-xs font-bold">LOGO</span>
            </div>
            <div className="flex flex-col">
              <span className="text-white font-bold text-sm tracking-wide">4 SEASONS</span>
              <span className="text-white font-bold text-sm tracking-wide">GOLF TOUR</span>
              <span className="text-white/80 text-[10px] italic">Customize Golf Journey</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-12">
            <Link href="/" className="text-white font-medium text-lg hover:text-white/80 transition-colors">
              Home
            </Link>
            <Link href="/destinations" className="text-white font-medium text-lg hover:text-white/80 transition-colors">
              Destinations
            </Link>
            <Link href="/contact" className="text-white font-medium text-lg hover:text-white/80 transition-colors">
              Contact Us
            </Link>
          </nav>

          <div className="hidden items-center gap-6 md:flex">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full overflow-hidden border border-white/30">
                <img src="https://flagcdn.com/w40/us.png" alt="US" className="h-full w-full object-cover" />
              </div>
              <span className="text-white text-sm">English</span>
            </div>
            {user ? (
              <UserNav user={user} userType={userType} />
            ) : (
              <>
                <Link href="/auth/sign-up" className="text-white text-sm hover:text-white/80 transition-colors">
                  Sign Up
                </Link>
                <Link href="/auth/login" className="text-white text-sm hover:text-white/80 transition-colors">
                  Log In
                </Link>
              </>
            )}
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-white"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="border-t border-white/20 py-4 md:hidden">
            <nav className="flex flex-col gap-4">
              <Link
                href="/"
                className="text-sm font-medium text-white/90 transition-colors hover:text-white"
                onClick={() => setMobileMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                href="/destinations"
                className="text-sm font-medium text-white/90 transition-colors hover:text-white"
                onClick={() => setMobileMenuOpen(false)}
              >
                Destinations
              </Link>
              <Link
                href="/contact"
                className="text-sm font-medium text-white/90 transition-colors hover:text-white"
                onClick={() => setMobileMenuOpen(false)}
              >
                Contact Us
              </Link>
              <div className="border-t border-white/20 pt-4">
                {user ? (
                  <div className="text-sm text-white">Logged in as {user.email}</div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <Link
                      href="/auth/sign-up"
                      className="text-white/90 hover:text-white"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Sign Up
                    </Link>
                    <Link
                      href="/auth/login"
                      className="text-white/90 hover:text-white"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Log In
                    </Link>
                  </div>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>

      <div className="h-[2px] w-full bg-gradient-to-b from-gray-400/50 to-transparent" />
    </header>
  )
}
