"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Languages, Loader2 } from "lucide-react"

type Language = "en" | "ko" | "de"

interface TranslateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  itemType: "trip" | "event"
  itemId: string
  itemName: string
  availableSourceLanguages: Language[]
  onSuccess?: () => void
}

const LANGUAGE_NAMES: Record<Language, string> = {
  en: "English",
  ko: "Korean",
  de: "German",
}

export function TranslateDialog({
  open,
  onOpenChange,
  itemType,
  itemId,
  itemName,
  availableSourceLanguages,
  onSuccess,
}: TranslateDialogProps) {
  const [sourceLanguage, setSourceLanguage] = useState<Language>(
    availableSourceLanguages[0] || "en"
  )
  const [targetLanguages, setTargetLanguages] = useState<Language[]>([])
  const [isTranslating, setIsTranslating] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const allLanguages: Language[] = ["en", "ko", "de"]
  const availableTargets = allLanguages.filter((l) => l !== sourceLanguage)

  const handleTargetToggle = (lang: Language) => {
    setTargetLanguages((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]
    )
  }

  const handleTranslate = async () => {
    if (targetLanguages.length === 0) return

    setIsTranslating(true)
    setResult(null)

    try {
      const endpoint = itemType === "trip" 
        ? `/api/admin/translate-trip/${itemId}`
        : `/api/admin/translate-event/${itemId}`

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceLanguage,
          targetLanguages,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setResult({ success: true, message: data.message })
        onSuccess?.()
      } else {
        setResult({ success: false, message: data.error || "Translation failed" })
      }
    } catch (error) {
      setResult({ success: false, message: "Failed to connect to translation service" })
    } finally {
      setIsTranslating(false)
    }
  }

  const handleClose = () => {
    setResult(null)
    setTargetLanguages([])
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Languages className="h-5 w-5" />
            Translate {itemType === "trip" ? "Trip" : "Event"}
          </DialogTitle>
          <DialogDescription>
            Translate "{itemName}" to other languages
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Source Language */}
          <div>
            <label className="text-sm font-medium text-gray-700">
              Source Language
            </label>
            <p className="text-xs text-gray-500 mb-2">
              Translate from this language
            </p>
            <div className="flex gap-2">
              {availableSourceLanguages.map((lang) => (
                <button
                  key={lang}
                  onClick={() => {
                    setSourceLanguage(lang)
                    setTargetLanguages((prev) => prev.filter((l) => l !== lang))
                  }}
                  className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                    sourceLanguage === lang
                      ? "bg-[#274C77] text-white border-[#274C77]"
                      : "bg-white text-gray-700 border-gray-300 hover:border-gray-400"
                  }`}
                >
                  {LANGUAGE_NAMES[lang]}
                </button>
              ))}
            </div>
          </div>

          {/* Target Languages */}
          <div>
            <label className="text-sm font-medium text-gray-700">
              Target Languages
            </label>
            <p className="text-xs text-gray-500 mb-2">
              Translate into these languages (select one or more)
            </p>
            <div className="flex gap-2">
              {availableTargets.map((lang) => (
                <button
                  key={lang}
                  onClick={() => handleTargetToggle(lang)}
                  className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                    targetLanguages.includes(lang)
                      ? "bg-[#274C77] text-white border-[#274C77]"
                      : "bg-white text-gray-700 border-gray-300 hover:border-gray-400"
                  }`}
                >
                  {LANGUAGE_NAMES[lang]}
                </button>
              ))}
            </div>
          </div>

          {/* Result Message */}
          {result && (
            <div
              className={`p-3 rounded-md text-sm ${
                result.success
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              {result.message}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {result?.success ? "Done" : "Cancel"}
          </Button>
          {!result?.success && (
            <Button
              onClick={handleTranslate}
              disabled={isTranslating || targetLanguages.length === 0}
              className="bg-[#274C77] hover:bg-[#274C77]/90"
            >
              {isTranslating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Translating...
                </>
              ) : (
                <>
                  <Languages className="mr-2 h-4 w-4" />
                  Translate
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
