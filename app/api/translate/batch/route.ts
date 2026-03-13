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
        model: 'openai/gpt-5-mini',
        system: `You are a professional translator specializing in travel and golf tourism content.
Translate all the following fields from ${sourceLang} to ${targetLang}.

CRITICAL OUTPUT FORMAT:
- Start each translation with [index] where index is the field number (e.g., [0], [1], [2])
- Include the COMPLETE translation for each field - do not truncate or summarize
- For multi-line content (paragraphs), include ALL paragraphs in the translation
- For array fields, use [index.subindex] format (e.g., [0.0], [0.1], [0.2])
- Example for long content:
  [0] First paragraph of translation.
  
  Second paragraph of translation.
  
  Third paragraph continues here.
  [1] Next field translation here.

TRANSLATION GUIDELINES:
- Maintain proper grammar, natural phrasing, and cultural appropriateness
- Keep titles concise and impactful
- Keep descriptions marketing-friendly
- Transliterate location names appropriately
- Preserve paragraph breaks and formatting from the original
- Do not add explanations or extra text`,
        prompt: fieldsToTranslate,
      })
    } catch (aiError: any) {
      console.error("Batch translate AI error:", aiError?.message, aiError?.cause)
      
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

    // Parse the response - handle multi-line content by collecting all text until the next [index]
    const translations: Record<string, string | string[]> = {}
    const responseText = result.text.trim()
    
    // Split by field markers [0], [1], etc. while preserving the markers
    const fieldRegex = /\[(\d+)(?:\.(\d+))?\]/g
    const parts: { index: number; subIndex?: number; startPos: number }[] = []
    
    let match
    while ((match = fieldRegex.exec(responseText)) !== null) {
      parts.push({
        index: parseInt(match[1]),
        subIndex: match[2] !== undefined ? parseInt(match[2]) : undefined,
        startPos: match.index + match[0].length
      })
    }
    
    // Extract translations for each part
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]
      const endPos = i < parts.length - 1 ? responseText.lastIndexOf('[', parts[i + 1].startPos) : responseText.length
      const translation = responseText.slice(part.startPos, endPos).trim()
      
      const field = fields[part.index]
      if (!field) continue
      
      if (part.subIndex !== undefined) {
        // Array item
        if (!translations[field.field]) {
          translations[field.field] = []
        }
        (translations[field.field] as string[]).push(translation)
      } else if (!field.isArray) {
        // Simple field
        translations[field.field] = translation
      }
    }

    // Log translation lengths for debugging
    console.log("[v0] Batch translate completed. Fields translated:", Object.keys(translations).length)
    for (const [key, value] of Object.entries(translations)) {
      const len = typeof value === 'string' ? value.length : (value as string[]).length
      console.log(`[v0]   - ${key}: ${typeof value === 'string' ? `${len} chars` : `${len} items`}`)
    }
    
    return Response.json({ translations })
  } catch (error) {
    console.error('Batch translation error:', error)
    return Response.json(
      { error: `Translation failed: ${error instanceof Error ? error.message : 'Unknown error'}`, code: 'TRANSLATION_ERROR' },
      { status: 500 }
    )
  }
}
