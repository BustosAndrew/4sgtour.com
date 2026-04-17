import { generateText } from 'ai'

export async function POST(req: Request) {
  try {
    const {
      text,
      targetLanguage,
      sourceLanguage = 'en',
      fieldType,
    } = await req.json()

    if (!text || !targetLanguage) {
      return Response.json(
        { error: 'Missing required fields: text and targetLanguage' },
        { status: 400 },
      )
    }

    // Trim and short-circuit empty input so we never ask the model to
    // invent a translation for missing content (a common source of
    // placeholder-looking output).
    const source = typeof text === 'string' ? text : String(text ?? '')
    if (!source.trim()) {
      return Response.json({ translation: '' })
    }

    // Map language codes to full names for better translation context
    const languageNames: Record<string, string> = {
      ko: 'Korean',
      de: 'German',
      en: 'English',
    }

    const targetLang = languageNames[targetLanguage] || targetLanguage
    const sourceLang = languageNames[sourceLanguage] || sourceLanguage

    // No-op: same source/target → echo back. Avoids a useless AI call
    // that could introduce subtle rewording or placeholders.
    if (sourceLanguage === targetLanguage) {
      return Response.json({ translation: source })
    }

    // Build context-aware prompt based on field type
    let contextHint = ''
    if (fieldType === 'title') {
      contextHint = 'This is a title/heading. Keep it concise and impactful.'
    } else if (fieldType === 'description') {
      contextHint =
        'This is a description. Maintain the tone and marketing appeal.'
    } else if (fieldType === 'location') {
      contextHint =
        'This is a location name. Transliterate proper nouns appropriately.'
    } else if (fieldType === 'highlights' || fieldType === 'highlight') {
      contextHint =
        'This is a feature highlight. Keep it punchy and compelling.'
    }

    const result = await generateText({
      model: 'openai/gpt-5-mini',
      system: `You are a professional translator specializing in travel and golf tourism content.
Translate the following text from ${sourceLang} to ${targetLang}.
${contextHint}

STRICT OUTPUT RULES:
- Output ONLY the final translated text in ${targetLang}. No preamble, no labels, no quotes, no explanations.
- NEVER output placeholder-style tokens such as "[title]", "[description]", "{name}", "<value>", "TBD", "TODO", "N/A", "...", or the source wrapped in brackets. If a brand or proper noun should stay in its original form, write it naturally without surrounding brackets.
- Preserve paragraph breaks, line breaks, bullet markers, and list numbering from the source.
- Do not truncate, summarize, or drop content. Translate the full text.
- Maintain proper grammar, natural phrasing, and cultural appropriateness for ${targetLang}.`,
      prompt: source,
    })

    const translated = (result.text || '').trim()

    // Guard: if the model returns an obvious placeholder, return null so
    // the caller can skip persisting a broken "half-localized" value.
    // The UI already falls back to the source-language text via
    // getLocalizedField() when a localized column is empty.
    const placeholderPattern =
      /^\s*(?:\[[^\]]*\]|\{\{?[^}]*\}?\}|<[^>]*>|tbd|todo|n\/a|placeholder)\s*$/i
    if (!translated || placeholderPattern.test(translated)) {
      console.warn(
        `[translate] Skipping placeholder-looking translation (${sourceLang} → ${targetLang}): ${translated.slice(0, 80)}`,
      )
      return Response.json({ translation: null })
    }

    return Response.json({ translation: translated })
  } catch (error) {
    console.error('Translation error:', error)
    return Response.json({ error: 'Translation failed' }, { status: 500 })
  }
}
