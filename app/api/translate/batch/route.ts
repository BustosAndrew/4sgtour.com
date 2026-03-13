import { generateText } from 'ai'

type TranslationField = {
  field: string
  text: string
  fieldType?: 'title' | 'description' | 'location' | 'highlights' | 'general'
  isArray?: boolean
}

export async function POST(req: Request) {
  try {
    const { fields, targetLanguage, sourceLanguage = 'en' } = await req.json() as {
      fields: TranslationField[]
      targetLanguage: string
      sourceLanguage?: string
    }

    if (!fields || !targetLanguage || !Array.isArray(fields)) {
      return Response.json(
        { error: 'Missing required fields: fields (array) and targetLanguage' },
        { status: 400 }
      )
    }

    const languageNames: Record<string, string> = {
      ko: 'Korean',
      de: 'German',
      en: 'English',
    }

    const targetLang = languageNames[targetLanguage] || targetLanguage
    const sourceLang = languageNames[sourceLanguage] || sourceLanguage

    // Build a structured prompt for batch translation
    const fieldsToTranslate = fields
      .filter(f => f.text && f.text.trim())
      .map((f, i) => {
        if (f.isArray && Array.isArray(f.text)) {
          return `[${i}] ${f.field} (${f.fieldType || 'general'}, array):\n${f.text.map((item, j) => `  ${j}. ${item}`).join('\n')}`
        }
        return `[${i}] ${f.field} (${f.fieldType || 'general'}): ${f.text}`
      })
      .join('\n\n')

    if (!fieldsToTranslate) {
      return Response.json({ translations: {} })
    }

    let result
    try {
      result = await generateText({
        model: 'openai/gpt-4o-mini',
        system: `You are a professional translator specializing in travel and golf tourism content.
Translate all the following fields from ${sourceLang} to ${targetLang}.

IMPORTANT:
- For each field, output ONLY the translation in the exact format: [index] translation
- For array fields, output each item on a new line with its sub-index: [index.subindex] translation
- Maintain proper grammar, natural phrasing, and cultural appropriateness
- Keep titles concise and impactful
- Keep descriptions marketing-friendly
- Transliterate location names appropriately
- Do not add explanations or extra text`,
        prompt: fieldsToTranslate,
      })
    } catch (aiError: any) {
      console.error("[v0] batch translate: AI error:", aiError?.message, aiError?.cause)
      
      // Check for specific error types
      const errorMessage = aiError?.message || ''
      const errorCause = aiError?.cause?.message || ''
      
      if (errorMessage.includes('rate limit') || errorMessage.includes('quota') || 
          errorCause.includes('rate limit') || errorCause.includes('quota') ||
          errorMessage.includes('429') || errorCause.includes('429')) {
        return Response.json(
          { error: 'AI Gateway rate limit exceeded. Please wait a moment and try again.', code: 'RATE_LIMIT' },
          { status: 429 }
        )
      }
      
      if (errorMessage.includes('credit') || errorMessage.includes('billing') ||
          errorCause.includes('credit') || errorCause.includes('billing') ||
          errorMessage.includes('insufficient') || errorCause.includes('insufficient')) {
        return Response.json(
          { error: 'AI Gateway credits exhausted. Please refill your AI Gateway credits to continue translating.', code: 'CREDITS_EXHAUSTED' },
          { status: 402 }
        )
      }
      
      if (errorMessage.includes('401') || errorMessage.includes('unauthorized') ||
          errorCause.includes('401') || errorCause.includes('unauthorized')) {
        return Response.json(
          { error: 'AI Gateway authentication failed. Please check your API key configuration.', code: 'AUTH_ERROR' },
          { status: 401 }
        )
      }
      
      return Response.json(
        { error: `Translation AI error: ${errorMessage || 'Unknown error'}`, code: 'AI_ERROR' },
        { status: 500 }
      )
    }

    // Parse the response
    const translations: Record<string, string | string[]> = {}
    const lines = result.text.trim().split('\n')
    
    for (const line of lines) {
      // Match patterns like [0] translation or [0.1] translation
      const arrayMatch = line.match(/^\[(\d+)\.(\d+)\]\s*(.+)$/)
      const simpleMatch = line.match(/^\[(\d+)\]\s*(.+)$/)
      
      if (arrayMatch) {
        const [, fieldIndex, , translation] = arrayMatch
        const field = fields[parseInt(fieldIndex)]
        if (field) {
          if (!translations[field.field]) {
            translations[field.field] = []
          }
          (translations[field.field] as string[]).push(translation.trim())
        }
      } else if (simpleMatch) {
        const [, fieldIndex, translation] = simpleMatch
        const field = fields[parseInt(fieldIndex)]
        if (field && !field.isArray) {
          translations[field.field] = translation.trim()
        }
      }
    }

    return Response.json({ translations })
  } catch (error) {
    console.error('Batch translation error:', error)
    return Response.json(
      { error: 'Translation failed' },
      { status: 500 }
    )
  }
}
