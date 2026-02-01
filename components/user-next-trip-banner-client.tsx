'use client'

import { useEffect, useState } from 'react'
import { CalendarClock } from 'lucide-react'

type UserNextTripBannerClientProps = {
  message: string
  startDateLabel: string
}

export function UserNextTripBannerClient({
  message,
  startDateLabel,
}: UserNextTripBannerClientProps) {
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const update = () => setIsScrolled(window.scrollY > 8)
    update()

    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [])

  const bgClass = isScrolled
    ? 'bg-white/95 backdrop-blur-md border-b border-black/10'
    : 'bg-transparent border-b border-transparent'

  const iconBgClass = isScrolled ? 'bg-[#735C38]/10' : 'bg-white/20'
  const iconColorClass = isScrolled ? 'text-[#735C38]' : 'text-white'

  const messageClass = isScrolled ? 'text-[#22333b]' : 'text-white'
  const subTextClass = isScrolled ? 'text-[#22333b]/70' : 'text-white/80'

  return (
    <div
      className={`fixed left-0 right-0 top-[82px] z-[39] transition-colors duration-300 ${bgClass}`}
    >
      <div className="container px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center">
          <div className="flex items-start gap-3 text-center sm:text-left">
            <div className={`mt-0.5 rounded-full p-2 ${iconBgClass}`}>
              <CalendarClock className={`h-5 w-5 ${iconColorClass}`} />
            </div>
            <div>
              <p className={`text-sm font-medium ${messageClass}`}>{message}</p>
              <p className={`mt-1 text-xs ${subTextClass}`}>{startDateLabel}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
