type LogoProps = {
  className?: string
  textColor?: string
  size?: "sm" | "md" | "lg"
}

export function Logo({ className = "", textColor = "text-white", size = "md" }: LogoProps) {
  const sizeClasses = {
    sm: {
      container: "gap-0",
      title: "text-lg",
      subtitle: "text-[8px] tracking-[0.3em]",
      line: "w-4",
    },
    md: {
      container: "gap-0.5",
      title: "text-2xl",
      subtitle: "text-[10px] tracking-[0.35em]",
      line: "w-6",
    },
    lg: {
      container: "gap-1",
      title: "text-3xl",
      subtitle: "text-xs tracking-[0.4em]",
      line: "w-8",
    },
  }

  const sizes = sizeClasses[size]

  return (
    <div className={`flex flex-col items-center ${sizes.container} ${className}`}>
      {/* 4 SEASONS */}
      <span 
        className={`${sizes.title} font-medium ${textColor}`}
        style={{ fontFamily: "var(--font-display), Georgia, serif" }}
      >
        4 SEASONS
      </span>
      {/* GOLF with lines */}
      <div className="flex items-center gap-2">
        <span className={`${sizes.line} h-px bg-current ${textColor} opacity-60`}></span>
        <span 
          className={`${sizes.subtitle} uppercase ${textColor}`}
          style={{ fontFamily: "var(--font-body), Helvetica Neue, sans-serif" }}
        >
          Golf
        </span>
        <span className={`${sizes.line} h-px bg-current ${textColor} opacity-60`}></span>
      </div>
    </div>
  )
}
