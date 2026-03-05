"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Languages, Loader2, Sparkles } from "lucide-react"

type Language = "en" | "de"

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
}

export function LanguageTabs({
  activeLanguage,
  onLanguageChange,
  onAutoTranslate,
  isTranslating,
  hasEnglishContent,
  children,
}: LanguageTabsProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Tabs value={activeLanguage} onValueChange={(v) => onLanguageChange(v as Language)}>
          <TabsList className="grid w-[200px] grid-cols-2">
            <TabsTrigger value="en" className="flex items-center gap-2">
              <span className="text-xs">EN</span>
              English
            </TabsTrigger>
            <TabsTrigger value="de" className="flex items-center gap-2">
              <span className="text-xs">DE</span>
              German
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {activeLanguage === "de" && hasEnglishContent && (
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
          {activeLanguage === "en" ? (
            <span>Editing English content (primary language)</span>
          ) : (
            <span>Editing German translation</span>
          )}
        </div>
      </div>

      {children}
    </div>
  )
}

// Hook for managing translations in forms
export function useTranslations<T extends Record<string, unknown>>(
  initialEnglish: T,
  initialKorean: Partial<T> = {}
) {
  const [activeLanguage, setActiveLanguage] = useState<Language>("en")
  const [englishData, setEnglishData] = useState<T>(initialEnglish)
  const [germanData, setGermanData] = useState<Partial<T>>(initialKorean)
  const [isTranslating, setIsTranslating] = useState(false)

  const currentData = activeLanguage === "en" ? englishData : { ...englishData, ...germanData }

  const updateField = (field: keyof T, value: T[keyof T]) => {
    if (activeLanguage === "en") {
      setEnglishData((prev) => ({ ...prev, [field]: value }))
    } else {
      setGermanData((prev) => ({ ...prev, [field]: value }))
    }
  }

  const autoTranslate = async (fieldsToTranslate: TranslationField[]) => {
    setIsTranslating(true)
    try {
      const response = await fetch("/api/translate/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fields: fieldsToTranslate,
          targetLanguage: "de",
        }),
      })

      if (!response.ok) throw new Error("Translation failed")

      const { translations } = await response.json()
      setGermanData((prev) => ({ ...prev, ...translations }))
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
    germanData,
    setGermanData,
    currentData,
    updateField,
    isTranslating,
    autoTranslate,
  }
}
