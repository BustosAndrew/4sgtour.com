'use client'

import Link from 'next/link'
import { BackToTopButton } from './back-to-top-button'
import { Instagram } from 'lucide-react'
import Image from 'next/image'
import { useTranslations } from '@/lib/i18n/provider'

export function SiteFooter() {
  const t = useTranslations('footer')
  const tNav = useTranslations('nav')

  return (
    <footer className="bg-[#22333b] text-white">
      <div className="container py-26">
        <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1.2fr)] md:gap-x-8">
          {/* Column 1: Logo, Social Icons, Branch Sites */}
          <div>
            <div className="mb-6">
              <Link href="/" className="inline-block">
                <Image
                  src="/images/logo.png"
                  alt="4 Seasons Golf Tour"
                  width={250}
                  height={80}
                  className="object-contain"
                />
              </Link>
            </div>

            <div>
              <p className="text-[16px] leading-relaxed text-white/80 font-semibold">
                {t('description')}
              </p>
              <div className="mt-5 flex justify-center md:justify-start">
                <div className="border-l-2 border-[#EAE0D6]/40 pl-3">
                  <p className="text-[14px] uppercase tracking-wide text-[#EAE0D6] font-semibold">
                    {t('tcrcRegistered')}
                  </p>
                  <p className="text-[16px] text-white/60 mt-1 leading-relaxed">
                    {t('sellerOfTravel')}
                  </p>
                </div>
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

          {/* Branch Sites */}
          <div className="flex flex-col justify-center md:justify-start gap-6 h-fit">
            <a
              href="https://4sgtour.de"
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center transition-opacity hover:opacity-80"
            >
              <div className="relative h-14 w-14 sm:h-16 sm:w-16">
                <Image
                  src="/images/cert-logo.png"
                  alt={t('germany')}
                  fill
                  className="object-contain"
                  sizes="(min-width: 640px) 4rem, 3.5rem"
                />
              </div>
              <p
                className="mt-2 text-center text-[9px] font-bold uppercase sm:text-[10px]"
                style={{ fontFamily: 'var(--font-body)' }}
              >
                {t('germany')}
              </p>
            </a>
            <a
              href="https://4sgtour.at"
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center transition-opacity hover:opacity-80"
            >
              <div className="relative h-14 w-14 sm:h-16 sm:w-16">
                <Image
                  src="/images/cert-logo.png"
                  alt={t('austria')}
                  fill
                  className="object-contain"
                  sizes="(min-width: 640px) 4rem, 3.5rem"
                />
              </div>
              <p
                className="mt-2 text-center text-[9px] font-bold uppercase sm:text-[10px]"
                style={{ fontFamily: 'var(--font-body)' }}
              >
                {t('austria')}
              </p>
            </a>
          </div>

          {/* Column 3: Legal + Site Map */}
          <div>
            <h2 className="mb-2 font-sans uppercase text-[#EAE0D6] text-[14px] font-bold underline underline-offset-4">
              {t('legal')}
            </h2>
            <ul className="text-sm">
              <li>
                <Link
                  href="/terms"
                  className="text-white hover:text-white/80 font-semibold text-[14px] uppercase"
                >
                  {t('termsOfUse')}
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-white hover:text-white/80 font-semibold text-[14px] uppercase"
                >
                  {t('privacyPolicy')}
                </Link>
              </li>
            </ul>

            <h2 className="mb-2 mt-6 font-sans uppercase text-[#EAE0D6] text-[14px] font-bold underline underline-offset-4">
              {t('siteMap')}
            </h2>
            <ul className="text-sm">
              <li>
                <Link
                  href="/"
                  className="text-white hover:text-white/80 font-semibold text-[14px] uppercase"
                >
                  {t('homepage')}
                </Link>
              </li>
              <li>
                <Link
                  href="/destinations"
                  className="text-white hover:text-white/80 font-semibold text-[14px] uppercase"
                >
                  {tNav('destinations')}
                </Link>
              </li>
              <li>
                <Link
                  href="/tournaments"
                  className="text-white hover:text-white/80 font-semibold text-[14px] uppercase"
                >
                  {tNav('tournaments')}
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-white hover:text-white/80 font-semibold text-[14px] uppercase"
                >
                  {t('contactUs')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Customer Service */}
          <div>
            <h2 className="mb-2 font-sans uppercase text-[#EAE0D6] text-[14px] font-bold underline underline-offset-4">
              {t('customerService')}
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
            <h2 className="mb-2 mt-4 font-sans uppercase text-[#EAE0D6] text-[14px] font-bold underline underline-offset-4">
              {t('freeToCall')}
            </h2>
            <ul className="text-sm">
              <li>
                <a
                  href="tel:070-4517-5998"
                  className="text-white hover:text-white/80 font-semibold text-[16px] uppercase"
                >
                  070-4517-5998
                </a>
              </li>
            </ul>
            <h2 className="mb-2 mt-4 font-sans uppercase text-[#EAE0D6] text-[14px] font-bold underline underline-offset-4">
              {t('email')}
            </h2>
            <ul className="text-sm">
              <li>
                <a
                  href="mailto:info@4sgtour.com"
                  className="text-white hover:text-white/80 font-semibold text-[16px] uppercase"
                >
                  info@4sgtour.com
                </a>
              </li>
            </ul>
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
