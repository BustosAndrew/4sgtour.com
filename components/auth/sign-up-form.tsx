"use client"

import type React from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { GlassCard } from "@/components/ui/glass-card"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Eye, EyeOff } from "lucide-react"

export function SignUpForm() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [phone, setPhone] = useState("")
  const [otp, setOtp] = useState("")
  const [step, setStep] = useState<"signup" | "verify">("signup")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleGoogleSignUp = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      const baseUrl =
        process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ||
        window.location.origin
      const redirectTo = `${baseUrl}/auth/callback`

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      })
      if (error) throw error
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
      setIsLoading(false)
    }
  }

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    const phoneRegex = /^\+[1-9]\d{1,14}$/
    const cleanPhone = phone.replace(/[\s()-]/g, "")

    if (!phoneRegex.test(cleanPhone)) {
      setError(
        "Please enter a valid phone number with country code (e.g., +12345678900)",
      )
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
      setError(
        error instanceof Error
          ? error.message
          : "Failed to send verification code",
      )
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

      const { data: signUpData, error: signUpError } =
        await supabase.auth.signUp({
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
              <div className="mb-6 text-center">
                <h1 className="text-2xl font-semibold text-white">
                  Verify Phone Number
                </h1>
                <p className="mt-2 text-sm text-white/70">
                  Enter the 6-digit code sent to {phone}
                </p>
              </div>

              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="otp" className="text-white">
                    Verification Code*
                  </Label>
                  <Input
                    id="otp"
                    type="text"
                    placeholder="000000"
                    required
                    value={otp}
                    onChange={(e) =>
                      setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    className="bg-white/20 border-white/30 text-white placeholder:text-white/50 text-center text-2xl tracking-widest"
                    maxLength={6}
                    autoComplete="one-time-code"
                  />
                </div>

                {error && (
                  <div
                    className={`p-3 text-sm ${
                      error.includes("success")
                        ? "bg-green-500/30 text-white"
                        : "bg-destructive/30 text-white"
                    }`}
                  >
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full bg-white text-[#274C77] hover:bg-white/90"
                  disabled={isLoading || otp.length !== 6}
                >
                  {isLoading ? "Verifying..." : "Verify & Complete Signup"}
                </Button>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 bg-white/10 border-white/30 text-white hover:bg-white/20"
                    onClick={handleResendOtp}
                    disabled={isLoading}
                  >
                    Resend Code
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="flex-1 text-white hover:bg-white/10"
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
            <div className="mb-6 text-center">
              <h1 className="text-2xl font-semibold text-white">Sign Up</h1>
              <p className="mt-2 text-sm text-white/70">
                Create your account with phone verification
              </p>
            </div>

            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-white">
                  Name*
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-white/20 border-white/30 text-white placeholder:text-white/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-white">
                  Email*
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white/20 border-white/30 text-white placeholder:text-white/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-white">
                  Password*
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-white/20 border-white/30 text-white placeholder:text-white/50 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-white">
                  Confirm Password*
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="bg-white/20 border-white/30 text-white placeholder:text-white/50 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-white">
                  Phone Number*
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+12345678900"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="bg-white/20 border-white/30 text-white placeholder:text-white/50"
                />
                <p className="text-xs text-white/50">
                  Must include country code (e.g., +1 for US)
                </p>
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
                {isLoading ? "Sending code..." : "Continue"}
              </Button>
            </form>

            <div className="my-6 flex items-center gap-4">
              <div className="h-px flex-1 bg-white/30" />
              <span className="text-sm text-white/70">or</span>
              <div className="h-px flex-1 bg-white/30" />
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full bg-white/10 border-white/30 text-white hover:bg-white/20"
              onClick={handleGoogleSignUp}
              disabled={isLoading}
            >
              <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </Button>

            <p className="mt-6 text-center text-sm text-white/70">
              Already have an account?{" "}
              <Link
                href="/auth/login"
                className="font-medium text-white hover:underline"
              >
                Log In
              </Link>
            </p>
          </div>
        </GlassCard>
      </div>
    </div>
  )
}
