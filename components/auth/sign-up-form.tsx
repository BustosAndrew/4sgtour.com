"use client"

import type React from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

export function SignUpForm() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [phone, setPhone] = useState("")
  const [otp, setOtp] = useState("")
  const [step, setStep] = useState<"signup" | "verify">("signup")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const phoneRegex = /^\+[1-9]\d{1,14}$/
    const cleanPhone = phone.replace(/[\s()-]/g, "")

    if (!phoneRegex.test(cleanPhone)) {
      setError("Please enter a valid phone number with country code (e.g., +12345678900)")
      setIsLoading(false)
      return
    }

    try {
      const supabase = createClient()
      const { error: otpError } = await supabase.auth.signInWithOtp({
        phone: cleanPhone,
      })

      if (otpError) throw otpError

      setStep("verify")
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Failed to send verification code")
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const cleanPhone = phone.replace(/[\s()-]/g, "")
      const supabase = createClient()

      const { error: verifyError } = await supabase.auth.verifyOtp({
        phone: cleanPhone,
        token: otp,
        type: "sms",
      })

      if (verifyError) throw verifyError

      await supabase.auth.signOut()

      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: name,
            phone: cleanPhone,
            phone_verified: true,
          },
        },
      })

      if (signUpError) throw signUpError
      if (!signUpData.session) throw new Error("Failed to establish session")

      router.push("/")
      router.refresh()
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Verification failed")
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendOtp = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const cleanPhone = phone.replace(/[\s()-]/g, "")
      const supabase = createClient()

      const { error: otpError } = await supabase.auth.signInWithOtp({
        phone: cleanPhone,
      })

      if (otpError) throw otpError

      setError("Code resent successfully!")
      setTimeout(() => setError(null), 3000)
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Failed to resend OTP")
    } finally {
      setIsLoading(false)
    }
  }

  if (step === "verify") {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] w-full items-center justify-center bg-muted/30 p-6">
        <div className="w-full max-w-md">
          <div className="rounded-lg bg-card p-8 shadow-sm">
            <div className="mb-6 text-center">
              <h1 className="text-2xl font-semibold text-foreground">Verify Phone Number</h1>
              <p className="mt-2 text-sm text-muted-foreground">Enter the 6-digit code sent to {phone}</p>
            </div>

            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp">Verification Code*</Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="000000"
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="bg-muted/50 text-center text-2xl tracking-widest"
                  maxLength={6}
                  autoComplete="one-time-code"
                />
              </div>

              {error && (
                <div
                  className={`rounded-md p-3 text-sm ${
                    error.includes("success") ? "bg-green-500/10 text-green-600" : "bg-destructive/10 text-destructive"
                  }`}
                >
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                disabled={isLoading || otp.length !== 6}
              >
                {isLoading ? "Verifying..." : "Verify & Complete Signup"}
              </Button>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 bg-transparent"
                  onClick={handleResendOtp}
                  disabled={isLoading}
                >
                  Resend Code
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="flex-1"
                  onClick={() => {
                    setStep("signup")
                    setOtp("")
                    setError(null)
                  }}
                  disabled={isLoading}
                >
                  Change Number
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] w-full items-center justify-center bg-muted/30 p-6">
      <div className="w-full max-w-md">
        <div className="rounded-lg bg-card p-8 shadow-sm">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-semibold text-foreground">Sign Up</h1>
            <p className="mt-2 text-sm text-muted-foreground">Create your account with phone verification</p>
          </div>

          <form onSubmit={handleSendOtp} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name*</Label>
              <Input
                id="name"
                type="text"
                placeholder="Enter your name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-muted/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email*</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-muted/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password*</Label>
              <Input
                id="password"
                type="password"
                placeholder="Create a password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-muted/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number*</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+12345678900"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="bg-muted/50"
              />
              <p className="text-xs text-muted-foreground">Must include country code (e.g., +1 for US)</p>
            </div>

            {error && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

            <Button
              type="submit"
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={isLoading}
            >
              {isLoading ? "Sending code..." : "Continue"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/auth/login" className="font-medium text-primary hover:underline">
              Log In
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
