"use client"

import { ArrowUp } from "lucide-react"

export function BackToTopButton() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <button
      onClick={scrollToTop}
      className="inline-flex items-center gap-2 border border-white/30 px-6 py-2 text-sm transition-colors hover:bg-white/10 rounded-none"
    >
      <ArrowUp className="h-4 w-4" />
      Back To Top
    </button>
  )
}
