import type React from "react"
import type { Metadata } from "next"
import Script from "next/script"

import { Analytics } from "@vercel/analytics/next"
import { ErrorHandler } from "@/components/error-handler"
import "./globals.css"

import { Playfair_Display, Geist_Mono, Bitter } from "next/font/google"

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
})
const _geistMono = Geist_Mono({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
})
const bitter = Bitter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-bitter",
})

export const metadata: Metadata = {
  title: "Golf Trip Booking",
  description: "Book your perfect golf vacation",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body
        className={`antialiased ${playfairDisplay.className} ${bitter.variable}`}
      >
        <ErrorHandler />
        {children}
        <Script id="chatbase" strategy="afterInteractive">
          {`(function(){var cb=window.chatbase;var isFn=typeof cb==="function";var isInitialized=false;try{isInitialized=isFn&&cb("getState")==="initialized"}catch(e){isInitialized=false}if(!isInitialized){window.chatbase=(...arguments)=>{if(!window.chatbase.q){window.chatbase.q=[]}window.chatbase.q.push(arguments)};window.chatbase=new Proxy(window.chatbase,{get(target,prop){if(prop==="q"){return target.q}return(...args)=>target(prop,...args)}})}const onLoad=function(){const script=document.createElement("script");script.src="https://www.chatbase.co/embed.min.js";script.id="f8rhS7VuIfMi7GBCKbwdc";script.domain="www.chatbase.co";document.body.appendChild(script)};if(document.readyState==="complete"){onLoad()}else{window.addEventListener("load",onLoad)}})();`}
        </Script>
        <Analytics />
      </body>
    </html>
  )
}
