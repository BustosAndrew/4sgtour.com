"use client"

import { useEffect } from "react"

export function ErrorHandler() {
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason

      // Check if this is a Supabase auth fetch error
      if (
        error instanceof TypeError &&
        error.message === "Failed to fetch" &&
        event.reason?.stack?.includes("supabase/auth-js")
      ) {
        // Suppress the error - it's a non-critical auth session refresh issue
        event.preventDefault()
        console.warn("[v0] Suppressed non-critical Supabase auth error:", error.message)
        return
      }
    }

    // Add global error handler
    window.addEventListener("unhandledrejection", handleUnhandledRejection)

    return () => {
      window.removeEventListener("unhandledrejection", handleUnhandledRejection)
    }
  }, [])

  return null
}
