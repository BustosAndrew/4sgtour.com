/**
 * The actual translation calls, callable in-process.
 *
 * These used to live only inside `/api/translate` and
 * `/api/translate/batch`, which meant server-side callers (the admin
 * translate routes, the auto-translate helper) reached them by HTTPS-ing
 * their own deployment. Every field cost a second function invocation —
 * plus its cold start, its middleware pass and a network round-trip — to
 * run code that was already sitting in the same bundle.
 *
 * The route handlers are now thin wrappers over these functions, so
 * browser callers keep working unchanged while server callers import
 * directly.
 */

import { generateText, Output } from 'ai'
import { z } from 'zod'

const MODEL = 'openai/gpt-5-mini'

const LANGUAGE_NAMES: Record<string, string> = {
  ko: 'Korean',
  de: 'German',
  en: 'English',
}

/** Model output that looks like an unfilled placeholder rather than a translation. */
const PLACEHOLDER_PATTERN =
  /^\s*(?:\[[^\]]*\]|\{\{?[^}]*\}?\}|<[^>]*>|tbd|todo|n\/a|placeholder)\s*$/i

export type TranslationField = {
  field: string
  text: string
  fieldType?: 'title' | 'description' | 'location' | 'highlights' | 'general' | string
  isArray?: boolean
}

/** Carries the HTTP status and code the route handlers used to return. */
export class TranslationError extends Error {
  code: string
  status: number

  constructor(message: string, code: string, status: number) {
    super(message)
    this.name = 'TranslationError'
    this.code = code
    this.status = status
  }
}

/**
 * Map a raw AI Gateway failure onto the codes the admin UI already knows
 * how to explain (credits exhausted, rate limited, bad auth).
 */
function toTranslationError(aiError: any): TranslationError {
  const errorMessage = aiError?.message || ''
  const errorCause = aiError?.cause?.message || ''
  const mentions = (...needles: string[]) =>
    needles.some(
      (needle) => errorMessage.includes(needle) || errorCause.includes(needle),
    )

  if (mentions('rate limit', 'quota', '429')) {
    return new TranslationError(
      'AI Gateway rate limit exceeded. Please wait a moment and try again.',
      'RATE_LIMIT',
      429,
    )
  }

  if (mentions('credit', 'billing', 'insufficient')) {
    return new TranslationError(
      'AI Gateway credits exhausted. Please refill your AI Gateway credits to continue translating.',
      'CREDITS_EXHAUSTED',
      402,
    )
  }

  if (mentions('401', 'unauthorized')) {
    return new TranslationError(
      'AI Gateway authentication failed. Please check your API key configuration.',
      'AUTH_ERROR',
      401,
    )
  }

  return new TranslationError(
    `Translation AI error: ${errorMessage || 'Unknown error'}`,
    'AI_ERROR',
    500,
  )
}

function contextHintFor(fieldType?: string): string {
  if (fieldType === 'title') {
    return 'This is a title/heading. Keep it concise and impactful.'
  }
  if (fieldType === 'description') {
    return 'This is a description. Maintain the tone and marketing appeal.'
  }
  if (fieldType === 'location') {
    return 'This is a location name. Transliterate proper nouns appropriately.'
  }
  if (fieldType === 'highlights' || fieldType === 'highlight') {
    return 'This is a feature highlight. Keep it punchy and compelling.'
  }
  return ''
}

/**
 * Translate a single string.
 *
 * Returns `null` when there is nothing usable to store — an empty source,
 * or output that looks like a placeholder. Callers must skip persisting a
 * null rather than writing a broken half-localized value; the runtime
 * fallback in `getLocalizedField()` shows the source text instead.
 */
export async function translateSingleText(options: {
  text: string
  targetLanguage: string
  sourceLanguage?: string
  fieldType?: string
}): Promise<string | null> {
  const { text, targetLanguage, sourceLanguage = 'en', fieldType } = options

  const source = typeof text === 'string' ? text : String(text ?? '')
  if (!source.trim()) return ''

  // No-op: same source/target. Echo rather than letting the model reword.
  if (sourceLanguage === targetLanguage) return source

  const targetLang = LANGUAGE_NAMES[targetLanguage] || targetLanguage
  const sourceLang = LANGUAGE_NAMES[sourceLanguage] || sourceLanguage

  let result
  try {
    result = await generateText({
      model: MODEL,
      system: `You are a professional translator specializing in travel and golf tourism content.
Translate the following text from ${sourceLang} to ${targetLang}.
${contextHintFor(fieldType)}

STRICT OUTPUT RULES:
- Output ONLY the final translated text in ${targetLang}. No preamble, no labels, no quotes, no explanations.
- NEVER output placeholder-style tokens such as "[title]", "[description]", "{name}", "<value>", "TBD", "TODO", "N/A", "...", or the source wrapped in brackets. If a brand or proper noun should stay in its original form, write it naturally without surrounding brackets.
- Preserve paragraph breaks, line breaks, bullet markers, and list numbering from the source.
- Do not truncate, summarize, or drop content. Translate the full text.
- Maintain proper grammar, natural phrasing, and cultural appropriateness for ${targetLang}.`,
      prompt: source,
    })
  } catch (aiError: any) {
    console.error('[translate] AI error:', aiError?.message, aiError?.cause)
    throw toTranslationError(aiError)
  }

  const translated = (result.text || '').trim()

  if (!translated || PLACEHOLDER_PATTERN.test(translated)) {
    console.warn(
      `[translate] Skipping placeholder-looking translation (${sourceLang} → ${targetLang}): ${translated.slice(0, 80)}`,
    )
    return null
  }

  return translated
}

/**
 * Translate several fields in one model call.
 *
 * `missingKeys` lists fields the model dropped or answered with a
 * placeholder, so the caller can retry just those individually.
 */
export async function translateFields(options: {
  fields: TranslationField[]
  targetLanguage: string
  sourceLanguage?: string
}): Promise<{ translations: Record<string, string>; missingKeys: string[] }> {
  const { fields, targetLanguage, sourceLanguage = 'en' } = options

  const targetLang = LANGUAGE_NAMES[targetLanguage] || targetLanguage
  const sourceLang = LANGUAGE_NAMES[sourceLanguage] || sourceLanguage

  // Never ask the model to invent content for a missing source value —
  // that is where placeholder-looking output creeps in.
  const validFields = fields.filter(
    (f) => typeof f.text === 'string' && f.text.trim().length > 0,
  )

  if (validFields.length === 0) return { translations: {}, missingKeys: [] }

  // No-op translation (same language): echo the source back.
  if (sourceLanguage === targetLanguage) {
    const translations: Record<string, string> = {}
    for (const f of validFields) translations[f.field] = f.text
    return { translations, missingKeys: [] }
  }

  // Key/value pairs (rather than "[0] text" markers) make parsing
  // deterministic and stop the model inventing placeholder output.
  const payload = {
    source_language: sourceLang,
    target_language: targetLang,
    items: validFields.map((f) => ({
      key: f.field,
      field_type: f.fieldType || 'general',
      text: f.text,
    })),
  }

  // An array of {key, value} objects keeps this compatible with OpenAI
  // strict mode, which rejects open-ended record schemas.
  const translationSchema = z.object({
    translations: z
      .array(
        z.object({
          key: z
            .string()
            .describe(
              'The exact `key` value from the corresponding input item. Copy it verbatim.',
            ),
          value: z
            .string()
            .describe(
              'The complete translation of the input `text` into the target language. Never leave placeholders, bracketed tokens, or untranslated source content.',
            ),
        }),
      )
      .describe(
        'One entry for every input item, in the same order. Do not omit, merge, or add items.',
      ),
  })

  let output: z.infer<typeof translationSchema>
  try {
    const result = await generateText({
      model: MODEL,
      output: Output.object({ schema: translationSchema }),
      // Long markdown fields (overview_content, description) can easily
      // blow past default output limits when several are batched
      // together. Without this the structured-output JSON gets
      // truncated, the SDK returns a partial array, and callers silently
      // drop the missing fields — surfacing as "translation succeeded
      // but some columns weren't updated".
      maxOutputTokens: 16000,
      system: `You are a professional translator specializing in travel and golf tourism content.

You will receive a JSON payload listing items that need to be translated from ${sourceLang} to ${targetLang}. Each item has a stable "key", a "field_type" hint (title | description | location | highlights | general), and the source "text".

CRITICAL RULES:
- Return one translation for EVERY input item, using the EXACT same "key" value.
- "value" must be a complete, natural, fully localized translation of "text" in ${targetLang}.
- NEVER output bracketed placeholders (e.g. "[title]", "[description]", "{name}", "<value>", "TBD", "TODO", "N/A"), ellipses substituted for missing content, or the literal source text wrapped in brackets. If the source text is a proper noun or brand name that should stay in its original form, write it out naturally without surrounding brackets.
- Preserve paragraph breaks, line breaks, bullet markers, and list numbering from the source.
- Do not truncate, summarize, or drop content. Translate the full text.
- Do not add explanations, notes, quotes, or any content that is not a translation.
- For titles, keep them concise and impactful. For descriptions, keep marketing-friendly tone. For locations, transliterate proper nouns appropriately for ${targetLang}. For highlights, keep them punchy.`,
      prompt: JSON.stringify(payload),
    })
    output = result.output
  } catch (aiError: any) {
    console.error(
      '[translate/batch] AI error:',
      aiError?.message,
      aiError?.cause,
    )
    throw toTranslationError(aiError)
  }

  const returnedByKey = new Map<string, string>()
  for (const entry of output.translations || []) {
    if (!entry || typeof entry.key !== 'string') continue
    returnedByKey.set(
      entry.key,
      typeof entry.value === 'string' ? entry.value : '',
    )
  }

  const translations: Record<string, string> = {}
  const missingKeys: string[] = []

  for (const f of validFields) {
    const raw = returnedByKey.get(f.field)
    if (!raw) {
      // Dropped entirely — most often the JSON output ran out of tokens
      // before reaching it. Track it so the caller can retry just this one.
      missingKeys.push(f.field)
      console.warn(
        `[translate/batch] Missing translation for "${f.field}" (${sourceLang} → ${targetLang})`,
      )
      continue
    }

    const trimmed = raw.trim()
    if (!trimmed) {
      missingKeys.push(f.field)
      continue
    }

    if (PLACEHOLDER_PATTERN.test(trimmed)) {
      console.warn(
        `[translate/batch] Skipping placeholder-looking translation for "${f.field}" (${targetLang}): ${trimmed.slice(0, 80)}`,
      )
      missingKeys.push(f.field)
      continue
    }

    translations[f.field] = trimmed
  }

  return { translations, missingKeys }
}
