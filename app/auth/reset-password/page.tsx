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
        className="flex min-h-screen w-full items-center justify-center p-6 pt-28 lg:pt-32"
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
              <h1
                className="mb-2 text-3xl font-bold text-white"
                style={{ textShadow: "0 2px 4px rgba(0,0,0,0.3)" }}
              >
                Check Your Email
              </h1>
              <p
                className="mb-6 text-base text-white font-medium"
                style={{ textShadow: "0 1px 3px rgba(0,0,0,0.2)" }}
              >
                We&apos;ve sent you a password reset link. Please check your
                email and follow the instructions to reset your password.
              </p>
              <Button
                asChild
                className="w-full bg-white text-[#274C77] hover:bg-white/90 text-base font-bold"
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
      className="flex min-h-screen w-full items-center justify-center p-6 pt-28 lg:pt-32"
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
              className="mb-6 inline-flex items-center text-base text-white font-bold hover:text-white/80"
              style={{ textShadow: "0 1px 2px rgba(0,0,0,0.2)" }}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Login
            </Link>

            <div className="mb-6">
              <h1
                className="text-3xl font-bold text-white"
                style={{ textShadow: "0 2px 4px rgba(0,0,0,0.3)" }}
              >
                Reset Password
              </h1>
              <p
                className="mt-2 text-base text-white font-medium"
                style={{ textShadow: "0 1px 3px rgba(0,0,0,0.2)" }}
              >
                Enter your email address and we&apos;ll send you a link to reset
                your password.
              </p>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-white font-bold text-base"
                  style={{ textShadow: "0 1px 2px rgba(0,0,0,0.2)" }}
                >
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white/30 border-white/40 text-white placeholder:text-white/60 text-base! font-bold"
                />
              </div>

              {error && (
                <div
                  className="bg-red-500/40 p-3 text-base text-white font-bold border border-red-300/40"
                  style={{ textShadow: "0 1px 2px rgba(0,0,0,0.2)" }}
                >
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-white text-[#274C77] hover:bg-white/90 text-base font-bold"
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
