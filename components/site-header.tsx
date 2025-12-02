"use client"

import Link from "next/link"
import { UserNav } from "@/components/user-nav"
import { Globe, Menu, X } from "lucide-react"
import { useState } from "react"

type SiteHeaderProps = {
  user?: any
  userType?: string
  className?: string
}

export function SiteHeader({ user, userType = "regular", className }: SiteHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className={`fixed top-0 z-50 w-full ${className}`}>
      <div className="relative h-[87px] bg-black/40 backdrop-blur-[7.5px]">
        <div className="px-30 bg-white/30 w-full h-full">
          <div className="flex h-full items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center">
              <img src="/logo.png" alt="4 Seasons Golf Tour" className="h-[50px] w-auto object-contain" />
            </Link>

            {/* Center Navigation */}
            <nav className="hidden md:flex items-center justify-center gap-10 absolute left-1/2 -translate-x-1/2">
              <Link href="/" className="text-white text-lg font-medium hover:text-white/80 transition-colors">
                Home
              </Link>
              <Link
                href="/destinations"
                className="text-white text-lg font-medium hover:text-white/80 transition-colors"
              >
                Destinations
              </Link>
              <Link href="/contact" className="text-white text-lg font-medium hover:text-white/80 transition-colors">
                Contact Us
              </Link>
            </nav>

            {/* Right Side - Language & Auth */}
            <div className="hidden md:flex items-center justify-center gap-[30px]">
              {/* Language Selector */}
              <div className="inline-flex items-center justify-center gap-1.5">
                <Globe className="w-4 h-4 text-white" />
                <div className="flex h-4 w-4 items-center justify-center rounded-full overflow-hidden">
                  <img src="https://flagcdn.com/w40/us.png" alt="US" className="h-full w-full object-cover" />
                </div>
                <span className="text-white text-sm">English</span>
              </div>

              {/* Auth Links */}
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

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-white"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="absolute top-full left-0 right-0 bg-white/30 backdrop-blur-[7.5px] shadow-[inset_0_1px_0_rgba(255,255,255,0.40),inset_1px_0_0_rgba(255,255,255,0.32),inset_0_-1px_5px_rgba(0,0,0,0.20),inset_-1px_0_5px_rgba(0,0,0,0.16)] border-t border-white/20 py-4 md:hidden">
            <div className="container">
              <nav className="flex flex-col gap-4">
                <Link
                  href="/"
                  className="text-white font-medium transition-colors hover:text-white/80"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Home
                </Link>
                <Link
                  href="/destinations"
                  className="text-white font-medium transition-colors hover:text-white/80"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Destinations
                </Link>
                <Link
                  href="/contact"
                  className="text-white font-medium transition-colors hover:text-white/80"
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
                        className="text-white hover:text-white/80"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Sign Up
                      </Link>
                      <Link
                        href="/auth/login"
                        className="text-white hover:text-white/80"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Log In
                      </Link>
                    </div>
                  )}
                </div>
              </nav>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
