"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

interface AnimatedHrProps {
  className?: string
  color?: string
  maxWidth?: string // e.g., "75%" or "100%"
}

export function AnimatedHr({ className, color = "#274C77", maxWidth = "100%" }: AnimatedHrProps) {
  const [isVisible, setIsVisible] = useState(false)
  const hrRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1 },
    )

    if (hrRef.current) {
      observer.observe(hrRef.current)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={hrRef}
      className={cn("mt-2 h-0.5 transition-all duration-1000 ease-out", className)}
      style={{
        backgroundColor: color,
        width: isVisible ? maxWidth : "0%",
      }}
    />
  )
}
