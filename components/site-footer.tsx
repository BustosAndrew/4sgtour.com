'use client'

import Link from 'next/link'
import { BackToTopButton } from './back-to-top-button'
import { Logo } from '@/components/logo'
import { Instagram } from 'lucide-react'
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
            <div className="mt-5 flex justify-center md:justify-start">
              <div className="border-l-2 border-[#EAE0D6]/40 pl-3">
                <p className="text-xs uppercase tracking-wide text-[#EAE0D6] font-semibold">
                  TCRC Registered
                </p>
                <p className="text-xs text-white/60 mt-1 leading-relaxed">
                  Seller of Travel Reg. No.: CST 2156865-70
                </p>
              </div>
            </div>

            {/* Social Icons */}
            <div className="mt-6 flex justify-center md:justify-start gap-4">
              <Link
                href="https://www.facebook.com/golf4season/?locale=sr_RS"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white hover:text-white/70 transition-colors"
                aria-label="Facebook"
              >
                <svg
                  className="h-6 w-6"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M2.5 0A2.5 2.5 0 000 2.5v19A2.5 2.5 0 002.5 24h10.024v-9.293H9.538V11.07h2.986V8.413c0-2.96 1.808-4.573 4.45-4.573 1.265 0 2.353.094 2.67.136v3.093h-1.833c-1.437 0-1.715.683-1.715 1.685v2.316h3.43l-.447 3.637h-2.983V24H21.5a2.5 2.5 0 002.5-2.5v-19A2.5 2.5 0 0021.5 0h-19z" />
                </svg>
              </Link>
              <Link
                href="https://www.instagram.com/golf4season/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white hover:text-white/70 transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="h-6 w-6" />
              </Link>
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
