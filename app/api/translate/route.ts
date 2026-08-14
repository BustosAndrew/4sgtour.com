import { NextResponse } from 'next/server'
import { TranslationError, translateSingleText } from '@/lib/translate-text'

// Thin HTTP wrapper over `translateSingleText`. Browser callers use this;
// server-side callers import the lib directly rather than paying for a
// second function invocation to reach it.
export async function POST(req: Request) {
  try {
    const {
      text,
      targetLanguage,
      sourceLanguage = 'en',
      fieldType,
    } = await req.json()

    if (!text || !targetLanguage) {
      return NextResponse.json(
        { error: 'Missing required fields: text and targetLanguage' },
        { status: 400 },
      )
    }

    const translation = await translateSingleText({
      text,
      targetLanguage,
      sourceLanguage,
      fieldType,
    })

    return NextResponse.json({ translation })
  } catch (error) {
    if (error instanceof TranslationError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status },
      )
    }

    console.error('Translation error:', error)
    return NextResponse.json({ error: 'Translation failed' }, { status: 500 })
  }
}
