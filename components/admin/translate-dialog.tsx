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

type ProgressState = {
  done: number
  total: number
  label: string | null
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
    availableSourceLanguages[0] || "en",
  )
  const [targetLanguages, setTargetLanguages] = useState<Language[]>([])
  const [isTranslating, setIsTranslating] = useState(false)
  const [progress, setProgress] = useState<ProgressState | null>(null)
  const [result, setResult] = useState<{
    success: boolean
    partial?: boolean
    message: string
  } | null>(null)

  const allLanguages: Language[] = ["en", "ko", "de"]
  const availableTargets = allLanguages.filter((l) => l !== sourceLanguage)

  const handleTargetToggle = (lang: Language) => {
    setTargetLanguages((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang],
    )
  }

  const errorFromCode = (status: number, code?: string, fallback?: string) => {
    if (code === "CREDITS_EXHAUSTED" || status === 402) {
      return "AI Gateway credits exhausted. Please refill your AI Gateway credits in the Vercel dashboard to continue translating."
    }
    if (code === "RATE_LIMIT" || status === 429) {
      return "Rate limit exceeded. Please wait a moment and try again."
    }
    if (code === "AUTH_ERROR" || status === 401) {
      return "AI Gateway authentication failed. Please check your API configuration."
    }
    return fallback || "Translation failed"
  }

  const handleTranslate = async () => {
    if (targetLanguages.length === 0) return

    setIsTranslating(true)
    setResult(null)
    setProgress({ done: 0, total: 0, label: null })

    try {
      const endpoint =
        itemType === "trip"
          ? `/api/admin/translate-trip/${itemId}`
          : `/api/admin/translate-event/${itemId}`

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceLanguage, targetLanguages }),
      })

      // Non-stream errors (auth/validation) come back as JSON.
      const contentType = response.headers.get("content-type") || ""
      if (!response.ok && !contentType.includes("ndjson")) {
        let data: any = {}
        try {
          data = await response.json()
        } catch {}
        setResult({
          success: false,
          message: errorFromCode(response.status, data?.code, data?.error),
        })
        return
      }

      if (!response.body) {
        setResult({ success: false, message: "No response body from translation service." })
        return
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ""
      let completed = false

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })

        let newlineIdx: number
        while ((newlineIdx = buffer.indexOf("\n")) !== -1) {
          const line = buffer.slice(0, newlineIdx).trim()
          buffer = buffer.slice(newlineIdx + 1)
          if (!line) continue

          let event: any
          try {
            event = JSON.parse(line)
          } catch (e) {
            console.error("[v0] Failed to parse stream line:", line, e)
            continue
          }

          if (event.type === "start") {
            setProgress({ done: 0, total: event.total ?? 0, label: null })
          } else if (event.type === "progress") {
            setProgress({
              done: event.done ?? 0,
              total: event.total ?? 0,
              label: event.label ?? null,
            })
          } else if (event.type === "complete") {
            completed = true
            setProgress((prev) =>
              prev ? { ...prev, done: prev.total, label: null } : prev,
            )
            setResult({
              success: !!event.success,
              partial: !!event.partial,
              message: event.message || "Translation complete.",
            })
            if (event.success) onSuccess?.()
          } else if (event.type === "error") {
            completed = true
            setResult({
              success: false,
              message: errorFromCode(event.status ?? 500, event.code, event.error),
            })
          }
        }
      }

      if (!completed) {
        setResult({
          success: false,
          message: "Translation stream ended unexpectedly. Please try again.",
        })
      }
    } catch (error) {
      console.error("[v0] Translate request failed:", error)
      setResult({
        success: false,
        message:
          "Failed to connect to translation service. Please check your network connection.",
      })
    } finally {
      setIsTranslating(false)
    }
  }

  const handleClose = () => {
    if (isTranslating) return
    setResult(null)
    setProgress(null)
    setTargetLanguages([])
    onOpenChange(false)
  }

  const percent =
    progress && progress.total > 0
      ? Math.min(100, Math.round((progress.done / progress.total) * 100))
      : 0
  const remaining = progress ? Math.max(0, progress.total - progress.done) : 0

  return (
    <Dialog open={open} onOpenChange={(o) => (!o ? handleClose() : onOpenChange(o))}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Languages className="h-5 w-5" />
            Translate {itemType === "trip" ? "Trip" : "Event"}
          </DialogTitle>
          <DialogDescription>
            {`Translate "${itemName}" to other languages`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Source Language */}
          <div>
            <label className="text-sm font-medium text-gray-700">Source Language</label>
            <p className="text-xs text-gray-500 mb-2">Translate from this language</p>
            <div className="flex gap-2">
              {availableSourceLanguages.map((lang) => (
                <button
                  key={lang}
                  onClick={() => {
                    setSourceLanguage(lang)
                    setTargetLanguages((prev) => prev.filter((l) => l !== lang))
                  }}
                  disabled={isTranslating}
                  className={`px-3 py-1.5 text-sm rounded-md border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
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
            <label className="text-sm font-medium text-gray-700">Target Languages</label>
            <p className="text-xs text-gray-500 mb-2">
              Translate into these languages (select one or more)
            </p>
            <div className="flex gap-2">
              {availableTargets.map((lang) => (
                <button
                  key={lang}
                  onClick={() => handleTargetToggle(lang)}
                  disabled={isTranslating}
                  className={`px-3 py-1.5 text-sm rounded-md border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
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

          {/* Progress */}
          {isTranslating && progress && (
            <div className="space-y-2 rounded-md border border-gray-200 bg-gray-50 p-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-gray-700">
                  {progress.total > 0
                    ? `Translating ${progress.done} of ${progress.total} fields`
                    : "Preparing translation..."}
                </span>
                <span className="tabular-nums text-gray-500">
                  {progress.total > 0 ? `${percent}%` : ""}
                </span>
              </div>
              <div
                className="h-2 w-full overflow-hidden rounded-full bg-gray-200"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={progress.total || 100}
                aria-valuenow={progress.done}
                aria-label="Translation progress"
              >
                <div
                  className="h-full rounded-full bg-[#274C77] transition-all duration-200 ease-out"
                  style={{
                    width:
                      progress.total > 0
                        ? `${percent}%`
                        : "0%",
                  }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span className="truncate pr-2">
                  {progress.label
                    ? `Working on: ${progress.label}`
                    : progress.total === 0
                      ? "Counting fields..."
                      : "Starting..."}
                </span>
                {progress.total > 0 && (
                  <span className="tabular-nums whitespace-nowrap">
                    {remaining} left
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Result Message */}
          {result && (
            <div
              className={`p-3 rounded-md text-sm ${
                result.success && !result.partial
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : result.success && result.partial
                    ? "bg-amber-50 text-amber-800 border border-amber-200"
                    : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              {result.message}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isTranslating}>
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
