export const locales = ['en', 'ko', 'de'] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = 'en'

// OpenGraph wants a language_TERRITORY tag rather than a bare language code.
export const openGraphLocales: Record<Locale, string> = {
  en: 'en_US',
  ko: 'ko_KR',
  de: 'de_DE',
}

export const localeNames: Record<Locale, string> = {
  en: 'ENG',
  ko: '한국어',
  de: 'DEU',
}

export const localeFlags: Record<Locale, { flag: string; alt: string }> = {
  en: { flag: 'https://flagcdn.com/w40/us.png', alt: 'US' },
  ko: { flag: 'https://flagcdn.com/w40/kr.png', alt: 'Korea' },
  de: { flag: 'https://flagcdn.com/w40/de.png', alt: 'Germany' },
}
