export const locales = ['en', 'de'] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = 'en'

export const localeNames: Record<Locale, string> = {
  en: 'ENG',
  de: 'Deutsch',
}

export const localeFlags: Record<Locale, { flag: string; alt: string }> = {
  en: { flag: 'https://flagcdn.com/w40/us.png', alt: 'US' },
  de: { flag: 'https://flagcdn.com/w40/de.png', alt: 'Germany' },
}
