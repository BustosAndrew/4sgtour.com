/**
 * Gets a localized field from a database record.
 * For English, returns the base field (e.g., "title")
 * For other locales, returns the suffixed field (e.g., "title_ko") or falls back to base
 * 
 * @param item - The database record
 * @param field - The base field name
 * @param locale - The locale to use
 * @param isArray - Whether the field is an array (for highlights, etc.)
 */
export function getLocalizedField<T extends Record<string, unknown>>(
  item: T,
  field: string,
  locale: string,
  isArray?: boolean
): string | string[] {
  if (isArray) {
    if (locale === 'en') {
      return (item[field] as string[]) || []
    }
    const localizedField = `${field}_${locale}`
    return (item[localizedField] as string[]) || (item[field] as string[]) || []
  }

  if (locale === 'en') {
    return (item[field] as string) || ''
  }

  const localizedField = `${field}_${locale}`
  return (item[localizedField] as string) || (item[field] as string) || ''
}

// Alias for backwards compatibility
export const getLocalizedFieldSync = getLocalizedField
