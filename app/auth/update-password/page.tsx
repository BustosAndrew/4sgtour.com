'use client'

import type React from 'react'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { GlassCard } from '@/components/ui/glass-card'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { useTranslations } from '@/lib/i18n/provider'

export default function UpdatePasswordPage() {
  const t = useTranslations('auth.updatePassword')
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [isCheckingSession, setIsCheckingSession] = useState(true)
  const [hasSession, setHasSession] = useState(false)

  // The recovery link lands on /auth/callback first, which exchanges the code
  // for a session and forwards here. Without that session there is nothing to
  // update, which is what an expired or reused link looks like.
  useEffect(() => {
    const checkSession = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setHasSession(!!user)
      setIsCheckingSession(false)
    }
    checkSession()
  }, [])

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError(t('passwordsNotMatch'))
      return
    }

    const supabase = createClient()
    setIsLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      setIsSuccess(true)
      setTimeout(() => router.push('/'), 3000)
    } catch (error: unknown) {
      console.log('[v0] Update password failed:', error)
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const shell = (children: React.ReactNode) => (
    <div
      className="flex min-h-screen w-full items-center justify-center p-6 pt-28 lg:pt-32"
      style={{
        backgroundImage: "url('/images/contact-bg.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="w-full max-w-md">
        <GlassCard>{children}</GlassCard>
      </div>
    </div>
  )

  if (isCheckingSession) {
    return shell(
      <div className="p-8 text-center">
        <p
          className="text-base text-white font-medium"
          style={{ textShadow: '0 1px 3px rgba(0,0,0,0.2)' }}
        >
          {t('verifying')}
        </p>
      </div>,
    )
  }

  if (!hasSession) {
    return shell(
      <div className="p-8 text-center">
        <h1
          className="mb-2 text-3xl font-bold text-white"
          style={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}
        >
          {t('linkExpired')}
        </h1>
        <p
          className="mb-6 text-base text-white font-medium"
          style={{ textShadow: '0 1px 3px rgba(0,0,0,0.2)' }}
        >
          {t('linkExpiredMessage')}
        </p>
        <Button
          asChild
          className="w-full bg-white text-[#274C77] hover:bg-white/90 text-base font-bold"
        >
          <Link href="/auth/reset-password">{t('requestNewLink')}</Link>
        </Button>
      </div>,
    )
  }

  if (isSuccess) {
    return shell(
      <div className="p-8 text-center">
        <div className="mb-4 flex justify-center">
          <CheckCircle2 className="h-16 w-16 text-white" />
        </div>
        <h1
          className="mb-2 text-3xl font-bold text-white"
          style={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}
        >
          {t('successTitle')}
        </h1>
        <p
          className="mb-6 text-base text-white font-medium"
          style={{ textShadow: '0 1px 3px rgba(0,0,0,0.2)' }}
        >
          {t('successMessage')}
        </p>
        <Button
          asChild
          className="w-full bg-white text-[#274C77] hover:bg-white/90 text-base font-bold"
        >
          <Link href="/">{t('continue')}</Link>
        </Button>
      </div>,
    )
  }

  return shell(
    <div className="p-8">
      <div className="mb-6">
        <h1
          className="text-3xl font-bold text-white"
          style={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}
        >
          {t('title')}
        </h1>
        <p
          className="mt-2 text-base text-white font-medium"
          style={{ textShadow: '0 1px 3px rgba(0,0,0,0.2)' }}
        >
          {t('subtitle')}
        </p>
      </div>

      <form onSubmit={handleUpdatePassword} className="space-y-4">
        <div className="space-y-2">
          <Label
            htmlFor="password"
            className="text-white font-bold text-base"
            style={{ textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}
          >
            {t('newPassword')}
          </Label>
          <Input
            id="password"
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-white/30 border-white/40 text-white placeholder:text-white/60 text-base! font-bold"
          />
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="confirmPassword"
            className="text-white font-bold text-base"
            style={{ textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}
          >
            {t('confirmPassword')}
          </Label>
          <Input
            id="confirmPassword"
            type="password"
            required
            minLength={6}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="bg-white/30 border-white/40 text-white placeholder:text-white/60 text-base! font-bold"
          />
        </div>

        {error && (
          <div
            className="bg-red-500/40 p-3 text-base text-white font-bold border border-red-300/40"
            style={{ textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}
          >
            {error}
          </div>
        )}

        <Button
          type="submit"
          className="w-full bg-white text-[#274C77] hover:bg-white/90 text-base font-bold"
          disabled={isLoading}
        >
          {isLoading ? t('updating') : t('updatePassword')}
        </Button>
      </form>
    </div>,
  )
}
