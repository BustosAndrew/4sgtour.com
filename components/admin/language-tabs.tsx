"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Languages, Loader2, Sparkles } from "lucide-react"

type Language = "en" | "ko" | "de"

type TranslationField = {
  field: string
  text: string
  fieldType?: "title" | "description" | "location" | "highlights" | "general"
  isArray?: boolean
}

interface LanguageTabsProps {
  activeLanguage: Language
  onLanguageChange: (lang: Language) => void
  onAutoTranslate: () => void
  isTranslating: boolean
  hasEnglishContent: boolean
  children: React.ReactNode
  languages?: Language[]
}

const LANGUAGE_NAMES: Record<Language, string> = {
  en: "English",
  ko: "Korean",
  de: "German",
}

const LANGUAGE_LABELS: Record<Language, { short: string; desc: string }> = {
  en: { short: "EN", desc: "Editing English content (primary language)" },
  ko: { short: "KO", desc: "Editing Korean translation" },
  de: { short: "DE", desc: "Editing German translation" },
}

export function LanguageTabs({
  activeLanguage,
  onLanguageChange,
  onAutoTranslate,
  isTranslating,
  hasEnglishContent,
  children,
  languages = ["en", "ko", "de"],
}: LanguageTabsProps) {
  const visibleLanguages = languages.filter((lang) => lang !== activeLanguage)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Tabs value={activeLanguage} onValueChange={(v) => onLanguageChange(v as Language)}>
          <TabsList className={`grid w-fit grid-cols-${languages.length}`}>
            {languages.map((lang) => (
              <TabsTrigger key={lang} value={lang} className="flex items-center gap-2">
                <span className="text-xs">{LANGUAGE_LABELS[lang].short}</span>
                {LANGUAGE_NAMES[lang]}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {activeLanguage !== "en" && hasEnglishContent && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onAutoTranslate}
            disabled={isTranslating}
            className="flex items-center gap-2"
          >
            {isTranslating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Translating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Auto-Translate from English
              </>
            )}
          </Button>
        )}
      </div>

      <div className="rounded-lg border bg-muted/30 p-1">
        <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
          <Languages className="h-4 w-4" />
          <span>{LANGUAGE_LABELS[activeLanguage].desc}</span>
        </div>
      </div>

      {children}
    </div>
  )
}

// Hook for managing translations in forms
export function useTranslations<T extends Record<string, unknown>>(
  initialEnglish: T,
  initialKorean: Partial<T> = {},
  initialGerman: Partial<T> = {}
) {
  const [activeLanguage, setActiveLanguage] = useState<Language>("en")
  const [englishData, setEnglishData] = useState<T>(initialEnglish)
  const [koreanData, setKoreanData] = useState<Partial<T>>(initialKorean)
  const [germanData, setGermanData] = useState<Partial<T>>(initialGerman)
  const [isTranslating, setIsTranslating] = useState(false)

  const currentData = activeLanguage === "en" 
    ? englishData 
    : activeLanguage === "ko"
      ? { ...englishData, ...koreanData }
      : { ...englishData, ...germanData }

  const updateField = (field: keyof T, value: T[keyof T]) => {
    if (activeLanguage === "en") {
      setEnglishData((prev) => ({ ...prev, [field]: value }))
    } else if (activeLanguage === "ko") {
      setKoreanData((prev) => ({ ...prev, [field]: value }))
    } else {
      setGermanData((prev) => ({ ...prev, [field]: value }))
    }
  }

  const autoTranslate = async (fieldsToTranslate: TranslationField[], targetLanguage: Language) => {
    setIsTranslating(true)
    try {
      const response = await fetch("/api/translate/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fields: fieldsToTranslate,
          targetLanguage,
        }),
      })

      if (!response.ok) throw new Error("Translation failed")

      const { translations } = await response.json()
      if (targetLanguage === "ko") {
        setKoreanData((prev) => ({ ...prev, ...translations }))
      } else {
        setGermanData((prev) => ({ ...prev, ...translations }))
      }
      return translations
    } catch (error) {
      console.error("Translation error:", error)
      throw error
    } finally {
      setIsTranslating(false)
    }
  }

  return {
    activeLanguage,
    setActiveLanguage,
    englishData,
    setEnglishData,
    koreanData,
    setKoreanData,
    germanData,
    setGermanData,
    currentData,
    updateField,
    isTranslating,
    autoTranslate,
  }
}
