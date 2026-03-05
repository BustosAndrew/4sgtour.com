'use client'

import { useTranslations } from '@/lib/i18n/provider'

export function BackToTopButton() {
  const t = useTranslations('common')

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <button
      onClick={scrollToTop}
      className="inline-flex items-center gap-2 bg-[#735c38] hover:bg-[#5d4a2d] text-white px-6 py-2 text-sm uppercase tracking-wider transition-colors"
      style={{ fontFamily: 'var(--font-body)' }}
    >
      {t('backToTop')} ^
    </button>
  )
}
