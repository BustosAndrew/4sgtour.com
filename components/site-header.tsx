"use client"

import Link from "next/link"
import { UserNav } from "@/components/user-nav"
import { Globe, Menu, X, ChevronDown } from "lucide-react"
import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import "./glass.css"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type SiteHeaderProps = {
  user?: any
  userType?: string
  className?: string
}

const languages = [
  {
    code: "en",
    name: "English",
    flag: "https://flagcdn.com/w40/us.png",
    alt: "US",
  },
  {
    code: "ko",
    name: "한국어",
    flag: "https://flagcdn.com/w40/kr.png",
    alt: "Korea",
  },
]

export function SiteHeader({
  user,
  userType = "regular",
  className,
}: SiteHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [currentLanguage, setCurrentLanguage] = useState(languages[0])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const header = (
    <header className={`fixed top-0 left-0 right-0 z-50 w-full ${className}`}>
      <div className="GlassContainer">
        <div className="GlassContent h-[70px] lg:h-[87px]">
          <div className="GlassMaterial">
            <div className="GlassEdgeReflection"></div>
            <div className="GlassEmbossReflection"></div>
            <div className="GlassRefraction"></div>
            <div className="GlassBlur"></div>
            <div className="BlendLayers"></div>
            <div className="BlendEdge"></div>
            <div className="Highlight"></div>
            <div className="Brightness"></div>
          </div>

          <div className="relative z-[100] h-full w-full px-4 sm:px-6 lg:px-12 xl:px-20">
            <div className="flex h-full items-center justify-between">
              {/* Logo */}
              <Link href="/" className="flex-shrink-0">
                <img
                  src="/logo.png"
                  alt="4 Seasons Golf Tour"
                  className="h-[40px] lg:h-[50px] w-auto object-contain"
                />
              </Link>

              {/* Desktop Navigation - centered */}
              <nav className="hidden lg:flex items-center gap-6 xl:gap-10">
                <Link
                  href="/"
                  className="text-white text-base xl:text-lg font-medium hover:text-white/80 transition-colors whitespace-nowrap"
                >
                  Home
                </Link>
                <Link
                  href="/destinations"
                  className="text-white text-base xl:text-lg font-medium hover:text-white/80 transition-colors whitespace-nowrap"
                >
                  Destinations
                </Link>
                <Link
                  href="/contact"
                  className="text-white text-base xl:text-lg font-medium hover:text-white/80 transition-colors whitespace-nowrap"
                >
                  Contact Us
                </Link>
              </nav>

              {/* Desktop Right Section */}
              <div className="hidden lg:flex items-center gap-4 xl:gap-6">
                {/* Language Dropdown */}
                {mounted && (
                  <DropdownMenu modal={false}>
                    <DropdownMenuTrigger className="inline-flex items-center gap-1.5 cursor-pointer outline-none">
                      <Globe className="w-4 h-4 text-white" />
                      <div className="flex h-4 w-4 items-center justify-center rounded-full overflow-hidden">
                        <img
                          src={currentLanguage.flag || "/placeholder.svg"}
                          alt={currentLanguage.alt}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <span className="text-white text-sm">
                        {currentLanguage.name}
                      </span>
                      <ChevronDown className="w-3 h-3 text-white" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="bg-black/80 backdrop-blur-md border-white/20"
                      sideOffset={5}
                    >
                      {languages.map((lang) => (
                        <DropdownMenuItem
                          key={lang.code}
                          onClick={() => setCurrentLanguage(lang)}
                          className="flex items-center gap-2 cursor-pointer text-white hover:bg-white/20 focus:bg-white/20 focus:text-white"
                        >
                          <div className="flex h-4 w-4 items-center justify-center rounded-full overflow-hidden">
                            <img
                              src={lang.flag || "/placeholder.svg"}
                              alt={lang.alt}
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <span>{lang.name}</span>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}

                {/* Auth Links */}
                {user ? (
                  <UserNav user={user} userType={userType} />
                ) : (
                  <>
                    <Link
                      href="/auth/sign-up"
                      className="text-white text-sm hover:text-white/80 transition-colors whitespace-nowrap"
                    >
                      Sign Up
                    </Link>
                    <Link
                      href="/auth/login"
                      className="text-white text-sm hover:text-white/80 transition-colors whitespace-nowrap"
                    >
                      Log In
                    </Link>
                  </>
                )}
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden text-white p-2 -mr-2"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  )

  // Mobile menu rendered as a portal to escape stacking context
  const mobileMenu =
    mounted && mobileMenuOpen
      ? createPortal(
          <div
            className="lg:hidden fixed left-0 right-0 top-[70px] bottom-0 border-t border-white/20"
            style={{ backgroundColor: "#274C77", zIndex: 99999 }}
          >
            <div className="px-4 sm:px-6 py-6 h-full overflow-y-auto">
              <nav className="flex flex-col gap-1">
                <Link
                  href="/"
                  className="text-white font-medium hover:bg-white/10 py-3 px-4 -mx-4"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Home
                </Link>
                <Link
                  href="/destinations"
                  className="text-white font-medium hover:bg-white/10 py-3 px-4 -mx-4"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Destinations
                </Link>
                <Link
                  href="/contact"
                  className="text-white font-medium hover:bg-white/10 py-3 px-4 -mx-4"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Contact Us
                </Link>

                {/* Language Section */}
                <div className="border-t border-white/20 mt-4 pt-4">
                  <div className="text-white/60 text-sm mb-3">Language</div>
                  <div className="flex gap-2">
                    {languages.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => setCurrentLanguage(lang)}
                        className={`flex items-center gap-2 px-4 py-2 flex-1 justify-center ${
                          currentLanguage.code === lang.code
                            ? "bg-white/20 border border-white/30"
                            : "bg-white/5 border border-white/10 hover:bg-white/10"
                        } transition-colors`}
                      >
                        <div className="flex h-5 w-5 items-center justify-center rounded-full overflow-hidden">
                          <img
                            src={lang.flag || "/placeholder.svg"}
                            alt={lang.alt}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <span className="text-white text-sm">{lang.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Auth Section */}
                <div className="border-t border-white/20 mt-4 pt-4">
                  {user ? (
                    <div className="flex flex-col gap-1">
                      <div className="px-4 py-2 mb-2">
                        <div className="text-xs text-white/60 mb-1">
                          Signed in as
                        </div>
                        <div className="text-sm text-white font-medium truncate">
                          {user.email}
                        </div>
                        {userType !== "regular" && (
                          <div className="text-xs font-medium text-white/80 capitalize mt-1">
                            {userType}
                          </div>
                        )}
                      </div>
                      <Link
                        href="/bookings"
                        className="text-white font-medium hover:bg-white/10 py-3 px-4 -mx-4"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        My Bookings
                      </Link>
                      <Link
                        href="/favorites"
                        className="text-white font-medium hover:bg-white/10 py-3 px-4 -mx-4"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Favorites
                      </Link>
                      {userType === "admin" && (
                        <Link
                          href="/admin"
                          className="text-white font-medium hover:bg-white/10 py-3 px-4 -mx-4"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          Admin Dashboard
                        </Link>
                      )}
                      <button
                        onClick={async () => {
                          const supabase = (
                            await import("@/lib/supabase/client")
                          ).createClient()
                          await supabase.auth.signOut()
                          setMobileMenuOpen(false)
                          window.location.href = "/"
                        }}
                        className="text-white font-medium hover:bg-white/10 py-3 px-4 -mx-4 text-left"
                      >
                        Log Out
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-3">
                      <Link
                        href="/auth/sign-up"
                        className="flex-1 text-center py-3 bg-white text-black font-medium hover:bg-white/90 transition-colors"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Sign Up
                      </Link>
                      <Link
                        href="/auth/login"
                        className="flex-1 text-center py-3 border border-white text-white font-medium hover:bg-white/10 transition-colors"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Log In
                      </Link>
                    </div>
                  )}
                </div>
              </nav>
            </div>
          </div>,
          document.body,
        )
      : null

  return (
    <>
      {header}
      {mobileMenu}
    </>
  )
}
