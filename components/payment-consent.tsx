'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useTranslations } from '@/lib/i18n/provider'

interface PaymentConsentProps {
  businessName?: string
  onSmsConsentChange?: (value: boolean) => void
}

/**
 * Renders the compliance consent block shown above the "Pay" button on the
 * payment-link checkout page. Per the carrier compliance requirements
 * (Twilio campaign vetting), the SMS opt-in language and Terms/Privacy
 * acceptance must be presented to the user, but neither checkbox is
 * required to submit / continue with the payment.
 */
export function PaymentConsent({
  businessName = '4 Seasons Golf Tour',
  onSmsConsentChange,
}: PaymentConsentProps) {
  const t = useTranslations('checkout')
  const tFooter = useTranslations('footer')
  const [smsConsent, setSmsConsent] = useState(false)
  const [termsConsent, setTermsConsent] = useState(false)

  return (
    <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-4">
      {/* SMS opt-in */}
      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          checked={smsConsent}
          onChange={(e) => {
            setSmsConsent(e.target.checked)
            onSmsConsentChange?.(e.target.checked)
          }}
          className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-2 border-[#274C77] text-[#274C77] focus:ring-2 focus:ring-[#274C77] focus:ring-offset-1"
        />
        <span className="text-xs leading-relaxed text-foreground sm:text-sm">
          {t('smsConsentLabel')}
        </span>
      </label>

      {/* Terms of Service & Privacy Policy */}
      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          checked={termsConsent}
          onChange={(e) => setTermsConsent(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-2 border-[#274C77] text-[#274C77] focus:ring-2 focus:ring-[#274C77] focus:ring-offset-1"
        />
        <span className="text-xs leading-relaxed text-foreground sm:text-sm">
          {t('termsConsentLabel')}
          <Link
            href="/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#274C77] underline underline-offset-2 hover:text-[#1a3a5c]"
          >
            {t('termsOfService')}
          </Link>
          {' & '}
          <Link
            href="/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#274C77] underline underline-offset-2 hover:text-[#1a3a5c]"
          >
            {tFooter('privacyPolicy')}
          </Link>
          {'.'}
        </span>
      </label>
    </div>
  )
}
