import { createHash, randomBytes } from 'crypto'
import { createClient } from '@supabase/supabase-js'

/**
 * API access keys for third-party partners.
 *
 * Keys are generated in the admin UI, shown once, and stored only as a
 * SHA-256 hash. Verification happens with the service-role client because the
 * caller is a machine with no Supabase session — RLS would otherwise hide
 * every row from it.
 */

export const API_KEY_PREFIX = '4sg_live_'

/** How much of a key is kept in plain text for display in the admin list. */
const DISPLAY_PREFIX_LENGTH = API_KEY_PREFIX.length + 8

/** Skip the `last_used_at` write if it was already touched this recently. */
const LAST_USED_THROTTLE_MS = 60_000

export interface GeneratedApiKey {
  /** The full secret. Returned to the admin once and never stored. */
  key: string
  keyPrefix: string
  keyHash: string
}

export function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex')
}

export function generateApiKey(): GeneratedApiKey {
  const key = `${API_KEY_PREFIX}${randomBytes(32).toString('base64url')}`

  return {
    key,
    keyPrefix: key.slice(0, DISPLAY_PREFIX_LENGTH),
    keyHash: hashApiKey(key),
  }
}

export function extractBearerToken(request: Request): string | null {
  const header = request.headers.get('authorization')
  if (!header) return null

  const match = /^Bearer\s+(.+)$/i.exec(header.trim())
  return match ? match[1].trim() : null
}

export interface AuthenticatedApiKey {
  id: string
  name: string
  /** Whether this key may request custom (private, per-customer) trips. */
  allowCustomTrips: boolean
}

export type ApiKeyAuthResult =
  | { ok: true; apiKey: AuthenticatedApiKey }
  | { ok: false; status: number; code: string; error: string }

/**
 * Verifies the `Authorization: Bearer <key>` header of a public API request.
 *
 * Distinguishes a missing token from an unknown one from a revoked one, so a
 * partner debugging their integration gets an answer instead of a flat 401.
 */
export async function authenticateApiKey(
  request: Request,
): Promise<ApiKeyAuthResult> {
  const token = extractBearerToken(request)

  if (!token) {
    return {
      ok: false,
      status: 401,
      code: 'missing_token',
      error:
        'Missing API key. Send it as an Authorization: Bearer <key> header.',
    }
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('[api-keys] Missing Supabase service-role configuration')
    return {
      ok: false,
      status: 500,
      code: 'server_error',
      error: 'API key verification is unavailable.',
    }
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey)

  const { data: apiKey, error } = await supabase
    .from('api_keys')
    .select('id, name, revoked_at, last_used_at, allow_custom_trips')
    .eq('key_hash', hashApiKey(token))
    .maybeSingle()

  if (error) {
    console.error('[api-keys] Error looking up API key:', error.message)
    return {
      ok: false,
      status: 500,
      code: 'server_error',
      error: 'API key verification is unavailable.',
    }
  }

  if (!apiKey) {
    return {
      ok: false,
      status: 401,
      code: 'invalid_token',
      error: 'Invalid API key.',
    }
  }

  if (apiKey.revoked_at) {
    return {
      ok: false,
      status: 401,
      code: 'revoked_token',
      error: 'This API key has been revoked.',
    }
  }

  const lastUsed = apiKey.last_used_at
    ? new Date(apiKey.last_used_at).getTime()
    : 0

  if (Date.now() - lastUsed > LAST_USED_THROTTLE_MS) {
    const { error: touchError } = await supabase
      .from('api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', apiKey.id)

    // A failed timestamp write must not fail the request it is describing.
    if (touchError) {
      console.error(
        '[api-keys] Error updating last_used_at:',
        touchError.message,
      )
    }
  }

  return {
    ok: true,
    apiKey: {
      id: apiKey.id,
      name: apiKey.name,
      allowCustomTrips: apiKey.allow_custom_trips === true,
    },
  }
}
