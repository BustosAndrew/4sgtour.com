import { NextResponse } from 'next/server'
import {
  TranslationError,
  translateFields,
  type TranslationField,
} from '@/lib/translate-text'

// Thin HTTP wrapper over `translateFields`. Browser callers (the admin
// language tabs, the create-event form) use this; server-side callers
// import the lib directly rather than paying for a second function
// invocation to reach it.
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
      return NextResponse.json(
        {
          error: 'Missing required fields: fields (array) and targetLanguage',
        },
        { status: 400 },
      )
    }

    const { translations, missingKeys } = await translateFields({
      fields,
      targetLanguage,
      sourceLanguage,
    })

    return NextResponse.json({ translations, missingKeys })
  } catch (error) {
    if (error instanceof TranslationError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status },
      )
    }

    console.error('Batch translation error:', error)
    return NextResponse.json(
      {
        error: `Translation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        code: 'TRANSLATION_ERROR',
      },
      { status: 500 },
    )
  }
}
