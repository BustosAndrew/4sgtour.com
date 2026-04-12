import { SiteHeaderWrapper } from '@/components/site-header-wrapper'
import { SiteFooter } from '@/components/site-footer'
import { TripCard } from '@/components/trip-card'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Trip } from '@/lib/types/database'
import { FavoritesContent } from '@/components/favorites/favorites-content'

export default async function FavoritesPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const { data: favorites } = await supabase
    .from('favorites')
    .select(
      `
      trip_id,
      trips(
        *,
        images:trip_images(image_url)
      )
    `,
    )
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  // Filter out custom trips from favorites
  const filteredFavorites =
    favorites?.filter((f: any) => !f.trips?.is_custom) || []

  const trips =
    (filteredFavorites.map((f: any) => f.trips).filter(Boolean) as Array<
      Trip & { images?: Array<{ image_url: string }> }
    >) || []

  return (
    <div className="">
      <SiteHeaderWrapper />
      <main className="container px-4 pt-28 pb-8 sm:px-6 lg:px-8 lg:pt-32 min-h-screen">
        <FavoritesContent trips={trips} />
      </main>
      <SiteFooter />
    </div>
  )
}
