import type React from 'react'
import type { Metadata } from 'next'
import Script from 'next/script'

import { Analytics } from '@vercel/analytics/next'
import { ErrorHandler } from '@/components/error-handler'
import { NextIntlClientProvider } from 'next-intl'
import { getServerLocale, getServerMessages } from '@/lib/i18n/server'
import './globals.css'

export const metadata: Metadata = {
  title: 'Golf Trip Booking',
  description: 'Book your perfect golf vacation',
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
        <NextIntlClientProvider messages={messages}>
          <ErrorHandler />
          {children}
        </NextIntlClientProvider>
        <Script id="chatbase" strategy="afterInteractive">
          {`(function(){var cb=window.chatbase;var isFn=typeof cb==="function";var isInitialized=false;try{isInitialized=isFn&&cb("getState")==="initialized"}catch(e){isInitialized=false}if(!isInitialized){window.chatbase=(...arguments)=>{if(!window.chatbase.q){window.chatbase.q=[]}window.chatbase.q.push(arguments)};window.chatbase=new Proxy(window.chatbase,{get(target,prop){if(prop==="q"){return target.q}return(...args)=>target(prop,...args)}})}const onLoad=function(){const script=document.createElement("script");script.src="https://www.chatbase.co/embed.min.js";script.id="f8rhS7VuIfMi7GBCKbwdc";script.domain="www.chatbase.co";document.body.appendChild(script)};if(document.readyState==="complete"){onLoad()}else{window.addEventListener("load",onLoad)}})();`}
        </Script>
        <Analytics />
      </body>
    </html>
  )
}
