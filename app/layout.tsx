import type React from "react"
import type { Metadata } from "next"
import Script from "next/script"
import localFont from "next/font/local"

import { Analytics } from "@vercel/analytics/next"
import { ErrorHandler } from "@/components/error-handler"
import "./globals.css"

// Loretta Display - elegant serif for headings
const lorettaDisplay = localFont({
  src: [
    {
      path: "../public/fonts/LorettaDisplay-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/LorettaDisplay-Italic.woff2",
      weight: "400",
      style: "italic",
    },
    {
      path: "../public/fonts/LorettaDisplay-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../public/fonts/LorettaDisplay-Bold.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-display",
  display: "swap",
  fallback: ["Georgia", "Times New Roman", "serif"],
})

// Sweet Sans Pro - clean sans-serif for body text
const sweetSansPro = localFont({
  src: [
    {
      path: "../public/fonts/SweetSansPro-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/SweetSansPro-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../public/fonts/SweetSansPro-Bold.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-body",
  display: "swap",
  fallback: ["Helvetica Neue", "Arial", "sans-serif"],
})

// Declare the missing variables
const playfairDisplay = localFont({
  src: [
    {
      path: "../public/fonts/PlayfairDisplay-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/PlayfairDisplay-Bold.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-playfair-display",
  display: "swap",
  fallback: ["Times New Roman", "serif"],
})

const bitter = localFont({
  src: [
    {
      path: "../public/fonts/Bitter-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/Bitter-Bold.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-bitter",
  display: "swap",
  fallback: ["Georgia", "serif"],
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
        className={`antialiased ${sweetSansPro.variable} ${lorettaDisplay.variable}`}
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
