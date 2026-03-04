import { getLocale } from 'next-intl/server'

/**
 * Gets a localized field from a database record.
 * For English, returns the base field (e.g., "title")
 * For other locales, returns the suffixed field (e.g., "title_ko") or falls back to base
 */
export async function getLocalizedField<T extends Record<string, unknown>>(
  item: T,
  field: string
): Promise<string> {
  const locale = await getLocale()

  if (locale === 'en') {
    return (item[field] as string) || ''
  }

  const localizedField = `${field}_${locale}`
  return (item[localizedField] as string) || (item[field] as string) || ''
}

/**
 * Gets a localized array field from a database record.
 * For English, returns the base field (e.g., "highlights")
 * For other locales, returns the suffixed field (e.g., "highlights_ko") or falls back to base
 */
export async function getLocalizedArrayField<T extends Record<string, unknown>>(
  item: T,
  field: string
): Promise<string[]> {
  const locale = await getLocale()

  if (locale === 'en') {
    return (item[field] as string[]) || []
  }

  const localizedField = `${field}_${locale}`
  return (item[localizedField] as string[]) || (item[field] as string[]) || []
}

/**
 * Client-side helper to get localized field based on provided locale
 */
export function getLocalizedFieldSync<T extends Record<string, unknown>>(
  item: T,
  field: string,
  locale: string
): string {
  if (locale === 'en') {
    return (item[field] as string) || ''
  }

  const localizedField = `${field}_${locale}`
  return (item[localizedField] as string) || (item[field] as string) || ''
}

/**
 * Client-side helper to get localized array field based on provided locale
 */
export function getLocalizedArrayFieldSync<T extends Record<string, unknown>>(
  item: T,
  field: string,
  locale: string
): string[] {
  if (locale === 'en') {
    return (item[field] as string[]) || []
  }

  const localizedField = `${field}_${locale}`
  return (item[localizedField] as string[]) || (item[field] as string[]) || []
}
