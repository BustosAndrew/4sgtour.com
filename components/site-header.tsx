'use client'

import Link from 'next/link'
import Image from 'next/image'
import { UserNav } from '@/components/user-nav'
import { Menu, X } from 'lucide-react'
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { usePathname } from 'next/navigation'
import './glass.css'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

type SiteHeaderProps = {
  user?: any
  userType?: string
  className?: string
}

const languages = [
  {
    code: 'en',
    name: 'ENG',
    flag: 'https://flagcdn.com/w40/us.png',
    alt: 'US',
  },
  {
    code: 'ko',
    name: '한국어',
    flag: 'https://flagcdn.com/w40/kr.png',
    alt: 'Korea',
  },
]

export function SiteHeader({
  user,
  userType = 'regular',
  className,
}: SiteHeaderProps) {
  const pathname = usePathname()

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [currentLanguage, setCurrentLanguage] = useState(languages[0])
  const [mounted, setMounted] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Track desktop breakpoint (Tailwind lg = 1024px)
  useEffect(() => {
    if (!mounted) return

    const mq = window.matchMedia('(min-width: 1024px)')

    const update = () => setIsDesktop(mq.matches)
    update()

    // Support older Safari
    if (typeof mq.addEventListener === 'function') {
      mq.addEventListener('change', update)
      return () => mq.removeEventListener('change', update)
    } else {
      mq.addListener(update)
      return () => mq.removeListener(update)
    }
  }, [mounted])

  useEffect(() => {
    if (!mounted) return

    const update = () => {
      setIsScrolled(window.scrollY > 8)
    }

    update()
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [mounted])

  // Force white header ONLY on desktop for these routes
  const forceWhiteHeaderRoutes =
    pathname.startsWith('/destinations') || pathname.startsWith('/tournaments')

  const forceWhiteHeaderDesktopOnly = isDesktop && forceWhiteHeaderRoutes

  // This drives header + desktop styling; mobile remains scroll-driven.
  const headerIsLight = isScrolled || forceWhiteHeaderDesktopOnly

  // Header / desktop styles (can be forced by route on desktop)
  const headerBgClass = headerIsLight ? 'bg-white shadow-sm' : 'bg-transparent'
  const textClass = headerIsLight ? 'text-[#735C38]' : 'text-white'
  const textHoverClass = headerIsLight
    ? 'hover:text-[#735C38]/70'
    : 'hover:text-white/80'

  // Mobile button styles (MOBILE SHOULD ONLY CHANGE ON SCROLL)
  const mobileBorderClass = isScrolled ? 'border-black/15' : 'border-white/40'
  const mobilePillBgClass = isScrolled ? 'bg-white/70' : 'bg-black/40'
  const mobilePillTextClass = isScrolled ? 'text-[#735C38]' : 'text-white'

  const header = (
    <header
      className={`group fixed top-0 left-0 right-0 z-[40] isolate w-full h-[100px] transition-colors duration-300 ${headerBgClass} lg:bg-transparent lg:shadow-none lg:hover:bg-white lg:hover:shadow-sm ${className}`}
    >
      <div className="flex h-full w-full items-center justify-between px-6 sm:px-10 lg:px-16">
        {/* Logo */}
        <Link href="/" className="flex-shrink-0">
          <div className="relative h-10 w-[180px] sm:h-11 sm:w-[200px] lg:h-14 lg:w-[260px]">
            <Image
              src="/images/logo.png"
              alt="4 Seasons Golf"
              fill
              className={`object-contain transition-opacity duration-300 ${
                headerIsLight ? 'opacity-0' : 'opacity-100'
              } lg:opacity-100 lg:group-hover:opacity-0`}
              priority
              sizes="(min-width: 1024px) 260px, 200px"
            />
            <Image
              src="/images/logo2.png"
              alt="4 Seasons Golf"
              fill
              className={`object-contain transition-opacity duration-300 ${
                headerIsLight ? 'opacity-100' : 'opacity-0'
              } lg:opacity-0 lg:group-hover:opacity-100`}
              sizes="(min-width: 1024px) 260px, 200px"
            />
          </div>
        </Link>

        {/* Desktop Navigation - centered */}
        <nav className="hidden lg:flex items-center justify-center gap-6 xl:gap-10">
          <Link
            href="/"
            className={`${textClass} lg:text-white lg:group-hover:text-[#735C38] text-base text-[14px] font-medium ${textHoverClass} lg:hover:text-[#735C38]/70 transition-colors whitespace-nowrap uppercase`}
          >
            Home
          </Link>
          <Link
            href="/destinations"
            className={`${textClass} lg:text-white lg:group-hover:text-[#735C38] text-base text-[14px] font-medium ${textHoverClass} lg:hover:text-[#735C38]/70 transition-colors whitespace-nowrap uppercase`}
          >
            Destinations
          </Link>
          <Link
            href="/tournaments"
            className={`${textClass} lg:text-white lg:group-hover:text-[#735C38] text-base text-[14px] font-medium ${textHoverClass} lg:hover:text-[#735C38]/70 transition-colors whitespace-nowrap uppercase`}
          >
            Tournaments
          </Link>
          <Link
            href="/contact"
            className={`${textClass} lg:text-white lg:group-hover:text-[#735C38] text-base text-[14px] font-medium ${textHoverClass} lg:hover:text-[#735C38]/70 transition-colors whitespace-nowrap uppercase`}
          >
            Contact
          </Link>
        </nav>

        {/* Desktop Right Section */}
        <div className="hidden lg:flex items-center justify-end gap-4 xl:gap-6">
          {/* Language Dropdown */}
          {mounted && (
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger className="inline-flex items-center gap-1.5 cursor-pointer outline-none">
                <div className="flex h-4 w-4 items-center justify-center rounded-full overflow-hidden">
                  <img
                    src={currentLanguage.flag || '/placeholder.svg'}
                    alt={currentLanguage.alt}
                    className="h-full w-full object-cover"
                  />
                </div>
                <span
                  className={`${textClass} lg:text-white lg:group-hover:text-[#735C38] text-sm`}
                >
                  {currentLanguage.name}
                </span>
                <svg
                  width="10"
                  height="5"
                  viewBox="0 0 10 5"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className={`${textClass} lg:text-white lg:group-hover:text-[#735C38]`}
                >
                  <path
                    d="M10 8.74228e-07L5 5L0 0L10 8.74228e-07Z"
                    fill="currentColor"
                  />
                </svg>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className={
                  headerIsLight
                    ? 'bg-white/95 backdrop-blur-md border-black/10'
                    : 'bg-black/80 backdrop-blur-md border-white/20'
                }
                sideOffset={5}
              >
                {languages.map((lang) => (
                  <DropdownMenuItem
                    key={lang.code}
                    onClick={() => setCurrentLanguage(lang)}
                    className={
                      headerIsLight
                        ? 'flex items-center gap-2 cursor-pointer text-[#735C38] hover:bg-black/5 focus:bg-black/5 focus:text-[#735C38]'
                        : 'flex items-center gap-2 cursor-pointer text-white hover:bg-white/20 focus:bg-white/20 focus:text-white'
                    }
                  >
                    <div className="flex h-4 w-4 items-center justify-center rounded-full overflow-hidden">
                      <img
                        src={lang.flag || '/placeholder.svg'}
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
                href="/auth/login"
                className={`${textClass} lg:text-white lg:group-hover:text-[#735C38] text-sm ${textHoverClass} lg:hover:text-[#735C38]/70 transition-colors whitespace-nowrap uppercase`}
              >
                Sign In
              </Link>
              <Link
                href="/auth/sign-up"
                className={`${textClass} lg:text-white lg:group-hover:text-[#735C38] text-sm ${textHoverClass} lg:hover:text-[#735C38]/70 transition-colors whitespace-nowrap uppercase`}
              >
                Get Started
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button (NOW strictly scroll-driven) */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden -mr-2"
          aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileMenuOpen}
        >
          <span
            className={`inline-flex items-center gap-2 rounded-full border ${mobileBorderClass} ${mobilePillBgClass} px-3 py-1.5 text-sm font-medium ${mobilePillTextClass} shadow-sm backdrop-blur-sm transition-colors duration-300 uppercase`}
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            <span>{mobileMenuOpen ? 'Close' : 'Menu'}</span>
          </span>
        </button>
      </div>
    </header>
  )

  // Mobile menu rendered as a portal (UNCHANGED: still uses isScrolled everywhere)
  const mobileMenu =
    mounted && mobileMenuOpen
      ? createPortal(
          <div
            className={`lg:hidden fixed left-0 right-0 top-[82px] bottom-0 border-t ${
              isScrolled ? 'border-black/10' : 'border-white/20'
            }`}
            style={{
              backgroundColor: isScrolled ? '#ffffff' : 'transparent',
              zIndex: 99999,
            }}
          >
            <div
              className="px-4 sm:px-6 py-6 h-full overflow-y-auto"
              style={{ backgroundColor: isScrolled ? '#ffffff' : '#735C38' }}
            >
              <nav className="flex flex-col gap-1">
                <Link
                  href="/"
                  className={`${
                    isScrolled
                      ? 'text-[#735C38] font-medium hover:bg-black/5'
                      : 'text-white font-medium hover:bg-white/10'
                  } py-3 px-4 -mx-4 uppercase`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Home
                </Link>
                <Link
                  href="/destinations"
                  className={`${
                    isScrolled
                      ? 'text-[#735C38] font-medium hover:bg-black/5'
                      : 'text-white font-medium hover:bg-white/10'
                  } py-3 px-4 -mx-4 uppercase`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Destinations
                </Link>
                <Link
                  href="/tournaments"
                  className={`${
                    isScrolled
                      ? 'text-[#735C38] font-medium hover:bg-black/5'
                      : 'text-white font-medium hover:bg-white/10'
                  } py-3 px-4 -mx-4 uppercase`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Tournaments
                </Link>
                <Link
                  href="/contact"
                  className={`${
                    isScrolled
                      ? 'text-[#735C38] font-medium hover:bg-black/5'
                      : 'text-white font-medium hover:bg-white/10'
                  } py-3 px-4 -mx-4 uppercase`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Contact
                </Link>

                {/* Language Section */}
                <div className="border-t border-white/20 mt-4 pt-4">
                  <div
                    className={`${
                      isScrolled ? 'text-[#735C38]/60' : 'text-white/60'
                    } text-sm mb-3 uppercase`}
                  >
                    Language
                  </div>
                  <div className="flex gap-2">
                    {languages.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => setCurrentLanguage(lang)}
                        className={`flex items-center gap-2 px-4 py-2 flex-1 justify-center ${
                          currentLanguage.code === lang.code
                            ? isScrolled
                              ? 'bg-black/5 border border-black/10'
                              : 'bg-white/20 border border-white/30'
                            : isScrolled
                              ? 'bg-black/0 border border-black/10 hover:bg-black/5'
                              : 'bg-white/5 border border-white/10 hover:bg-white/10'
                        } transition-colors`}
                      >
                        <div className="flex h-5 w-5 items-center justify-center rounded-full overflow-hidden">
                          <img
                            src={lang.flag || '/placeholder.svg'}
                            alt={lang.alt}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <span
                          className={`${
                            isScrolled ? 'text-[#735C38]' : 'text-white'
                          } text-sm`}
                        >
                          {lang.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Auth Section */}
                <div className="border-t border-white/20 mt-4 pt-4">
                  {user ? (
                    <div className="flex flex-col gap-1">
                      <div className="px-4 py-2 mb-2">
                        <div
                          className={`${
                            isScrolled ? 'text-[#735C38]/60' : 'text-white/60'
                          } text-xs mb-1`}
                        >
                          Signed in as
                        </div>
                        <div
                          className={`${
                            isScrolled ? 'text-[#735C38]' : 'text-white'
                          } text-sm font-medium truncate uppercase`}
                        >
                          {user.email}
                        </div>
                        {userType !== 'regular' && (
                          <div
                            className={`${
                              isScrolled ? 'text-[#735C38]/80' : 'text-white/80'
                            } text-xs font-medium capitalize mt-1 uppercase`}
                          >
                            {userType}
                          </div>
                        )}
                      </div>
                      <Link
                        href="/bookings"
                        className={`${
                          isScrolled
                            ? 'text-[#735C38] font-medium hover:bg-black/5'
                            : 'text-white font-medium hover:bg-white/10'
                        } py-3 px-4 -mx-4 uppercase`}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        My Bookings
                      </Link>
                      <Link
                        href="/favorites"
                        className={`${
                          isScrolled
                            ? 'text-[#735C38] font-medium hover:bg-black/5'
                            : 'text-white font-medium hover:bg-white/10'
                        } py-3 px-4 -mx-4 uppercase`}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Favorites
                      </Link>
                      {userType === 'admin' && (
                        <Link
                          href="/admin"
                          className={`${
                            isScrolled
                              ? 'text-[#735C38] font-medium hover:bg-black/5'
                              : 'text-white font-medium hover:bg-white/10'
                          } py-3 px-4 -mx-4 uppercase`}
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          Admin Dashboard
                        </Link>
                      )}
                      <button
                        onClick={async () => {
                          const supabase = (
                            await import('@/lib/supabase/client')
                          ).createClient()
                          await supabase.auth.signOut()
                          setMobileMenuOpen(false)
                          window.location.href = '/'
                        }}
                        className={`${
                          isScrolled
                            ? 'text-[#735C38] font-medium hover:bg-black/5'
                            : 'text-white font-medium hover:bg-white/10'
                        } py-3 px-4 -mx-4 text-left uppercase`}
                      >
                        Log Out
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-3">
                      <Link
                        href="/auth/sign-up"
                        className="flex-1 text-center py-3 bg-white text-black font-medium hover:bg-white/90 transition-colors uppercase"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Get Started
                      </Link>
                      <Link
                        href="/auth/login"
                        className={`${
                          isScrolled
                            ? 'flex-1 text-center py-3 border border-black/20 text-[#735C38] font-medium hover:bg-black/5 transition-colors'
                            : 'flex-1 text-center py-3 border border-white text-white font-medium hover:bg-white/10 transition-colors'
                        } uppercase`}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Sign In
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