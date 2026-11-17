import 'server-only'

import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * Service-role client: bypasses RLS. Server-only, and only where the caller
 * has no Supabase session but must read specific rows — the Stripe webhook,
 * the cron jobs, and the custom-package page and its checkout route (a
 * customer opens their package from an SMS link while signed out; the
 * unguessable inquiry id in the URL is the credential, as with a Stripe link).
 *
 * Always filter to the exact rows needed and select only the columns the
 * page shows. Never pass this client, or rows read with it, to the browser
 * beyond those columns.
 */
export function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  )
}
