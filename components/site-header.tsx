'use client'

import Link from 'next/link'
import Image from 'next/image'
import { UserNav } from '@/components/user-nav'
import { Menu, X, CalendarClock } from 'lucide-react'
import { useState, useEffect, useTransition } from 'react'
import { createPortal } from 'react-dom'
import { usePathname, useRouter } from 'next/navigation'
import { useTranslations } from '@/lib/i18n/provider'
import { setLocale } from '@/app/actions/set-locale'
import { locales, localeNames, localeFlags, type Locale } from '@/lib/i18n/config'
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
  tripMessage?: string | null
  tripDateLabel?: string | null
  currentLocale?: Locale
}

export function SiteHeader({
  user,
  userType = 'regular',
  className,
  tripMessage,
  tripDateLabel,
  currentLocale = 'en',
}: SiteHeaderProps) {
  const pathname = usePathname()
  const router = useRouter()
  const t = useTranslations('nav')
  const tAuth = useTranslations('auth')
  const [isPending, startTransition] = useTransition()

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
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

  const handleLanguageChange = (locale: Locale) => {
    startTransition(async () => {
      await setLocale(locale)
      router.refresh()
    })
  }

  // Force white header on these routes (all screen sizes)
  const forceWhiteHeaderRoutes =
    pathname.startsWith('/destinations') ||
    pathname.startsWith('/tournaments') ||
    pathname.startsWith('/contact')

  // This drives header styling
  const headerIsLight = isScrolled || forceWhiteHeaderRoutes

  // Desktop text classes: forced routes stay dark, others use hover
  const desktopTextClass = forceWhiteHeaderRoutes
    ? 'lg:text-[#735C38]'
    : 'lg:text-white lg:group-hover:text-[#735C38]'

  const desktopTextHoverClass = forceWhiteHeaderRoutes
    ? 'lg:hover:text-[#735C38]/70'
    : 'lg:hover:text-[#735C38]/70'

  // Header / desktop styles (can be forced by route)
  const headerBgClass = headerIsLight ? 'bg-white shadow-sm' : 'bg-transparent'
  const textClass = headerIsLight ? 'text-[#735C38]' : 'text-white'
  const textHoverClass = headerIsLight
    ? 'hover:text-[#735C38]/70'
    : 'hover:text-white/80'

  // Mobile button styles (MOBILE SHOULD ONLY CHANGE ON SCROLL)
  const mobileBorderClass = isScrolled ? 'border-black/15' : 'border-white/40'
  const mobilePillBgClass = isScrolled ? 'bg-white/70' : 'bg-black/40'
  const mobilePillTextClass = isScrolled ? 'text-[#735C38]' : 'text-white'

  // Desktop transparent/hover styles only when NOT forcing white
  const desktopBgClasses = forceWhiteHeaderRoutes
    ? ''
    : 'lg:bg-transparent lg:shadow-none lg:hover:bg-white lg:hover:shadow-sm'

  const currentFlag = localeFlags[currentLocale]
  const currentName = localeNames[currentLocale]

  const header = (
    <header
      className={`group fixed top-0 left-0 right-0 z-[40] isolate w-full h-[100px] transition-colors duration-300 ${headerBgClass} ${desktopBgClasses} ${className}`}
    >
      <div className="relative flex h-full w-full items-center justify-between px-6 sm:px-10 lg:px-16">
        {/* Logo */}
        <Link href="/" className="flex-shrink-0">
          <div className="relative h-10 w-[180px] sm:h-11 sm:w-[200px] lg:h-18 lg:w-[260px]">
            <Image
              src="/images/logo.png"
              alt="4 Seasons Golf"
              fill
              className={`object-contain transition-opacity duration-300 ${
                headerIsLight ? 'opacity-0' : 'opacity-100'
              } ${forceWhiteHeaderRoutes ? 'lg:opacity-0' : 'lg:opacity-100 lg:group-hover:opacity-0'}`}
              priority
              sizes="(min-width: 1024px) 260px, 200px"
            />
            <Image
              src="/images/logo2.png"
              alt="4 Seasons Golf"
              fill
              className={`object-contain transition-opacity duration-300 ${
                headerIsLight ? 'opacity-100' : 'opacity-0'
              } ${forceWhiteHeaderRoutes ? 'lg:opacity-100' : 'lg:opacity-0 lg:group-hover:opacity-100'}`}
              sizes="(min-width: 1024px) 260px, 200px"
            />
          </div>
        </Link>

        {/* Desktop Navigation - centered */}
        <nav className="hidden lg:flex lg:absolute lg:left-1/2 lg:top-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2 items-center justify-center gap-6 xl:gap-10">
          <Link
            href="/"
            className={`${textClass} ${desktopTextClass} text-base text-[14px] font-semibold ${textHoverClass} ${desktopTextHoverClass} transition-colors whitespace-nowrap uppercase`}
          >
            {t('home')}
          </Link>
          <Link
            href="/destinations"
            className={`${textClass} ${desktopTextClass} text-base text-[14px] font-semibold ${textHoverClass} ${desktopTextHoverClass} transition-colors whitespace-nowrap uppercase`}
          >
            {t('destinations')}
          </Link>
          <Link
            href="/tournaments"
            className={`${textClass} ${desktopTextClass} text-base text-[14px] font-semibold ${textHoverClass} ${desktopTextHoverClass} transition-colors whitespace-nowrap uppercase`}
          >
            {t('tournaments')}
          </Link>
          <Link
            href="/contact"
            className={`${textClass} ${desktopTextClass} text-base text-[14px] font-semibold ${textHoverClass} ${desktopTextHoverClass} transition-colors whitespace-nowrap uppercase`}
          >
            {t('contact')}
          </Link>
        </nav>

        {/* Desktop Right Section */}
        <div className="hidden lg:flex items-center justify-end gap-4 xl:gap-6">
          {/* Trip Countdown */}
          {tripMessage && (
            <div
              className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-colors duration-300 ${
                isScrolled
                  ? 'bg-[#735C38]/10 text-[#735C38]'
                  : forceWhiteHeaderRoutes
                    ? 'bg-[#735C38]/10 text-[#735C38]'
                    : 'bg-white/15 text-white lg:group-hover:bg-[#735C38]/10 lg:group-hover:text-[#735C38]'
              }`}
              title={tripDateLabel || undefined}
            >
              <CalendarClock className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="whitespace-nowrap">{tripMessage}</span>
            </div>
          )}

          {/* Language Dropdown */}
          {mounted && (
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger className="inline-flex items-center gap-1.5 cursor-pointer outline-none" disabled={isPending}>
                <div className="flex h-4 w-4 items-center justify-center rounded-full overflow-hidden">
                  <img
                    src={currentFlag.flag || '/placeholder.svg'}
                    alt={currentFlag.alt}
                    className="h-full w-full object-cover"
                  />
                </div>
                <span
                  className={`${textClass} ${desktopTextClass} text-sm font-semibold`}
                >
                  {currentName}
                </span>
                <svg
                  width="10"
                  height="5"
                  viewBox="0 0 10 5"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className={`${textClass} ${desktopTextClass}`}
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
                {locales.filter(l => l !== 'de').map((locale) => (
                  <DropdownMenuItem
                    key={locale}
                    onClick={() => handleLanguageChange(locale)}
                    className={
                      headerIsLight
                        ? 'flex items-center gap-2 cursor-pointer text-[#735C38] hover:bg-black/5 focus:bg-black/5 focus:text-[#735C38]'
                        : 'flex items-center gap-2 cursor-pointer text-white hover:bg-white/20 focus:bg-white/20 focus:text-white'
                    }
                  >
                    <div className="flex h-4 w-4 items-center justify-center rounded-full overflow-hidden">
                      <img
                        src={localeFlags[locale].flag || '/placeholder.svg'}
                        alt={localeFlags[locale].alt}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <span>{localeNames[locale]}</span>
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
                className={`${textClass} ${desktopTextClass} font-semibold text-sm ${textHoverClass} ${desktopTextHoverClass} transition-colors whitespace-nowrap uppercase`}
              >
                {t('signIn')}
              </Link>
              <Link
                href="/auth/sign-up"
                className={`${textClass} ${desktopTextClass} font-semibold text-sm ${textHoverClass} ${desktopTextHoverClass} transition-colors whitespace-nowrap uppercase`}
              >
                {t('getStarted')}
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button (NOW strictly scroll-driven) */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden -mr-2"
          aria-label={mobileMenuOpen ? t('close') : t('menu')}
          aria-expanded={mobileMenuOpen}
        >
          <span
            className={`inline-flex items-center gap-2 rounded-full border ${mobileBorderClass} ${mobilePillBgClass} px-3 py-1.5 text-sm font-medium ${mobilePillTextClass} shadow-sm backdrop-blur-sm transition-colors duration-300 uppercase`}
          >
            {mobileMenuOpen ? (
              <X className="h-4 w-4" />
            ) : (
              <Menu className="h-4 w-4" />
            )}
            <span>{mobileMenuOpen ? t('close') : t('menu')}</span>
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
            className="lg:hidden fixed left-0 right-0 top-[100px] bottom-0 border-t border-black/10"
            style={{
              backgroundColor: '#ffffff',
              zIndex: 99999,
            }}
          >
            <div
              className="px-4 sm:px-6 py-6 h-full overflow-y-auto"
              style={{ backgroundColor: '#ffffff' }}
            >
              <nav className="flex flex-col gap-1">
                {tripMessage && (
                  <div
                    className="flex items-center gap-2 px-4 -mx-4 py-3 mb-1 bg-[#735C38]/10 text-[#735C38]"
                  >
                    <CalendarClock className="h-4 w-4 flex-shrink-0" />
                    <div>
                      <span className="text-sm font-medium">{tripMessage}</span>
                      {tripDateLabel && (
                        <span
                          className="text-xs ml-2 text-[#735C38]/60"
                        >
                          ({tripDateLabel})
                        </span>
                      )}
                    </div>
                  </div>
                )}
                <Link
                  href="/"
                  className="text-[#735C38] font-medium hover:bg-black/5 py-3 px-4 -mx-4 uppercase"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t('home')}
                </Link>
                <Link
                  href="/destinations"
                  className="text-[#735C38] font-medium hover:bg-black/5 py-3 px-4 -mx-4 uppercase"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t('destinations')}
                </Link>
                <Link
                  href="/tournaments"
                  className="text-[#735C38] font-medium hover:bg-black/5 py-3 px-4 -mx-4 uppercase"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t('tournaments')}
                </Link>
                <Link
                  href="/contact"
                  className="text-[#735C38] font-medium hover:bg-black/5 py-3 px-4 -mx-4 uppercase"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t('contact')}
                </Link>

                {/* Language Section */}
                <div className="border-t border-black/10 mt-4 pt-4">
                  <div
                    className="text-[#735C38]/60 text-sm mb-3 uppercase"
                  >
                    {t('language')}
                  </div>
                  <div className="flex gap-2">
                    {locales.filter(l => l !== 'de').map((locale) => (
                      <button
                        key={locale}
                        onClick={() => {
                          handleLanguageChange(locale)
                          setMobileMenuOpen(false)
                        }}
                        disabled={isPending}
                        className={`flex items-center gap-2 px-4 py-2 flex-1 justify-center ${
                          currentLocale === locale
                            ? 'bg-black/5 border border-black/10'
                            : 'bg-black/0 border border-black/10 hover:bg-black/5'
                        } transition-colors disabled:opacity-50`}
                      >
                        <div className="flex h-5 w-5 items-center justify-center rounded-full overflow-hidden">
                          <img
                            src={localeFlags[locale].flag || '/placeholder.svg'}
                            alt={localeFlags[locale].alt}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <span
                          className="text-[#735C38] text-sm"
                        >
                          {localeNames[locale]}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Auth Section */}
                <div className="border-t border-black/10 mt-4 pt-4">
                  {user ? (
                    <div className="flex flex-col gap-1">
                      <div className="px-4 py-2 mb-2">
                        <div
                          className="text-[#735C38]/60 text-xs mb-1"
                        >
                          {tAuth('signedInAs')}
                        </div>
                        <div
                          className="text-[#735C38] text-sm font-medium truncate uppercase"
                        >
                          {user.email}
                        </div>
                        {userType !== 'regular' && (
                          <div
                            className="text-[#735C38]/80 text-xs font-medium capitalize mt-1 uppercase"
                          >
                            {userType}
                          </div>
                        )}
                      </div>
                      <Link
                        href="/bookings"
                        className="text-[#735C38] font-medium hover:bg-black/5 py-3 px-4 -mx-4 uppercase"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {tAuth('myBookings')}
                      </Link>
                      <Link
                        href="/favorites"
                        className="text-[#735C38] font-medium hover:bg-black/5 py-3 px-4 -mx-4 uppercase"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {tAuth('favorites')}
                      </Link>
                      {userType === 'admin' && (
                        <Link
                          href="/admin"
                          className="text-[#735C38] font-medium hover:bg-black/5 py-3 px-4 -mx-4 uppercase"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          {tAuth('adminDashboard')}
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
                        className="text-[#735C38] font-medium hover:bg-black/5 py-3 px-4 -mx-4 text-left uppercase"
                      >
                        {tAuth('logOut')}
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-3">
                      <Link
                        href="/auth/sign-up"
                        className="flex-1 text-center py-3 bg-[#735C38] text-white font-medium hover:bg-[#735C38]/90 transition-colors uppercase"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {t('getStarted')}
                      </Link>
                      <Link
                        href="/auth/login"
                        className="flex-1 text-center py-3 border border-black/20 text-[#735C38] font-medium hover:bg-black/5 transition-colors uppercase"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {t('signIn')}
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
