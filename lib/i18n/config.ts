export const locales = ['en', 'ko'] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = 'en'

export const localeNames: Record<Locale, string> = {
  en: 'ENG',
  ko: '한국어',
}

export const localeFlags: Record<Locale, { flag: string; alt: string }> = {
  en: { flag: 'https://flagcdn.com/w40/us.png', alt: 'US' },
  ko: { flag: 'https://flagcdn.com/w40/kr.png', alt: 'Korea' },
}
