// Trip dates, due dates and charge dates are calendar dates (Postgres DATE,
// "yyyy-MM-dd"), not instants. Converting them through `Date` and
// `toISOString()` shifts them by the viewer's UTC offset — an admin in Korea
// picking 1 December saved 30 November, and `new Date('2026-12-01')` renders
// as 30 November anywhere west of UTC. Use these helpers instead.

const CALENDAR_DATE = /^(\d{4})-(\d{2})-(\d{2})$/

/** A local Date (e.g. from a date picker) → "yyyy-MM-dd" in that same local day. */
export function formatCalendarDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** "yyyy-MM-dd" → a local Date at midnight of that day (for display / pickers). */
export function parseCalendarDate(value: string): Date {
  const match = CALENDAR_DATE.exec(value)
  return match
    ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
    : new Date(value)
}

/**
 * Whatever a client sent → "yyyy-MM-dd", or null. Accepts "yyyy-MM-dd" as is;
 * an ISO timestamp (older admin forms sent `date.toISOString()`) falls back to
 * its UTC day, which is what those forms always produced.
 */
export function toCalendarDate(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return null
  if (CALENDAR_DATE.test(value)) return value
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().split('T')[0]
}
