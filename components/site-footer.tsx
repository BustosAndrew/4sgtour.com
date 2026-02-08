'use client'

import Link from 'next/link'
import { BackToTopButton } from './back-to-top-button'
import { Logo } from '@/components/logo'
import Image from 'next/image'

export function SiteFooter() {
  return (
    <footer className="bg-[#22333b] text-white">
      <div className="container py-26">
        <div className="grid gap-8 md:grid-cols-[minmax(0,1.2fr)_minmax(0,2fr)] md:gap-x-16">
          <div className="md:w-58">
            <div className="mb-6">
              <Image
                src="/images/logo.png"
                alt="4 Seasons Golf Tour"
                width={250}
                height={80}
                className="object-contain"
              />
            </div>
            <p className="text-sm leading-relaxed text-white/80 font-medium">
              4SGTour is a premier golf travel agency specializing in overseas
              golf tours. We are dedicated to providing exceptional service and
              unforgettable golf experiences around the world.
            </p>
            <div className="mt-4 flex justify-center md:justify-start">
              <div className="bg-white/6 border border-white/20 rounded-md px-3 py-2 text-center md:text-left max-w-[320px]">
                <p className="text-[12px] sm:text-sm text-white font-semibold leading-tight">
                  Travel Consumer Protection Registered Corporation (TCRC)
                </p>
                <p className="text-[12px] sm:text-sm text-white/90 leading-tight mt-0.5">
                  Seller of Travel Registration No.: CST 2156865-70
                </p>
              </div>
            </div>
          </div>

          {/* Link columns grouped tighter together */}
          <div className="grid gap-8 sm:grid-cols-3 sm:gap-x-6 sm:gap-y-8">
            <div>
              <h2 className="mb-2 font-sans uppercase text-[#EAE0D6] text-[14px] font-semibold">
                Site Map
              </h2>
              <ul className="text-sm">
                <li>
                  <Link
                    href="/"
                    className="text-white hover:text-white/80 font-semibold text-[14px] uppercase"
                  >
                    Homepage
                  </Link>
                </li>
                <li>
                  <Link
                    href="/destinations"
                    className="text-white hover:text-white/80 font-semibold text-[14px] uppercase"
                  >
                    Destinations
                  </Link>
                </li>
                <li>
                  <Link
                    href="/tournaments"
                    className="text-white hover:text-white/80 font-semibold text-[14px] uppercase"
                  >
                    Tournaments
                  </Link>
                </li>
                <li>
                  <Link
                    href="/contact"
                    className="text-white hover:text-white/80 font-semibold text-[14px] uppercase"
                  >
                    Contact Us
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h2 className="mb-2 font-sans uppercase text-[#EAE0D6] text-[14px] font-semibold">
                Legal
              </h2>
              <ul className="text-sm">
                <li>
                  <Link
                    href="/terms"
                    className="text-white hover:text-white/80 font-semibold text-[14px] uppercase"
                  >
                    Terms Of Use
                  </Link>
                </li>
                <li>
                  <Link
                    href="/privacy"
                    className="text-white hover:text-white/80 font-semibold text-[14px] uppercase"
                  >
                    Privacy Policy
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h2 className="mb-2 font-sans uppercase text-[#EAE0D6] text-[14px] font-semibold">
                Customer Service
              </h2>
              <ul className="text-sm">
                <li>
                  <a
                    href="tel:1-714-877-5998"
                    className="text-white hover:text-white/80 font-semibold text-[16px] uppercase"
                  >
                    1-714-485-5463
                  </a>
                </li>
              </ul>
              <h2 className="mb-2 mt-4 font-sans uppercase text-[#EAE0D6] text-[14px] font-semibold">
                Other
              </h2>
              <ul className="text-sm">
                <li>
                  <a
                    href="tel:1-213-214-3355"
                    className="text-white hover:text-white/80 font-semibold text-[16px] uppercase"
                  >
                    1-213-214-3355
                  </a>
                </li>
                <li>
                  <a
                    href="tel:070-4517-5998"
                    className="text-white hover:text-white/80 font-semibold text-[16px] uppercase"
                  >
                    070-4517-5998
                  </a>
                </li>
                <li>
                  <a
                    href="tel:070-4517-5998"
                    className="text-white hover:text-white/80 font-semibold text-[14px] uppercase"
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
