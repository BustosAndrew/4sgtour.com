"use client"

import type React from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { GlassCard } from "@/components/ui/glass-card"
import { CountryCodeSelector } from "./country-code-selector"
import { DEFAULT_COUNTRY, type Country } from "@/lib/countries"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import type { User } from "@supabase/supabase-js"

interface CompleteProfileFormProps {
  user: User
}

/**
 * Complete Profile Form
 *
 * This form is shown to users who signed up via Google OAuth.
 * It collects and verifies their phone number to complete registration.
 *
 * Flow:
 * 1. User signs in with Google
 * 2. Auth callback detects missing phone verification
 * 3. User is redirected here to add their phone
 * 4. Phone is verified via OTP
 * 5. User profile is updated and they're redirected to home
 */
export function CompleteProfileForm({ user }: CompleteProfileFormProps) {
  const [country, setCountry] = useState<Country>(DEFAULT_COUNTRY)
  const [phone, setPhone] = useState("")
  const [otp, setOtp] = useState("")
  const [step, setStep] = useState<"phone" | "verify">("phone")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    // Construct the full phone number with country code
    const fullPhone = `${country.dialCode}${phone
      .replace(/^\+/, "")
      .replace(/\D/g, "")}`
    const phoneRegex = /^\+[1-9]\d{1,14}$/

    if (!phoneRegex.test(fullPhone)) {
      setError("Please enter a valid phone number")
      setIsLoading(false)
      return
    }

    try {
      const supabase = createClient()
      const { error: otpError } = await supabase.auth.signInWithOtp({
        phone: fullPhone,
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
      const fullPhone = `${country.dialCode}${phone
        .replace(/^\+/, "")
        .replace(/\D/g, "")}`
      const supabase = createClient()

      // Verify the OTP
      const { error: verifyError } = await supabase.auth.verifyOtp({
        phone: fullPhone,
        token: otp,
        type: "sms",
      })

      if (verifyError) throw verifyError

      // Update the current user's metadata with phone verification
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          phone: fullPhone,
          phone_verified: true,
        },
      })

      if (updateError) throw updateError

      // Also update the profile table
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ phone: fullPhone })
        .eq("id", user.id)

      if (profileError) {
        console.error("Failed to update profile phone:", profileError)
      }

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
      const fullPhone = `${country.dialCode}${phone
        .replace(/^\+/, "")
        .replace(/\D/g, "")}`
      const supabase = createClient()

      const { error: otpError } = await supabase.auth.signInWithOtp({
        phone: fullPhone,
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

  const handleSkip = async () => {
    // Sign out and redirect to home if user doesn't want to verify
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  if (step === "verify") {
    return (
      <div
        className="flex min-h-screen w-full items-center justify-center p-6 pt-28 lg:pt-32"
        style={{
          backgroundImage: "url('/images/contact-bg.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="w-full max-w-md">
          <GlassCard>
            <div className="p-8">
              <div className="mb-6 text-center">
                <h1
                  className="text-3xl font-bold text-white"
                  style={{ textShadow: "0 2px 4px rgba(0,0,0,0.3)" }}
                >
                  Verify Phone Number
                </h1>
                <p
                  className="mt-2 text-base text-white font-bold"
                  style={{ textShadow: "0 1px 3px rgba(0,0,0,0.2)" }}
                >
                  Enter the 6-digit code sent to {country.dialCode}
                  {phone}
                </p>
              </div>

              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="otp"
                    className="text-white font-bold text-base"
                    style={{ textShadow: "0 1px 2px rgba(0,0,0,0.2)" }}
                  >
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
                    className="bg-white/30 border-white/40 text-white placeholder:text-white/60 text-center text-2xl tracking-widest font-bold"
                    maxLength={6}
                    autoComplete="one-time-code"
                  />
                </div>

                {error && (
                  <div
                    className={`p-3 text-base font-bold border ${
                      error.includes("success")
                        ? "bg-green-500/40 text-white border-green-300/40"
                        : "bg-red-500/40 text-white border-red-300/40"
                    }`}
                    style={{ textShadow: "0 1px 2px rgba(0,0,0,0.2)" }}
                  >
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full bg-white text-[#274C77] hover:bg-white/90 text-base font-bold"
                  disabled={isLoading || otp.length !== 6}
                >
                  {isLoading ? "Verifying..." : "Verify Phone"}
                </Button>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 bg-white/20 border-white/40 text-white hover:bg-white/30 text-base font-bold"
                    onClick={handleResendOtp}
                    disabled={isLoading}
                  >
                    Resend Code
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="flex-1 text-white hover:bg-white/20 text-base font-bold"
                    onClick={() => {
                      setStep("phone")
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
        backgroundImage: "url('/images/contact-bg.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="w-full max-w-md">
        <GlassCard>
          <div className="p-8">
            <div className="mb-6 text-center">
              <h1
                className="text-3xl font-bold text-white"
                style={{ textShadow: "0 2px 4px rgba(0,0,0,0.3)" }}
              >
                Complete Your Profile
              </h1>
              <p
                className="mt-2 text-base text-white font-medium"
                style={{ textShadow: "0 1px 3px rgba(0,0,0,0.2)" }}
              >
                Welcome, {user.user_metadata?.full_name || user.email}! You
                signed in with Google. Please add your phone number to complete
                setup.
              </p>
            </div>

            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="space-y-2">
                <Label
                  htmlFor="phone"
                  className="text-white font-bold text-base"
                  style={{ textShadow: "0 1px 2px rgba(0,0,0,0.2)" }}
                >
                  Phone Number*
                </Label>
                <div className="flex gap-2">
                  <CountryCodeSelector
                    value={country}
                    onChange={setCountry}
                    className="w-16"
                  />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="1234567890"
                    required
                    value={phone}
                    onChange={(e) =>
                      setPhone(e.target.value.replace(/\D/g, ""))
                    }
                    className="flex-1 bg-white/30 border-white/40 text-white placeholder:text-white/60 text-base! font-bold"
                  />
                </div>
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
                className="w-full bg-white text-[#274C77] hover:bg-white/90"
                disabled={isLoading}
              >
                {isLoading ? "Sending code..." : "Continue"}
              </Button>
            </form>

            <p
              className="mt-6 text-center text-base text-white font-bold"
              style={{ textShadow: "0 1px 2px rgba(0,0,0,0.2)" }}
            >
              Want to use a different account?{" "}
              <Link
                href="/auth/login"
                className="font-bold text-white hover:text-white/90 hover:underline"
                onClick={handleSkip}
              >
                Sign out
              </Link>
            </p>
          </div>
        </GlassCard>
      </div>
    </div>
  )
}
