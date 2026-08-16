import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserType } from '@/lib/supabase/get-user-type'

const SUMMARY_COLUMNS =
  'id, name, key_prefix, created_by, created_at, last_used_at, revoked_at, allow_custom_trips'

/** Both handlers need the same two gates before they touch a row. */
async function requireAdmin() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      supabase,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    }
  }

  const userType = await getUserType()
  if (userType !== 'admin') {
    return {
      supabase,
      response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
    }
  }

  return { supabase, response: null }
}

/**
 * Grants or withdraws this key's permission to read custom trips.
 *
 * Separate from creation so an admin can change their mind about a partner
 * without reissuing the key — withdrawing takes effect on the next request.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { supabase, response } = await requireAdmin()
    if (response) return response

    const { id } = await params
    const body = (await request.json().catch(() => ({}))) as {
      allowCustomTrips?: unknown
    }

    if (typeof body.allowCustomTrips !== 'boolean') {
      return NextResponse.json(
        { error: 'allowCustomTrips must be true or false.' },
        { status: 400 },
      )
    }

    const { data: apiKey, error } = await supabase
      .from('api_keys')
      .update({ allow_custom_trips: body.allowCustomTrips })
      .eq('id', id)
      .is('revoked_at', null)
      .select(SUMMARY_COLUMNS)
      .maybeSingle()

    if (error) throw error

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not found or already revoked.' },
        { status: 404 },
      )
    }

    return NextResponse.json({ apiKey })
  } catch (error) {
    console.error('[api-keys] Error updating API key:', error)
    return NextResponse.json(
      { error: 'Failed to update API key' },
      { status: 500 },
    )
  }
}

/**
 * Revokes an API key.
 *
 * A soft delete: the row stays so `last_used_at` and the audit trail survive,
 * and `authenticateApiKey()` rejects anything with `revoked_at` set. Revoking
 * takes effect on the next request — there is no cache in front of it.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { supabase, response } = await requireAdmin()
    if (response) return response

    const { id } = await params

    const { data: apiKey, error } = await supabase
      .from('api_keys')
      .update({ revoked_at: new Date().toISOString() })
      .eq('id', id)
      .is('revoked_at', null)
      .select(SUMMARY_COLUMNS)
      .maybeSingle()

    if (error) throw error

    // Either the id does not exist or the key was already revoked; both are
    // fine to report as "nothing left to do".
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not found or already revoked.' },
        { status: 404 },
      )
    }

    return NextResponse.json({ apiKey })
  } catch (error) {
    console.error('[api-keys] Error revoking API key:', error)
    return NextResponse.json(
      { error: 'Failed to revoke API key' },
      { status: 500 },
    )
  }
}
