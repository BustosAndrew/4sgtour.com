"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { GlassCard } from "@/components/ui/glass-card"
import Link from "next/link"
import { useState } from "react"
import { ArrowLeft, CheckCircle2 } from "lucide-react"

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      })
      if (error) throw error
      setIsSuccess(true)
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <div
        className="flex min-h-screen w-full items-center justify-center p-6 pt-24 lg:pt-28"
        style={{
          backgroundImage: "url('/images/contact-bg.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="w-full max-w-md">
          <GlassCard>
            <div className="p-8 text-center">
              <div className="mb-4 flex justify-center">
                <CheckCircle2 className="h-16 w-16 text-white" />
              </div>
              <h1 className="mb-2 text-2xl font-semibold text-white">
                Check Your Email
              </h1>
              <p className="mb-6 text-sm text-white/70">
                We&apos;ve sent you a password reset link. Please check your
                email and follow the instructions to reset your password.
              </p>
              <Button
                asChild
                className="w-full bg-white text-[#274C77] hover:bg-white/90"
              >
                <Link href="/auth/login">Back to Login</Link>
              </Button>
            </div>
          </GlassCard>
        </div>
      </div>
    )
  }

  return (
    <div
      className="flex min-h-screen w-full items-center justify-center p-6 pt-24 lg:pt-28"
      style={{
        backgroundImage: "url('/images/contact-bg.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="w-full max-w-md">
        <GlassCard>
          <div className="p-8">
            <Link
              href="/auth/login"
              className="mb-6 inline-flex items-center text-sm text-white/70 hover:text-white"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Login
            </Link>

            <div className="mb-6">
              <h1 className="text-2xl font-semibold text-white">
                Reset Password
              </h1>
              <p className="mt-2 text-sm text-white/70">
                Enter your email address and we&apos;ll send you a link to reset
                your password.
              </p>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white/20 border-white/30 text-white placeholder:text-white/50"
                />
              </div>

              {error && (
                <div className="bg-destructive/30 p-3 text-sm text-white">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-white text-[#274C77] hover:bg-white/90"
                disabled={isLoading}
              >
                {isLoading ? "Sending..." : "Send Reset Link"}
              </Button>
            </form>
          </div>
        </GlassCard>
      </div>
    </div>
  )
}
