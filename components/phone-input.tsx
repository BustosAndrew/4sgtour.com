'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { CountryCodeSelector } from '@/components/auth/country-code-selector'
import { type Country } from '@/lib/countries'
import { buildE164, defaultPhoneCountry, splitE164 } from '@/lib/phone'
import { useLocale } from '@/lib/i18n/provider'

interface PhoneInputProps {
  id?: string
  /** E.164 ("+821012345678"), a legacy free-text number, or "" */
  value: string
  /**
   * Called on every change with the E.164 number when the input is a valid
   * phone number, otherwise with null. Store the E.164 value; treat null as
   * "not a valid number yet".
   */
  onChange: (e164: string | null) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

/**
 * Country selector + national number, producing E.164 for SMS (Twilio) —
 * so a Korean customer can type "010-1234-5678" and still get the text.
 */
export function PhoneInput({
  id,
  value,
  onChange,
  placeholder,
  className = '',
  disabled,
}: PhoneInputProps) {
  const locale = useLocale()

  const [country, setCountry] = useState<Country>(() => {
    const split = splitE164(value)
    if (split) return split.country
    return defaultPhoneCountry(
      locale,
      typeof window !== 'undefined' ? window.location.hostname : undefined,
    )
  })
  const [national, setNational] = useState(() => {
    const split = splitE164(value)
    // A legacy value without a country code is shown as typed so the
    // customer or admin can see it and fix it.
    return split ? split.national : value || ''
  })

  const emit = (nextCountry: Country, nextNational: string) => {
    onChange(nextNational.trim() ? buildE164(nextCountry, nextNational) : null)
  }

  return (
    <div className={`flex gap-2 ${className}`}>
      <CountryCodeSelector
        value={country}
        onChange={(next) => {
          setCountry(next)
          emit(next, national)
        }}
        className="w-20 shrink-0"
      />
      <div className="relative flex-1">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
          {country.dialCode}
        </span>
        <Input
          id={id}
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          value={national}
          disabled={disabled}
          onChange={(e) => {
            setNational(e.target.value)
            emit(country, e.target.value)
          }}
          placeholder={placeholder}
          className="h-11"
          style={{ paddingLeft: `${country.dialCode.length * 0.55 + 1.1}rem` }}
        />
      </div>
    </div>
  )
}
