'use client'

import Link from 'next/link'
import { BackToTopButton } from './back-to-top-button'
import { Logo } from '@/components/logo'

export function SiteFooter() {
  return (
    <footer className="bg-[#22333b] text-white">
      <div className="container py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <div className="mb-6">
              <Logo size="md" textColor="text-white" variant="footer" />
            </div>
            <p className="text-sm leading-relaxed text-white/80 font-medium font-serif">
              4SGTour is a premier golf travel agency specializing in overseas
              golf tours. We are dedicated to providing exceptional service and
              unforgettable golf experiences around the world.
            </p>
          </div>

          <div>
            <h3 className="mb-4 font-sans uppercase tracking-wider">
              Site Map
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="text-white/80 hover:text-white">
                  Homepage
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-white/80 hover:text-white">
                  About
                </Link>
              </li>
              <li>
                <Link
                  href="/destinations"
                  className="text-white/80 hover:text-white"
                >
                  Locations
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-white/80 hover:text-white"
                >
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 font-sans uppercase tracking-wider">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/terms" className="text-white/80 hover:text-white">
                  Terms Of Use
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-white/80 hover:text-white"
                >
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 font-sans uppercase tracking-wider">
              Customer Service
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="tel:1-714-877-5998"
                  className="text-white/80 hover:text-white"
                >
                  1-714-485-5463
                </a>
              </li>
            </ul>
            <h3 className="mb-2 mt-4 font-sans uppercase tracking-wider">
              Other
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="tel:1-213-214-3355"
                  className="text-white/80 hover:text-white"
                >
                  1-213-214-3355
                </a>
              </li>
              <li>
                <a
                  href="tel:070-4517-5998"
                  className="text-white/80 hover:text-white"
                >
                  070-4517-5998
                </a>
              </li>
              <li>
                <a
                  href="tel:070-4517-5998"
                  className="text-white/80 hover:text-white"
                >
                  Free to call from South Korea to USA
                </a>
              </li>
            </ul>
          </div>
        </div>
        {/* Divider line and back to top button */}
        <div className="mt-12 pt-8">
          <div className="w-16 h-0.5 bg-white/30 mb-6"></div>
          <BackToTopButton />
        </div>
      </div>
    </footer>
  )
}
