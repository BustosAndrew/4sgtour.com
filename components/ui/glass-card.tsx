"use client"

import "@/components/glass.css"
import type { ReactNode } from "react"

interface GlassCardProps {
  children: ReactNode
  className?: string
}

export function GlassCard({ children, className = "" }: GlassCardProps) {
  return (
    <div className={`GlassContainer ${className}`} style={{ pointerEvents: "auto" }}>
      <div className="GlassMaterial">
        <div className="GlassEdgeReflection" />
        <div className="GlassEmbossReflection" />
        <div className="GlassRefraction" />
        <div className="GlassBlur" />
        <div className="BlendLayers" />
        <div className="BlendEdge" />
        <div className="Highlight" />
        <div className="Brightness" />
      </div>
      <div className="GlassContent">{children}</div>
    </div>
  )
}
