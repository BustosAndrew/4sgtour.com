'use client'

import type React from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CountryCodeSelector } from './country-code-selector'
import { DEFAULT_COUNTRY, type Country } from '@/lib/countries'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { useTranslations } from 'next-intl'

export function SignUpForm() {
  const tSignup = useTranslations('auth.signup')
  const tVerify = useTranslations('auth.verify')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [country, setCountry] = useState<Country>(DEFAULT_COUNTRY)
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState<'signup' | 'verify'>('signup')
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
        provider: 'google',
        options: {
          redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })
      if (error) throw error
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An error occurred')
      setIsLoading(false)
    }
  }

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    if (password !== confirmPassword) {
      setError(tSignup('passwordsNotMatch'))
      setIsLoading(false)
      return
    }

    const fullPhone = `${country.dialCode}${phone
      .replace(/^\+/, '')
      .replace(/\D/g, '')}`
    const phoneRegex = /^\+[1-9]\d{1,14}$/

    if (!phoneRegex.test(fullPhone)) {
      setError(tSignup('invalidPhone'))
      setIsLoading(false)
      return
    }

    try {
      const supabase = createClient()
      const { error: otpError } = await supabase.auth.signInWithOtp({
        phone: fullPhone,
      })

      if (otpError) throw otpError

      setStep('verify')
    } catch (error: unknown) {
      setError(
        error instanceof Error
          ? error.message
          : 'Failed to send verification code',
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
        .replace(/^\+/, '')
        .replace(/\D/g, '')}`
      const supabase = createClient()

      const { error: verifyError } = await supabase.auth.verifyOtp({
        phone: fullPhone,
        token: otp,
        type: 'sms',
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
              phone: fullPhone,
              phone_verified: true,
            },
          },
        })

      if (signUpError) throw signUpError
      if (!signUpData.session) throw new Error('Failed to establish session')

      router.push('/')
      router.refresh()
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Verification failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendOtp = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const fullPhone = `${country.dialCode}${phone
        .replace(/^\+/, '')
        .replace(/\D/g, '')}`
      const supabase = createClient()

      const { error: otpError } = await supabase.auth.signInWithOtp({
        phone: fullPhone,
      })

      if (otpError) throw otpError

      setError(tVerify('codeResent'))
      setTimeout(() => setError(null), 3000)
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Failed to resend OTP')
    } finally {
      setIsLoading(false)
    }
  }

  if (step === 'verify') {
    return (
      <div className="flex min-h-screen w-full">
        {/* Left side - Verify Form */}
        <div className="flex w-full flex-col px-6 pt-6 pb-12 sm:px-12 lg:w-1/2 lg:px-20 xl:px-28">
          <div className="mb-8 lg:mb-6">
            <Link href="/">
              <Image
                src="/images/cert-logo.png"
                alt="4 Seasons Golf Tour"
                width={56}
                height={56}
                className="object-contain"
              />
            </Link>
          </div>

          <div className="mx-auto w-full max-w-md flex-1 flex flex-col justify-center">
            <div className="mb-8">
              <h1 className="font-serif text-3xl font-bold tracking-tight text-[#735c38] sm:text-4xl">
                {tVerify('title')}
              </h1>
              <p className="mt-2 text-base text-[#735c38]/70">
                {tVerify('subtitle')} {country.dialCode}
                {phone}
              </p>
            </div>

            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div className="space-y-1.5">
                <Label
                  htmlFor="otp"
                  className="text-sm font-medium text-[#735c38]"
                >
                  {tVerify('verificationCode')}
                </Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="000000"
                  required
                  value={otp}
                  onChange={(e) =>
                    setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))
                  }
                  className="h-11 rounded-md border-[#d9d9d9] bg-[#ffffff] text-[#22333b] text-center text-2xl tracking-widest font-semibold focus-visible:ring-[#735c38]"
                  maxLength={6}
                  autoComplete="one-time-code"
                />
              </div>

              {error && (
                <div
                  className={`rounded-md p-3 text-sm border ${
                    error.includes('success')
                      ? 'bg-[#34a853]/10 text-[#34a853] border-[#34a853]/20'
                      : 'bg-[#ea4335]/10 text-[#ea4335] border-[#ea4335]/20'
                  }`}
                >
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="h-11 w-full rounded-md bg-[#735c38] text-[#ffffff] font-semibold hover:bg-[#735c38]/90"
                disabled={isLoading || otp.length !== 6}
              >
                {isLoading ? tVerify('verifying') : tVerify('verify')}
              </Button>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 h-11 rounded-md border-[#d9d9d9] text-[#735c38] hover:bg-[#eae0d6]/30"
                  onClick={handleResendOtp}
                  disabled={isLoading}
                >
                  {tVerify('resendCode')}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 h-11 rounded-md border-[#d9d9d9] text-[#735c38] hover:bg-[#eae0d6]/30"
                  onClick={() => {
                    setStep('signup')
                    setOtp('')
                    setError(null)
                  }}
                  disabled={isLoading}
                >
                  {tVerify('changeNumber')}
                </Button>
              </div>
            </form>
          </div>
        </div>

        {/* Right side - Image */}
        <div className="relative hidden lg:block lg:w-1/2">
          <Image
            src="/images/na.png"
            alt="Aerial view of a beautiful golf course by the ocean"
            fill
            className="object-cover"
            sizes="50vw"
            priority
          />
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen w-full">
      {/* Left side - Sign Up Form */}
      <div className="flex w-full flex-col px-6 pt-6 pb-12 sm:px-12 lg:w-full lg:px-20 xl:px-28">
        <div className="mb-8 lg:mb-6">
          <Link href="/">
            <Image
              src="/images/cert-logo.png"
              alt="4 Seasons Golf Tour"
              width={56}
              height={56}
              className="object-contain"
            />
          </Link>
        </div>

        <div className="mx-auto w-full max-w-md flex-1 flex flex-col justify-center">
          {/* Heading */}
          <div className="mb-8">
            <h1 className="font-serif text-3xl font-bold tracking-tight text-[#735c38] sm:text-4xl">
              {tSignup('title')}
            </h1>
            <p className="mt-2 text-base text-[#735c38] font-semibold">
              {tSignup('subtitle')}
            </p>
          </div>

          <form onSubmit={handleSendOtp} className="space-y-5">
            {/* Name */}
            <div className="space-y-1.5">
              <Label
                htmlFor="name"
                className="text-sm font-semibold text-[#735c38]"
              >
                {tSignup('name')}
              </Label>
              <Input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-11 rounded-md border-[#d9d9d9] bg-[#ffffff] text-[#22333b] focus-visible:ring-[#735c38]"
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label
                htmlFor="email"
                className="text-sm font-semibold text-[#735c38]"
              >
                {tSignup('email')}
              </Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 rounded-md border-[#d9d9d9] bg-[#ffffff] text-[#22333b] focus-visible:ring-[#735c38]"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label
                htmlFor="password"
                className="text-sm font-semibold text-[#735c38]"
              >
                {tSignup('password')}
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 rounded-md border-[#d9d9d9] bg-[#ffffff] pr-10 text-[#22333b] focus-visible:ring-[#735c38]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#735c38] hover:text-[#22333b]"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <Label
                htmlFor="confirmPassword"
                className="text-sm font-semibold text-[#735c38]"
              >
                {tSignup('confirmPassword')}
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-11 rounded-md border-[#d9d9d9] bg-[#ffffff] pr-10 text-[#22333b] focus-visible:ring-[#735c38]"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#735c38] hover:text-[#22333b]"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Phone Number */}
            <div className="space-y-1.5">
              <Label
                htmlFor="phone"
                className="text-sm font-semibold text-[#735c38]"
              >
                {tSignup('phoneNumber')}
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
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  className="flex-1 h-11 rounded-md border-[#d9d9d9] bg-[#ffffff] text-[#22333b] focus-visible:ring-[#735c38]"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-md bg-[#ea4335]/10 p-3 text-sm text-[#ea4335] border border-[#ea4335]/20">
                {error}
              </div>
            )}

            {/* Continue Button */}
            <Button
              type="submit"
              className="h-11 w-full rounded-md bg-[#735c38] text-[#ffffff] font-semibold hover:bg-[#735c38]/90"
              disabled={isLoading}
            >
              {isLoading ? tSignup('sendingCode') : tSignup('continue')}
            </Button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-4">
            <div className="h-px flex-1 bg-[#d9d9d9]" />
            <span className="text-sm text-[#735c38]">{tSignup('or')}</span>
            <div className="h-px flex-1 bg-[#d9d9d9]" />
          </div>

          {/* Google Button */}
          <Button
            type="button"
            variant="outline"
            className="h-11 w-full rounded-md border-[#d9d9d9] bg-[#ffffff] text-[#735c38]! hover:bg-[#eae0d6]/30 font-semibold"
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
            {tSignup('signUpWithGoogle')}
          </Button>

          {/* Sign In Link */}
          <p className="mt-8 text-center text-sm text-[#735c38] font-semibold">
            {tSignup('haveAccount')}{' '}
            <Link
              href="/auth/login"
              className="font-semibold text-blue-600 underline hover:text-blue-800"
            >
              {tSignup('signIn')}
            </Link>
          </p>
        </div>
      </div>

      {/* Right side - Image (hidden on mobile) */}
      <div className="relative hidden lg:block lg:w-[90%]">
        <Image
          src="/images/na.png"
          alt="Aerial view of a beautiful golf course by the ocean"
          fill
          className="object-cover"
          sizes="50vw"
          priority
        />
      </div>
    </div>
  )
}
