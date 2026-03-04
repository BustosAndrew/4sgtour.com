import { generateText } from 'ai'

export async function POST(req: Request) {
  try {
    const { text, targetLanguage, fieldType } = await req.json()

    if (!text || !targetLanguage) {
      return Response.json(
        { error: 'Missing required fields: text and targetLanguage' },
        { status: 400 }
      )
    }

    // Map language codes to full names for better translation context
    const languageNames: Record<string, string> = {
      ko: 'Korean',
      de: 'German',
      en: 'English',
    }

    const targetLang = languageNames[targetLanguage] || targetLanguage

    // Build context-aware prompt based on field type
    let contextHint = ''
    if (fieldType === 'title') {
      contextHint = 'This is a title/heading. Keep it concise and impactful.'
    } else if (fieldType === 'description') {
      contextHint = 'This is a description. Maintain the tone and marketing appeal.'
    } else if (fieldType === 'location') {
      contextHint = 'This is a location name. Transliterate proper nouns appropriately.'
    } else if (fieldType === 'highlights') {
      contextHint = 'These are feature highlights. Keep them punchy and compelling.'
    }

    const result = await generateText({
      model: 'openai/gpt-4o-mini',
      system: `You are a professional translator specializing in travel and golf tourism content. 
Translate the following text to ${targetLang}. 
${contextHint}
Only output the translation, nothing else. Do not add quotes or explanations.
Maintain proper grammar, natural phrasing, and cultural appropriateness for the target language.`,
      prompt: text,
    })

    return Response.json({ translation: result.text.trim() })
  } catch (error) {
    console.error('Translation error:', error)
    return Response.json(
      { error: 'Translation failed' },
      { status: 500 }
    )
  }
}
