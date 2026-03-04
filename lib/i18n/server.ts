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
