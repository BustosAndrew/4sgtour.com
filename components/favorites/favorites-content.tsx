'use client'

import { useTranslations } from '@/lib/i18n/provider'
import { TripCard } from '@/components/trip-card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import type { Trip } from '@/lib/types/database'

interface FavoritesContentProps {
  trips: Array<Trip & { images?: Array<{ image_url: string }> }>
}

export function FavoritesContent({ trips }: FavoritesContentProps) {
  const t = useTranslations('favoritesPage')

  return (
    <>
      <h1 className="mb-8 text-2xl font-semibold sm:text-3xl">
        {t('title')}
      </h1>

      {trips.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {trips.map((trip) => (
            <TripCard key={trip.id} trip={trip} isFavorite={true} />
          ))}
        </div>
      ) : (
        <div className="border border-border bg-card p-8 text-center sm:p-12">
          <p className="text-muted-foreground">
            {t('empty')}
          </p>
          <Button asChild className="mt-4">
            <Link href="/trips">{t('browseTrips')}</Link>
          </Button>
        </div>
      )}
    </>
  )
}
