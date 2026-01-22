'use client'

import Link from 'next/link'
import { BackToTopButton } from './back-to-top-button'
import { Logo } from '@/components/logo'

export function SiteFooter() {
  return (
    <footer className="bg-[#22333b] text-white">
      <div className="container py-12">
        <div className="grid gap-8 md:grid-cols-[minmax(0,1.2fr)_minmax(0,2fr)] md:gap-x-16">
          <div className="md:w-58">
            <div className="mb-6">
              <Logo size="lg" textColor="text-white" variant="footer" />
            </div>
            <p className="text-sm leading-relaxed text-white/80 font-medium">
              4SGTour is a premier golf travel agency specializing in overseas
              golf tours. We are dedicated to providing exceptional service and
              unforgettable golf experiences around the world.
            </p>
          </div>

          {/* Link columns grouped tighter together */}
          <div className="grid gap-8 sm:grid-cols-3 sm:gap-x-6 sm:gap-y-8">
            <div>
              <h2 className="mb-2 font-sans uppercase text-[#EAE0D6] font-semibold">
                Site Map
              </h2>
              <ul className="text-sm">
                <li>
                  <Link
                    href="/"
                    className="text-white hover:text-white/80 font-semibold text-base uppercase"
                  >
                    Homepage
                  </Link>
                </li>
                <li>
                  <Link
                    href="/destinations"
                    className="text-white hover:text-white/80 font-semibold text-base uppercase"
                  >
                    Destinations
                  </Link>
                </li>
                <li>
                  <Link
                    href="/tournaments"
                    className="text-white hover:text-white/80 font-semibold text-base uppercase"
                  >
                    Tournaments
                  </Link>
                </li>
                <li>
                  <Link
                    href="/contact"
                    className="text-white hover:text-white/80 font-semibold text-base uppercase"
                  >
                    Contact Us
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h2 className="mb-2 font-sans uppercase text-[#EAE0D6] font-semibold">
                Legal
              </h2>
              <ul className="text-sm">
                <li>
                  <Link
                    href="/terms"
                    className="text-white hover:text-white/80 font-semibold text-base uppercase"
                  >
                    Terms Of Use
                  </Link>
                </li>
                <li>
                  <Link
                    href="/privacy"
                    className="text-white hover:text-white/80 font-semibold text-base uppercase"
                  >
                    Privacy Policy
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h2 className="mb-2 font-sans uppercase text-[#EAE0D6] font-semibold">
                Customer Service
              </h2>
              <ul className="text-sm">
                <li>
                  <a
                    href="tel:1-714-877-5998"
                    className="text-white hover:text-white/80 font-semibold text-base uppercase"
                  >
                    1-714-485-5463
                  </a>
                </li>
              </ul>
              <h2 className="mb-2 mt-4 font-sans uppercase text-[#EAE0D6] font-semibold">
                Other
              </h2>
              <ul className="text-sm">
                <li>
                  <a
                    href="tel:1-213-214-3355"
                    className="text-white hover:text-white/80 font-semibold text-base uppercase"
                  >
                    1-213-214-3355
                  </a>
                </li>
                <li>
                  <a
                    href="tel:070-4517-5998"
                    className="text-white hover:text-white/80 font-semibold text-base uppercase"
                  >
                    070-4517-5998
                  </a>
                </li>
                <li>
                  <a
                    href="tel:070-4517-5998"
                    className="text-white hover:text-white/80 font-semibold text-base "
                  >
                    Free To Call From South Korea to USA
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
        {/* Divider line and back to top button */}
        <div className="mt-12 pt-8">
          <div className="w-16 h-0.5 bg-white mb-6"></div>
          <BackToTopButton />
        </div>
      </div>
    </footer>
  )
}
