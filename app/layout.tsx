import type React from 'react'
import type { Metadata } from 'next'
import Script from 'next/script'

import { Analytics } from '@vercel/analytics/next'
import { ErrorHandler } from '@/components/error-handler'
import { I18nProvider } from '@/lib/i18n/provider'
import { getServerLocale, getServerMessages } from '@/lib/i18n/server'
import { defaultLocale, openGraphLocales } from '@/lib/i18n/config'
import { getSiteUrl } from '@/lib/site-url'
import './globals.css'

// Each of the three sites is its own deployment, so the canonical origin has
// to come from the environment rather than a hard-coded domain.
const siteUrl = getSiteUrl()

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: '4 Seasons Golf Tour',
    template: '%s | 4 Seasons Golf Tour',
  },
  description:
    'Book your perfect golf vacation with 4 Seasons Golf Tour. Explore top golf destinations, exclusive packages, and personalized service for an unforgettable golfing experience.',
  keywords: [
    'golf vacation',
    'golf tour',
    'golf travel',
    'golf packages',
    'golf destinations',
    'luxury golf',
    'golf trips',
  ],
  authors: [{ name: '4 Seasons Golf Tour' }],
  creator: '4 Seasons Golf Tour',
  openGraph: {
    type: 'website',
    locale: openGraphLocales[defaultLocale],
    url: siteUrl,
    siteName: '4 Seasons Golf Tour',
    title: '4 Seasons Golf Tour',
    description:
      'Book your perfect golf vacation with 4 Seasons Golf Tour. Explore top golf destinations worldwide.',
  },
  twitter: {
    card: 'summary_large_image',
    title: '4 Seasons Golf Tour',
    description:
      'Book your perfect golf vacation with 4 Seasons Golf Tour. Explore top golf destinations worldwide.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  generator: 'v0.app',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const locale = await getServerLocale()
  const messages = await getServerMessages(locale)

  return (
    <html lang={locale}>
      <head>
        <link rel="preconnect" href="https://use.typekit.net" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://p.typekit.net" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://p.typekit.net/p.css?s=1&k=rzv4yqs&ht=tk&f=44872.44874.48600.52429.52432.52434.52435&a=165152875&app=typekit&e=css"
        />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link
          rel="apple-touch-icon"
          href="/apple-icon?<generated>"
          type="image/<generated>"
          sizes="<generated>"
        />
      </head>
      <body className="antialiased">
        <I18nProvider locale={locale} messages={messages}>
          <ErrorHandler />
          {children}
        </I18nProvider>
        <Script id="chatbase" strategy="afterInteractive">
          {`(function(){var cb=window.chatbase;var isFn=typeof cb==="function";var isInitialized=false;try{isInitialized=isFn&&cb("getState")==="initialized"}catch(e){isInitialized=false}if(!isInitialized){window.chatbase=(...arguments)=>{if(!window.chatbase.q){window.chatbase.q=[]}window.chatbase.q.push(arguments)};window.chatbase=new Proxy(window.chatbase,{get(target,prop){if(prop==="q"){return target.q}return(...args)=>target(prop,...args)}})}const onLoad=function(){const script=document.createElement("script");script.src="https://www.chatbase.co/embed.min.js";script.id="f8rhS7VuIfMi7GBCKbwdc";script.domain="www.chatbase.co";document.body.appendChild(script)};if(document.readyState==="complete"){onLoad()}else{window.addEventListener("load",onLoad)}})();`}
        </Script>
        <Analytics />
      </body>
    </html>
  )
}
