'use client'

import type React from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { useTranslations } from '@/lib/i18n/provider'

export function LoginForm() {
  const t = useTranslations('auth.login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [keepLoggedIn, setKeepLoggedIn] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      router.push(redirect || '/')
      router.refresh()
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      const baseUrl =
        process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ||
        window.location.origin
      const callbackUrl = `${baseUrl}/auth/callback`
      const redirectTo = redirect
        ? `${callbackUrl}?redirect=${encodeURIComponent(redirect)}`
        : callbackUrl

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

  return (
    <div className="flex min-h-screen w-full">
      {/* Left side - Form */}
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
              {t('title')}
            </h1>
            <p className="mt-2 text-base text-[#735c38] font-semibold">
              {t('subtitle')}
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email */}
            <div className="space-y-1.5">
              <Label
                htmlFor="email"
                className="text-sm font-semibold text-[#735c38]"
              >
                {t('email')}
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
                {t('password')}
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
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

            {/* Keep me logged in + Forgot password */}
            <div className="flex items-center justify-between">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={keepLoggedIn}
                  onChange={(e) => setKeepLoggedIn(e.target.checked)}
                  className="h-4 w-4 rounded border-[#d9d9d9] accent-[#495c48]"
                />
                <span className="text-sm text-[#735c38] font-semibold">
                  {t('keepLoggedIn')}
                </span>
              </label>
              <Link
                href="/auth/reset-password"
                className="text-sm font-semibold text-[#735c38] hover:text-[#22333b] hover:underline"
              >
                {t('forgotPassword')}
              </Link>
            </div>

            {error && (
              <div className="rounded-md bg-[#ea4335]/10 p-3 text-sm text-[#ea4335] border border-[#ea4335]/20">
                {error}
              </div>
            )}

            {/* Log In Button */}
            <Button
              type="submit"
              className="h-11 w-full rounded-md bg-[#735c38] text-[#ffffff] font-semibold hover:bg-[#735c38]/90"
              disabled={isLoading}
            >
              {isLoading ? t('loggingIn') : t('logIn')}
            </Button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-4">
            <div className="h-px flex-1 bg-[#d9d9d9]" />
            <span className="text-sm text-[#735c38] font-semibold">{t('or')}</span>
            <div className="h-px flex-1 bg-[#d9d9d9]" />
          </div>

          {/* Google Button */}
          <Button
            type="button"
            variant="outline"
            className="h-11 w-full rounded-md border-[#d9d9d9] bg-[#ffffff] text-[#735c38]! hover:bg-[#eae0d6]/30 font-semibold"
            onClick={handleGoogleLogin}
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
            {t('continueWithGoogle')}
          </Button>

          {/* Create Account */}
          <p className="mt-8 text-center text-sm text-[#735c38] font-semibold">
            {t('noAccount')}{' '}
            <Link
              href="/auth/sign-up"
              className="font-semibold text-blue-600 underline hover:text-blue-800"
            >
              {t('createAccount')}
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
