/**
 * Client-side helper: after an admin saves a trip or event, retranslate
 * only the fields whose source text actually changed in that save.
 *
 * The save route returns a per-language diff (`changedFields`); this posts
 * it to the translate route, which combines it with its own missing-field
 * check. A save that touched nothing translatable never leaves the browser.
 */

import type { ChangedFields, LanguageCode } from '@/lib/translation-dirty'

const ALL_LANGUAGES: LanguageCode[] = ['en', 'ko', 'de']

/**
 * Pick the language the edit was authored in. English wins when it moved
 * (the usual case); otherwise whichever language the admin actually typed
 * in, so a German-authoring admin still gets English and Korean refreshed.
 */
function pickSourceLanguage(
  changedFields: ChangedFields,
): LanguageCode | null {
  if ((changedFields.en?.length ?? 0) > 0) return 'en'
  for (const language of ALL_LANGUAGES) {
    if ((changedFields[language]?.length ?? 0) > 0) return language
  }
  return null
}

export async function translateChangedFields(options: {
  endpoint: string
  changedFields: ChangedFields | undefined | null
}): Promise<{ ran: boolean }> {
  const { endpoint, changedFields } = options

  if (!changedFields) return { ran: false }

  const sourceLanguage = pickSourceLanguage(changedFields)
  if (!sourceLanguage) return { ran: false }

  const targetLanguages = ALL_LANGUAGES.filter((l) => l !== sourceLanguage)

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sourceLanguage,
        targetLanguages,
        changedFields,
        // Never force from a save — only changed and missing fields.
        force: false,
      }),
    })

    if (!response.ok || !response.body) {
      console.error(
        '[translate-changed-fields] Translation after save failed with status',
        response.status,
      )
      return { ran: false }
    }

    // Drain the NDJSON progress stream so the caller's redirect happens
    // after the translations have actually been written.
    const reader = response.body.getReader()
    while (true) {
      const { done } = await reader.read()
      if (done) break
    }

    return { ran: true }
  } catch (error) {
    // A failed translation must never block the save the admin just made.
    console.error('[translate-changed-fields] Translation after save threw:', error)
    return { ran: false }
  }
}
