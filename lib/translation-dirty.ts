/**
 * Dirty checking for the admin translation routes.
 *
 * Translation used to retranslate every source field on every run, which
 * burned AI Gateway credits and function time re-deriving text that was
 * already correct. These helpers decide, per field, whether a translation
 * actually needs to be produced.
 *
 * A field is translated when:
 *   - `force` is set (the "Retranslate everything" repair mode), or
 *   - the source text changed in the save that triggered this run and the
 *     admin did NOT hand-edit the target language in that same save, or
 *   - the target language has no usable translation yet.
 *
 * The same predicate MUST drive both the progress pre-count and the
 * execution pass. Counting one set of fields and translating another is
 * what leaves the progress bar stuck below 100%.
 */

export type LanguageCode = 'en' | 'ko' | 'de'

/**
 * Base field names whose value changed in a save, keyed by the language
 * that changed. `title` under `en` means the English title was edited;
 * `title` under `de` means the admin typed German by hand.
 */
export type ChangedFields = Partial<Record<LanguageCode, string[]>>

export function isNonEmptyText(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

/** Suffix for a language's columns: `en` is the base column, others are `_xx`. */
export function suffixFor(language: string): string {
  return language === 'en' ? '' : `_${language}`
}

/**
 * How many work units a source value represents — one per non-empty string,
 * one per non-empty array entry. Used for the progress total.
 */
export function countUnits(sourceValue: unknown): number {
  if (Array.isArray(sourceValue)) return sourceValue.filter(isNonEmptyText).length
  return isNonEmptyText(sourceValue) ? 1 : 0
}

/** Is there any source content worth translating at all? */
export function hasSourceContent(sourceValue: unknown): boolean {
  return countUnits(sourceValue) > 0
}

/**
 * Does the target already hold a usable translation of this source?
 *
 * Arrays are written back whole, so they are all-or-nothing: a target array
 * that is shorter than the source (an added highlight, a new paragraph) is
 * treated as missing so the whole array is regenerated.
 */
export function hasExistingTranslation(
  sourceValue: unknown,
  targetValue: unknown,
): boolean {
  if (Array.isArray(sourceValue)) {
    if (!Array.isArray(targetValue)) return false
    const sourceCount = sourceValue.filter(isNonEmptyText).length
    const targetCount = targetValue.filter(isNonEmptyText).length
    return targetCount > 0 && targetCount === sourceCount
  }
  return isNonEmptyText(targetValue)
}

/**
 * Build the "did the source text change under me?" test for one
 * source → target pair.
 *
 * A field is stale when the source language's copy changed but the target
 * language's copy did not. If the admin edited the German title in the same
 * save, their German wins and we leave it alone — that is the
 * "unless a field was modified for a specific language" rule.
 */
export function createStaleCheck(
  changedFields: ChangedFields | undefined,
  sourceLanguage: string,
  targetLanguage: string,
): (baseField: string) => boolean {
  if (!changedFields) return () => false

  const changedInSource = new Set(
    changedFields[sourceLanguage as LanguageCode] ?? [],
  )
  const changedInTarget = new Set(
    changedFields[targetLanguage as LanguageCode] ?? [],
  )

  return (baseField: string) =>
    changedInSource.has(baseField) && !changedInTarget.has(baseField)
}

export type ShouldTranslate = (
  baseField: string,
  sourceValue: unknown,
  targetValue: unknown,
) => boolean

/**
 * The single predicate both the pre-count and the execution pass must use.
 */
export function createShouldTranslate(options: {
  force: boolean
  stale: (baseField: string) => boolean
}): ShouldTranslate {
  const { force, stale } = options

  return (baseField, sourceValue, targetValue) => {
    if (!hasSourceContent(sourceValue)) return false
    if (force) return true
    if (stale(baseField)) return true
    return !hasExistingTranslation(sourceValue, targetValue)
  }
}

/** Normalize a column value so `null`, `undefined` and `''` compare equal. */
function normalize(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (Array.isArray(value)) {
    return JSON.stringify(
      value.map((item) => (typeof item === 'string' ? item.trim() : item)),
    )
  }
  if (typeof value === 'string') return value.trim()
  return JSON.stringify(value)
}

/**
 * Compare a stored row against an incoming update and report which base
 * fields changed, per language.
 *
 * Only keys actually present in `incoming` are considered — the admin
 * routes deliberately omit localized columns that the form did not submit,
 * and an omitted column is "unchanged", not "cleared".
 */
export function diffLocalizedFields(
  stored: Record<string, any> | null | undefined,
  incoming: Record<string, any>,
  baseFields: string[],
  languages: LanguageCode[] = ['en', 'ko', 'de'],
): ChangedFields {
  const changed: ChangedFields = {}
  if (!stored) return changed

  for (const language of languages) {
    const suffix = suffixFor(language)
    const changedForLanguage: string[] = []

    for (const baseField of baseFields) {
      const column = `${baseField}${suffix}`
      if (!(column in incoming)) continue
      if (normalize(stored[column]) !== normalize(incoming[column])) {
        changedForLanguage.push(baseField)
      }
    }

    if (changedForLanguage.length > 0) changed[language] = changedForLanguage
  }

  return changed
}

/** True when any language reported a change. */
export function hasAnyChange(changed: ChangedFields): boolean {
  return Object.values(changed).some((fields) => (fields?.length ?? 0) > 0)
}

/**
 * Parse the `force` / `changedFields` inputs off a translate request body,
 * tolerating absent or malformed values (older clients send neither).
 */
export function parseDirtyCheckOptions(body: any): {
  force: boolean
  changedFields: ChangedFields | undefined
} {
  const force = body?.force === true

  const raw = body?.changedFields
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { force, changedFields: undefined }
  }

  const changedFields: ChangedFields = {}
  for (const language of ['en', 'ko', 'de'] as LanguageCode[]) {
    const value = raw[language]
    if (Array.isArray(value)) {
      changedFields[language] = value.filter(
        (item: unknown): item is string => typeof item === 'string',
      )
    }
  }

  return { force, changedFields }
}
