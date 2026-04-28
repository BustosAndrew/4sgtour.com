import { generateText, Output } from 'ai'
import { z } from 'zod'

type TranslationField = {
  field: string
  text: string
  fieldType?: 'title' | 'description' | 'location' | 'highlights' | 'general'
  isArray?: boolean
}

export async function POST(req: Request) {
  try {
    const {
      fields,
      targetLanguage,
      sourceLanguage = 'en',
    } = (await req.json()) as {
      fields: TranslationField[]
      targetLanguage: string
      sourceLanguage?: string
    }

    if (!fields || !targetLanguage || !Array.isArray(fields)) {
      return Response.json(
        {
          error: 'Missing required fields: fields (array) and targetLanguage',
        },
        { status: 400 },
      )
    }

    const languageNames: Record<string, string> = {
      ko: 'Korean',
      de: 'German',
      en: 'English',
    }

    const targetLang = languageNames[targetLanguage] || targetLanguage
    const sourceLang = languageNames[sourceLanguage] || sourceLanguage

    // Filter out fields whose source text is empty; we won't ask the model
    // to invent content for missing source values (that's where
    // placeholder-looking output creeps in).
    const validFields = fields.filter(
      (f) => typeof f.text === 'string' && f.text.trim().length > 0,
    )

    if (validFields.length === 0) {
      return Response.json({ translations: {} })
    }

    // Detect a no-op translation (same language). Just echo the source
    // rather than hitting the model.
    if (sourceLanguage === targetLanguage) {
      const translations: Record<string, string> = {}
      for (const f of validFields) translations[f.field] = f.text
      return Response.json({ translations })
    }

    // Build a JSON payload for the model. Using key/value pairs (rather
    // than "[0] text" markers) makes parsing deterministic and prevents
    // the model from ever inventing placeholder-style output.
    const payload = {
      source_language: sourceLang,
      target_language: targetLang,
      items: validFields.map((f) => ({
        key: f.field,
        field_type: f.fieldType || 'general',
        text: f.text,
      })),
    }

    // Schema for structured output. Using an array of {key, value}
    // objects keeps us compatible with OpenAI strict mode (which rejects
    // open-ended record schemas).
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
        model: 'openai/gpt-5-mini',
        output: Output.object({ schema: translationSchema }),
        // Long markdown fields (overview_content, description) can easily blow
        // past default output limits when several are batched together.
        // Without this, the structured-output JSON gets truncated, the SDK
        // returns a partial array, and downstream callers silently drop the
        // missing fields — surfacing as "translation succeeded but some
        // columns weren't updated".
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
        'Batch translate AI error:',
        aiError?.message,
        aiError?.cause,
      )

      const errorMessage = aiError?.message || ''
      const errorCause = aiError?.cause?.message || ''

      if (
        errorMessage.includes('rate limit') ||
        errorMessage.includes('quota') ||
        errorCause.includes('rate limit') ||
        errorCause.includes('quota') ||
        errorMessage.includes('429') ||
        errorCause.includes('429')
      ) {
        return Response.json(
          {
            error:
              'AI Gateway rate limit exceeded. Please wait a moment and try again.',
            code: 'RATE_LIMIT',
          },
          { status: 429 },
        )
      }

      if (
        errorMessage.includes('credit') ||
        errorMessage.includes('billing') ||
        errorCause.includes('credit') ||
        errorCause.includes('billing') ||
        errorMessage.includes('insufficient') ||
        errorCause.includes('insufficient')
      ) {
        return Response.json(
          {
            error:
              'AI Gateway credits exhausted. Please refill your AI Gateway credits to continue translating.',
            code: 'CREDITS_EXHAUSTED',
          },
          { status: 402 },
        )
      }

      if (
        errorMessage.includes('401') ||
        errorMessage.includes('unauthorized') ||
        errorCause.includes('401') ||
        errorCause.includes('unauthorized')
      ) {
        return Response.json(
          {
            error:
              'AI Gateway authentication failed. Please check your API key configuration.',
            code: 'AUTH_ERROR',
          },
          { status: 401 },
        )
      }

      return Response.json(
        {
          error: `Translation AI error: ${errorMessage || 'Unknown error'}`,
          code: 'AI_ERROR',
        },
        { status: 500 },
      )
    }

    // Build a lookup from the model's returned pairs.
    const returnedByKey = new Map<string, string>()
    for (const entry of output.translations || []) {
      if (!entry || typeof entry.key !== 'string') continue
      const value = typeof entry.value === 'string' ? entry.value : ''
      returnedByKey.set(entry.key, value)
    }

    // Sanity check for placeholder-looking output. If the model ignores
    // instructions and emits a placeholder, we fall back to the source
    // text rather than persisting a broken translation. This guarantees
    // the final stored value never looks like a half-localized placeholder.
    const placeholderPattern =
      /^\s*(?:\[[^\]]*\]|\{\{?[^}]*\}?\}|<[^>]*>|tbd|todo|n\/a|placeholder)\s*$/i

    const translations: Record<string, string> = {}
    const missingKeys: string[] = []
    for (const f of validFields) {
      const raw = returnedByKey.get(f.field)
      if (!raw) {
        // Model dropped this key entirely (most often because the JSON
        // output ran out of tokens before reaching it). Track it so the
        // caller can retry just the missing ones.
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
      if (placeholderPattern.test(trimmed)) {
        // Skip placeholder-looking output entirely. The caller will
        // simply not update this column, and the runtime fallback in
        // getLocalizedField() will show the source-language text
        // instead of a broken "[title]"-style placeholder.
        console.warn(
          `[translate/batch] Skipping placeholder-looking translation for "${f.field}" (${targetLang}): ${trimmed.slice(0, 80)}`,
        )
        missingKeys.push(f.field)
        continue
      }
      translations[f.field] = trimmed
    }

    return Response.json({ translations, missingKeys })
  } catch (error) {
    console.error('Batch translation error:', error)
    return Response.json(
      {
        error: `Translation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        code: 'TRANSLATION_ERROR',
      },
      { status: 500 },
    )
  }
}
