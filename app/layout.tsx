import type React from "react"
import type { Metadata } from "next"

import { Analytics } from "@vercel/analytics/next"
import { ErrorHandler } from "@/components/error-handler"
import "./globals.css"
import "flag-icons/css/flag-icons.min.css"

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
        <Analytics />
      </body>
    </html>
  )
}
