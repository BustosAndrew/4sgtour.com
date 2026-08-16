import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserType } from '@/lib/supabase/get-user-type'
import { getSiteUrl } from '@/lib/site-url'
import { ApiAccess } from '@/components/admin/api-access'
import type { ApiKeySummary } from '@/lib/types/database'

export default async function AdminApiAccessPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const userType = await getUserType()

  if (userType !== 'admin') {
    redirect('/')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, email, phone, photo_url')
    .eq('id', user.id)
    .single()

  // `key_hash` is deliberately not selected — it never needs to reach a client.
  const { data: apiKeys } = await supabase
    .from('api_keys')
    .select(
      'id, name, key_prefix, created_by, created_at, last_used_at, revoked_at, allow_custom_trips',
    )
    .order('created_at', { ascending: false })

  return (
    <ApiAccess
      userName={profile?.display_name || profile?.email || 'Admin'}
      userEmail={profile?.email || user.email || ''}
      userPhone={profile?.phone || null}
      userPhotoUrl={profile?.photo_url || null}
      apiKeys={(apiKeys as ApiKeySummary[]) || []}
      siteUrl={getSiteUrl()}
    />
  )
}
