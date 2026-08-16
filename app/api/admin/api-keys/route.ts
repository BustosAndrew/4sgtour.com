import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserType } from '@/lib/supabase/get-user-type'
import { generateApiKey } from '@/lib/api-keys'

/** Columns that are safe to return — `key_hash` never leaves the server. */
const SUMMARY_COLUMNS =
  'id, name, key_prefix, created_by, created_at, last_used_at, revoked_at, allow_custom_trips'

export async function GET() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userType = await getUserType()
    if (userType !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data: apiKeys, error } = await supabase
      .from('api_keys')
      .select(SUMMARY_COLUMNS)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ apiKeys: apiKeys || [] })
  } catch (error) {
    console.error('[api-keys] Error listing API keys:', error)
    return NextResponse.json(
      { error: 'Failed to load API keys' },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userType = await getUserType()
    if (userType !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = (await request.json().catch(() => ({}))) as {
      name?: unknown
      allowCustomTrips?: unknown
    }
    const name = typeof body.name === 'string' ? body.name.trim() : ''
    const allowCustomTrips = body.allowCustomTrips === true

    if (!name) {
      return NextResponse.json(
        { error: 'A name is required so the key can be identified later.' },
        { status: 400 },
      )
    }

    if (name.length > 100) {
      return NextResponse.json(
        { error: 'Name must be 100 characters or fewer.' },
        { status: 400 },
      )
    }

    const { key, keyPrefix, keyHash } = generateApiKey()

    const { data: apiKey, error } = await supabase
      .from('api_keys')
      .insert({
        name,
        key_prefix: keyPrefix,
        key_hash: keyHash,
        created_by: user.id,
        allow_custom_trips: allowCustomTrips,
      })
      .select(SUMMARY_COLUMNS)
      .single()

    if (error) throw error

    // The only time the full key is ever returned. It is not recoverable
    // afterwards — the client has to show it to the admin now or never.
    return NextResponse.json({ apiKey, key }, { status: 201 })
  } catch (error) {
    console.error('[api-keys] Error creating API key:', error)
    return NextResponse.json(
      { error: 'Failed to create API key' },
      { status: 500 },
    )
  }
}
