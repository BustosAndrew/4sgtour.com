"use client"

import Link from "next/link"
import { TreePine } from "lucide-react"
import { BackToTopButton } from "./back-to-top-button"

export function SiteFooter() {
  return (
    <footer className="bg-[#5a6650] text-white">
      <div className="container py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <div className="mb-4 flex items-center gap-2">
              <div className="rounded-full bg-white p-2">
                <TreePine className="h-6 w-6 text-[#5a6650]" />
              </div>
              <div>
                <div className="text-sm font-semibold leading-tight">4 SEASONS</div>
                <div className="text-sm font-semibold leading-tight">GOLF TOUR</div>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-white/80 font-medium font-serif">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et
              dolore magna aliqua.
            </p>
          </div>

          <div>
            <h3 className="mb-4 font-semibold">Site Map</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="text-white/80 hover:text-white">
                  Homepage
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-white/80 hover:text-white">
                  About
                </Link>
              </li>
              <li>
                <Link href="/destinations" className="text-white/80 hover:text-white">
                  Locations
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-white/80 hover:text-white">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 font-semibold">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/terms" className="text-white/80 hover:text-white">
                  Terms Of Use
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-white/80 hover:text-white">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 font-semibold">Customer Service:</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="tel:1-714-877-5998" className="text-white/80 hover:text-white">
                  1-714-877-5998
                </a>
              </li>
            </ul>
            <h3 className="mb-2 mt-4 font-semibold">Other:</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="tel:1-213-214-3355" className="text-white/80 hover:text-white">
                  1-213-214-3355
                </a>
              </li>
              <li>
                <a href="tel:1-714-486-5463" className="text-white/80 hover:text-white">
                  1-714-486-5463
                </a>
              </li>
              <li>
                <a href="tel:070-4517-5998" className="text-white/80 hover:text-white">
                  070-4517-5998
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-white/20 pt-8">
          <BackToTopButton />
        </div>
      </div>
    </footer>
  )
}
