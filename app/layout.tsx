import type React from 'react'
import type { Metadata } from 'next'
import Script from 'next/script'

import { Analytics } from '@vercel/analytics/next'
import { ErrorHandler } from '@/components/error-handler'
import { I18nProvider } from '@/lib/i18n/provider'
import { getServerLocale, getServerMessages } from '@/lib/i18n/server'
import { openGraphLocales, pickClientMessages } from '@/lib/i18n/config'
import { getSiteUrl } from '@/lib/site-url'
import './globals.css'

type MetadataMessages = {
  title: string
  titleTemplate: string
  description: string
  shortDescription: string
  keywords: string[]
}

// Built per request rather than as a static export: the canonical origin comes
// from the environment (each of the three sites is its own deployment) and the
// copy comes from the visitor's locale.
export async function generateMetadata(): Promise<Metadata> {
  const siteUrl = getSiteUrl()
  const locale = await getServerLocale()
  const messages = await getServerMessages(locale)
  const m = messages.metadata as MetadataMessages

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: m.title,
      template: m.titleTemplate,
    },
    description: m.description,
    keywords: m.keywords,
    authors: [{ name: '4 Seasons Golf Tour' }],
    creator: '4 Seasons Golf Tour',
    openGraph: {
      type: 'website',
      locale: openGraphLocales[locale],
      url: siteUrl,
      siteName: '4 Seasons Golf Tour',
      title: m.title,
      description: m.shortDescription,
    },
    twitter: {
      card: 'summary_large_image',
      title: m.title,
      description: m.shortDescription,
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
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const locale = await getServerLocale()
  const messages = await getServerMessages(locale)

  // Only the namespaces client components read cross into the RSC
  // payload. Server Components keep using getServerTranslations(), which
  // still sees the full bundle.
  const clientMessages = pickClientMessages(messages)

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
        <I18nProvider locale={locale} messages={clientMessages}>
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
