"use client"

import Link from "next/link"
import { UserNav } from "@/components/user-nav"
import { Globe, Menu, X, ChevronDown } from "lucide-react"
import { useState } from "react"
import "./glass.css"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

type SiteHeaderProps = {
  user?: any
  userType?: string
  className?: string
}

const languages = [
  { code: "en", name: "English", flag: "https://flagcdn.com/w40/us.png", alt: "US" },
  { code: "ko", name: "한국어", flag: "https://flagcdn.com/w40/kr.png", alt: "Korea" },
]

export function SiteHeader({ user, userType = "regular", className }: SiteHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [currentLanguage, setCurrentLanguage] = useState(languages[0])

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 w-full GlassContainer ${className}`}>
      <div className="GlassContent relative h-[87px]">
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
        <div className="px-30 w-full h-full relative z-[100]">
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
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger className="inline-flex items-center justify-center gap-1.5 cursor-pointer outline-none min-w-[100px]">
                  <Globe className="w-4 h-4 text-white" />
                  <div className="flex h-4 w-4 items-center justify-center rounded-full overflow-hidden">
                    <img
                      src={currentLanguage.flag || "/placeholder.svg"}
                      alt={currentLanguage.alt}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <span className="text-white text-sm">{currentLanguage.name}</span>
                  <ChevronDown className="w-3 h-3 text-white" />
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="bg-black/80 backdrop-blur-md border-white/20 min-w-[120px]"
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
          <div className="absolute top-full left-0 right-0 bg-black/60 backdrop-blur-lg border-t border-white/20 py-4 md:hidden shadow-lg">
            <div className="px-30">
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
                  <div className="text-white/60 text-sm mb-2">Language</div>
                  <div className="flex gap-3">
                    {languages.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => setCurrentLanguage(lang)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 ${
                          currentLanguage.code === lang.code ? "bg-white/20" : "bg-transparent hover:bg-white/10"
                        } transition-colors`}
                      >
                        <div className="flex h-4 w-4 items-center justify-center rounded-full overflow-hidden">
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
