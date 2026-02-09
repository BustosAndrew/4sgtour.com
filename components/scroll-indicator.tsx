'use client'

import { ChevronDown } from 'lucide-react'
import { useEffect, useState } from 'react'

export function ScrollIndicator() {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY < 100)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <button
      onClick={() => {
        window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })
      }}
      aria-label="Scroll down"
      className={`absolute bottom-8 left-1/2 z-10 -translate-x-1/2 flex flex-col items-center gap-1 text-white transition-opacity duration-500 cursor-pointer ${
        visible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      <span className="text-xs font-medium tracking-widest uppercase">Scroll</span>
      <ChevronDown className="h-6 w-6 animate-bounce" />
    </button>
  )
}
