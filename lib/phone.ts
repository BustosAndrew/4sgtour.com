import { COUNTRIES, DEFAULT_COUNTRY, type Country } from '@/lib/countries'

// Twilio (SMS payment links, reminders, booking confirmations) and Supabase
// phone OTP both need E.164: "+" then country code then subscriber number,
// digits only, 8–15 digits in total. Everything that collects a phone number
// for SMS goes through these helpers.

const E164 = /^\+[1-9]\d{7,14}$/

// Countries where the leading 0 is part of the number, not a trunk prefix.
const KEEP_LEADING_ZERO = new Set(['39', '378', '379']) // Italy, San Marino, Vatican

/** Country calling code as digits only: "+1-242" → "1242", "+82" → "82". */
export function dialDigits(country: Country): string {
  return country.dialCode.replace(/\D/g, '')
}

export function isE164(value: string | null | undefined): value is string {
  return typeof value === 'string' && E164.test(value)
}

/**
 * A number that already carries its country code ("+82 10-1234-5678",
 * "0082 10 1234 5678") → E.164, or null if it has no country code or is not
 * a plausible length.
 */
export function normalizeE164(raw: string | null | undefined): string | null {
  if (!raw) return null
  const trimmed = raw.trim()
  let digits: string
  if (trimmed.startsWith('+')) digits = trimmed.slice(1).replace(/\D/g, '')
  else if (trimmed.startsWith('00')) digits = trimmed.slice(2).replace(/\D/g, '')
  else return null
  const e164 = `+${digits}`
  return E164.test(e164) ? e164 : null
}

/**
 * Country picked from the selector + the number as the customer typed it →
 * E.164, or null if it can't be a valid number.
 *
 * Drops the national trunk prefix: Korean "010-1234-5678" with +82 becomes
 * +821012345678, not +82010… (which no phone can receive). If the customer
 * typed a full international number anyway, that wins over the selector.
 */
export function buildE164(country: Country, national: string): string | null {
  const typed = national.trim()
  if (typed.startsWith('+') || typed.startsWith('00')) {
    return normalizeE164(typed)
  }
  const cc = dialDigits(country)
  let digits = typed.replace(/\D/g, '')
  if (!KEEP_LEADING_ZERO.has(cc)) digits = digits.replace(/^0+/, '')
  // NANP sub-regions (+1-242 Bahamas, …): accept the number with or without
  // the area code already typed.
  if (cc.length > 1 && cc.startsWith('1') && digits.startsWith(cc.slice(1))) {
    digits = digits.slice(cc.length - 1)
  }
  const e164 = `+${cc}${digits}`
  return E164.test(e164) ? e164 : null
}

/**
 * Split a stored E.164 number back into selector country + national part,
 * for pre-filling a phone input. Picks the longest matching calling code
 * (+1-242 before +1). Returns null for values that are not E.164.
 */
export function splitE164(
  value: string | null | undefined,
): { country: Country; national: string } | null {
  const e164 = normalizeE164(value)
  if (!e164) return null
  const digits = e164.slice(1)
  let best: Country | null = null
  for (const country of COUNTRIES) {
    const cc = dialDigits(country)
    if (digits.startsWith(cc) && (!best || cc.length > dialDigits(best).length)) {
      best = country
    }
  }
  if (!best) return null
  // +1 is shared by the US and Canada; prefer the US unless told otherwise.
  if (dialDigits(best) === '1') best = DEFAULT_COUNTRY
  return { country: best, national: digits.slice(dialDigits(best).length) }
}

/**
 * For background senders (webhook, cron) reading numbers already stored:
 * E.164 when the stored value can be normalized, otherwise the raw value so
 * rows saved before numbers were normalized keep the old behaviour.
 */
export function phoneForSms(raw: string | null | undefined): string | null {
  if (!raw || !raw.trim()) return null
  return normalizeE164(raw) ?? raw.trim()
}

/** Default selector country for a site/locale when nothing is stored. */
export function defaultPhoneCountry(locale?: string, hostname?: string): Country {
  const byCode = (code: string) =>
    COUNTRIES.find((c) => c.code === code) || DEFAULT_COUNTRY
  if (hostname?.endsWith('.at')) return byCode('AT')
  if (hostname?.endsWith('.de')) return byCode('DE')
  if (locale === 'ko') return byCode('KR')
  if (locale === 'de') return byCode('DE')
  return DEFAULT_COUNTRY
}
