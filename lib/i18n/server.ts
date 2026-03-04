import { cookies } from 'next/headers'
import { defaultLocale, locales, type Locale } from './config'

export async function getServerLocale(): Promise<Locale> {
  const cookieStore = await cookies()
  const cookieLocale = cookieStore.get('NEXT_LOCALE')?.value as Locale | undefined
  
  // Validate that the locale is supported
  return cookieLocale && locales.includes(cookieLocale) ? cookieLocale : defaultLocale
}

export async function getServerMessages(locale?: Locale) {
  const currentLocale = locale || await getServerLocale()
  return (await import(`../../messages/${currentLocale}.json`)).default
}

type NestedMessages = {
  [key: string]: string | NestedMessages
}

function getNestedValue(obj: NestedMessages, path: string): string {
  const keys = path.split('.')
  let current: string | NestedMessages = obj
  
  for (const key of keys) {
    if (typeof current === 'string' || current === undefined) {
      return path // Return the path if not found
    }
    current = current[key]
  }
  
  return typeof current === 'string' ? current : path
}

/**
 * Server-side translation function that works without the next-intl plugin.
 * Returns a function that can be used to get translations for a specific namespace.
 */
export async function getServerTranslations(namespace: string) {
  const locale = await getServerLocale()
  const messages = await getServerMessages(locale)
  const namespaceMessages = messages[namespace] || {}
  
  return function t(key: string, values?: Record<string, string | number>): string {
    let translation = getNestedValue(namespaceMessages as NestedMessages, key)
    
    // Handle interpolation {variable}
    if (values && typeof translation === 'string') {
      Object.entries(values).forEach(([k, v]) => {
        translation = translation.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v))
      })
    }
    
    return translation
  }
}
