type LogoProps = {
  className?: string
  textColor?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'footer'
}

export function Logo({
  className = '',
  textColor = 'text-white',
  size = 'md',
  variant = 'default',
}: LogoProps) {
  const sizeClasses = {
    sm: {
      four: 'text-lg',
      seasons: 'text-[13px]',
      subtitle: 'text-[6px] tracking-[0.2em]',
      line: 'w-6',
    },
    md: {
      four: 'text-2xl',
      seasons: 'text-base',
      subtitle: 'text-[8px] tracking-[0.25em]',
      line: 'w-10',
    },
    lg: {
      four: 'text-3xl',
      seasons: 'text-xl',
      subtitle: 'text-[10px] tracking-[0.3em]',
      line: 'w-14',
    },
  }

  const sizes = sizeClasses[size]

  const isFooter = variant === 'footer'

  return (
    <div
      className={`inline-flex flex-col ${isFooter ? 'items-start' : 'items-center'} ${className}`}
      style={{ fontFamily: "'loretta', serif" }}
    >
      {/* 4 SEASONS */}
      <div className="flex items-baseline gap-1.5">
        <span
          className={`${sizes.four} italic font-normal leading-none ${textColor}`}
        >
          4
        </span>
        <span
          className={`${sizes.seasons} font-medium uppercase tracking-[0.12em] leading-none ${textColor}`}
        >
          Seasons
        </span>
      </div>
      {/* GOLF with lines on each side */}
      <div className="flex items-center gap-2 mt-1">
        <span
          className={`${sizes.line} h-px ${textColor} opacity-60 ${isFooter && 'w-6!'}`}
          style={{ backgroundColor: 'currentColor' }}
        />
        <span className={`${sizes.subtitle} uppercase ${textColor}`}>GOLF</span>
        <span
          className={`${sizes.line} h-px ${textColor} opacity-60 ${isFooter && 'w-6!'}`}
          style={{ backgroundColor: 'currentColor' }}
        />
      </div>
    </div>
  )
}
