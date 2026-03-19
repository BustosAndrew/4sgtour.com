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
              <Link
                href="https://m.blog.naver.com/4seasonsgolftour"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white hover:opacity-80 transition-colors"
                aria-label="Naver Blog"
              >
                <Image
                  src="/images/naver.png"
                  alt="Naver Blog"
                  width={24}
                  height={24}
                  className="object-contain"
                />
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
              <li>
                <a
                  href="mailto:info@4sgtour.com"
                  className="text-white hover:text-white/80 font-semibold text-[16px] uppercase"
                >
                  booking@4sgtour.com
                </a>
              </li>
            </ul>

            {/* Payment Methods */}
            <h2 className="mb-3 mt-6 font-sans uppercase text-[#EAE0D6] text-[14px] font-bold underline underline-offset-4">
              {t('paymentMethods')}
            </h2>
            <div className="flex flex-wrap gap-2">
              {/* Visa */}
              <div className="bg-white rounded px-2 py-1 flex items-center justify-center h-8">
                <svg
                  className="h-5"
                  viewBox="0 0 780 500"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M293.2 348.73l33.36-195.76h53.35l-33.36 195.76H293.2zm246.11-191.54c-10.57-3.97-27.15-8.2-47.87-8.2-52.73 0-89.88 26.6-90.19 64.7-.31 28.2 26.56 43.91 46.81 53.27 20.79 9.58 27.77 15.71 27.68 24.28-.14 13.11-16.59 19.09-31.94 19.09-21.38 0-32.73-2.97-50.28-10.3l-6.89-3.12-7.5 43.95c12.49 5.47 35.59 10.22 59.58 10.46 56.06 0 92.51-26.25 92.93-67.01.21-22.32-14.03-39.3-44.84-53.31-18.68-9.08-30.12-15.13-30.01-24.32 0-8.15 9.69-16.87 30.61-16.87 17.47-.27 30.12 3.54 39.98 7.52l4.79 2.26 7.24-42.4h-.1zm137.94-4.21h-41.23c-12.77 0-22.33 3.49-27.94 16.24l-79.24 179.51h56.02s9.16-24.14 11.23-29.44l68.33.09c1.6 6.85 6.49 29.35 6.49 29.35h49.52l-43.18-195.75zm-65.74 126.41c4.4-11.29 21.26-54.77 21.26-54.77-.32.53 4.38-11.32 7.07-18.67l3.6 16.87s10.22 46.8 12.36 56.58h-44.29v-.01zM241.65 152.97l-52.24 133.53-5.59-27.18c-9.72-31.27-40.01-65.16-73.89-82.12l47.79 171.42 56.46-.06 84.04-195.59h-56.57z"
                    fill="#1A1F71"
                  />
                  <path
                    d="M146.92 152.96H62.02l-.66 3.95c66.93 16.24 111.18 55.45 129.54 102.55l-18.68-89.96c-3.22-12.32-12.56-16.12-25.3-16.54z"
                    fill="#F9A533"
                  />
                </svg>
              </div>
              {/* Mastercard */}
              <div className="bg-white rounded px-2 py-1 flex items-center justify-center h-8">
                <svg
                  className="h-5"
                  viewBox="0 0 780 500"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle cx="312" cy="250" r="150" fill="#EB001B" />
                  <circle cx="468" cy="250" r="150" fill="#F79E1B" />
                  <path
                    d="M390 130.07c-35.74 27.99-58.61 71.71-58.61 120.93s22.87 92.94 58.61 120.93c35.74-27.99 58.61-71.71 58.61-120.93s-22.87-92.94-58.61-120.93z"
                    fill="#FF5F00"
                  />
                </svg>
              </div>
              {/* Amex */}
              <div className="bg-white rounded px-2 py-1 flex items-center justify-center h-8">
                <svg
                  className="h-5"
                  viewBox="0 0 780 500"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect width="780" height="500" rx="40" fill="#016FD0" />
                  <path
                    d="M108.53 247.25L67.51 352.58h47.88l6.1-14.56h14.03l6.1 14.56h52.68v-11.12l4.7 11.12h27.26l4.7-11.39v11.39h109.61l13.34-13.83 12.49 13.83 56.23.12-41.26-52.47 41.26-53.01h-55.3l-12.99 13.56-12.12-13.56H235.08l-10.26 22.91-10.51-22.91h-47.67v10.74l-5.32-10.74h-40.37l-12.42 29.02zm16.95 14.21h22.26l25.25 57.38v-57.38h24.38l19.52 41.22 17.99-41.22h24.21v67.99h-14.77l-.13-53.27-21.49 53.27h-13.21l-21.62-53.27v53.27h-30.36l-6.22-14.69H118.5l-6.22 14.69h-16.62l28.82-67.99zm14.02 19.55l-10.38 24.62h20.76l-10.38-24.62zm127.75-19.55h60.47l18.36 19.9 19.02-19.9h18.5l-28.23 34.12 28.23 33.87h-19.44l-18.36-20.19-19.3 20.19h-59.25v-67.99zm15.05 13.82v12.43h33.02v13.28h-33.02v14.65h37.03l17.23-20.22-16.49-20.14h-37.77z"
                    fill="white"
                  />
                  <path
                    d="M488.54 247.25l-40.68 67.99h25.29l6.1-14.56h14.02l6.1 14.56h52.69v-11.12l4.7 11.12h27.25l4.7-11.39v11.39h109.62l13.34-13.83 12.49 13.83 56.23.12-41.27-52.47 41.27-53.01h-55.31l-12.99 13.56-12.12-13.56h-145.14l-10.27 22.91-10.5-22.91h-47.68v10.74l-5.32-10.74h-40.36l-20.86 48.8v-48.8h-17.13v67.99h17.13v-20.18l5.19-9.11 16.08 29.29h19.18l-24.01-42.77 22.75-25.22h-16.15l-22.03 27.31v-27.31zm8.97 14.21h22.27l25.24 57.38v-57.38h24.38l19.52 41.22 18-41.22h24.21v67.99h-14.77l-.13-53.27-21.5 53.27H581.5l-21.62-53.27v53.27h-30.36l-6.22-14.69h-32.58l-6.22 14.69h-16.62l28.63-67.99zm14.02 19.55l-10.38 24.62h20.76l-10.38-24.62zm127.75-19.55h60.47l18.37 19.9 19.01-19.9h18.5l-28.22 34.12 28.22 33.87h-19.43l-18.37-20.19-19.3 20.19h-59.25v-67.99zm15.05 13.82v12.43h33.02v13.28h-33.02v14.65h37.04l17.22-20.22-16.49-20.14h-37.77z"
                    fill="white"
                  />
                </svg>
              </div>
              {/* ACH/Bank */}
              <div className="bg-white rounded px-2 py-1 flex items-center justify-center h-8">
                <svg
                  className="h-5 w-8"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M3 21h18v-2H3v2zm0-4h18v-2H3v2zm2-6h2v4H5v-4zm4 0h2v4H9v-4zm4 0h2v4h-2v-4zm4 0h2v4h-2v-4zM2 9l10-5 10 5v2H2V9z"
                    fill="#1A1F71"
                  />
                </svg>
                <span className="ml-1 text-[10px] font-bold text-[#1A1F71]">
                  ACH
                </span>
              </div>
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
