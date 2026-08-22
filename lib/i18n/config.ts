export const locales = ['en', 'ko', 'de'] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = 'ko'

// OpenGraph wants a language_TERRITORY tag rather than a bare language code.
export const openGraphLocales: Record<Locale, string> = {
  en: 'en_US',
  ko: 'ko_KR',
  de: 'de_DE',
}

/**
 * Namespaces that client components actually read through
 * `useTranslations()`. The root layout ships only these into
 * `I18nProvider`.
 *
 * The other namespaces (`privacy`, `terms`, `home`, `trips`,
 * `tripDetails`, `stats`, `metadata`) are read exclusively by Server
 * Components via `getServerTranslations()`, so they never need to cross
 * into the client bundle. `privacy` and `terms` alone are ~24 KB of legal
 * copy that used to be serialized into the RSC payload of every single
 * page — including every link prefetch — to serve two rarely-visited
 * routes.
 *
 * Adding a `useTranslations('x')` call in a client component means adding
 * `x` here, or `t()` will fall back to echoing the key path.
 */
export const clientNamespaces = [
  'auth',
  'booking',
  'bookingsPage',
  'checkout',
  'common',
  'contact',
  'destinations',
  'favoritesPage',
  'footer',
  'hero',
  'nav',
  'tigerBooking',
  'tournaments',
  'tripCard',
] as const

type MessageTree = { [key: string]: string | MessageTree }

/** Narrow a full message bundle down to what the client needs. */
export function pickClientMessages(
  messages: Record<string, any>,
): MessageTree {
  const picked: MessageTree = {}
  for (const namespace of clientNamespaces) {
    if (namespace in messages) picked[namespace] = messages[namespace]
  }
  return picked
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
