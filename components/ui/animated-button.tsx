"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface AnimatedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  hoverText?: string
  startColor?: string // Base button color
  endColor?: string // Color to sweep to on hover
  asChild?: boolean
}

const AnimatedButton = React.forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  (
    { className, children, hoverText, startColor = "#062047", endColor = "#0a3470", asChild = false, ...props },
    ref,
  ) => {
    const midColor = lightenColor(endColor, 0.4)

    return (
      <button
        ref={ref}
        className={cn(
          "group relative z-10 cursor-pointer overflow-hidden rounded-md border-none px-6 py-3 text-base font-bold text-white",
          className,
        )}
        style={{ backgroundColor: startColor }}
        {...props}
      >
        {/* Original text - fades out */}
        <span className="relative z-20 transition-opacity duration-300 group-hover:opacity-0">{children}</span>

        {/* Hover text - fades in */}
        <span className="absolute inset-0 z-20 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          {hoverText || children}
        </span>

        <span
          className="absolute inset-0 z-[1] origin-left scale-x-0 transform transition-transform duration-1000 group-hover:scale-x-100 group-hover:duration-500"
          style={{ backgroundColor: "white" }}
        />

        <span
          className="absolute inset-0 z-[2] origin-left scale-x-0 transform transition-transform duration-700 group-hover:scale-x-100 group-hover:duration-700"
          style={{ backgroundColor: midColor }}
        />

        <span
          className="absolute inset-0 z-[3] origin-left scale-x-0 transform transition-transform duration-500 group-hover:scale-x-50 group-hover:duration-1000"
          style={{ backgroundColor: endColor }}
        />
      </button>
    )
  },
)

AnimatedButton.displayName = "AnimatedButton"

function lightenColor(hex: string, amount: number): string {
  const r = Number.parseInt(hex.slice(1, 3), 16)
  const g = Number.parseInt(hex.slice(3, 5), 16)
  const b = Number.parseInt(hex.slice(5, 7), 16)

  const lightenedR = Math.min(255, Math.round(r + (255 - r) * amount))
  const lightenedG = Math.min(255, Math.round(g + (255 - g) * amount))
  const lightenedB = Math.min(255, Math.round(b + (255 - b) * amount))

  return `rgb(${lightenedR}, ${lightenedG}, ${lightenedB})`
}

export { AnimatedButton }
