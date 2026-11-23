import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createServiceClient } from '@/lib/supabase/service'
import { expireAbandonedCheckouts } from '@/lib/abandoned-checkouts'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * Daily (vercel.json, 07:00 UTC, 4sgtour.com only): expire checkouts and
 * SMS payment links that were started but not paid within 24 hours, after
 * checking each with Stripe. See lib/abandoned-checkouts.ts.
 */
export async function GET(request: Request) {
  // Fail closed: no CRON_SECRET → nobody may run it.
  const authHeader = request.headers.get('authorization')
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await expireAbandonedCheckouts(createServiceClient(), stripe)
    console.log('[abandoned-checkouts] Done:', JSON.stringify(result))
    return NextResponse.json({ success: true, ...result })
  } catch (error: any) {
    console.error('[abandoned-checkouts] Failed:', error)
    return NextResponse.json({ error: error?.message || 'Failed' }, { status: 500 })
  }
}
