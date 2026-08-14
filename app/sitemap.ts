import { createClient } from '@/lib/supabase/server'
import { getSiteUrl } from '@/lib/site-url'

export default async function sitemap() {
  // Each site must advertise its own URLs; a fixed domain would tell search
  // engines that the .de/.at content lives on 4sgtour.com.
  const BASE_URL = getSiteUrl()
  const supabase = await createClient()

  // Static pages
  const staticPages = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: `${BASE_URL}/destinations`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/tournaments`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'yearly' as const,
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/terms`,
      lastModified: new Date(),
      changeFrequency: 'yearly' as const,
      priority: 0.3,
    },
  ]

  // Fetch trips
  const { data: trips } = await supabase
    .from('trips')
    .select('slug, updated_at')
    .neq('is_custom', true)

  const tripPages =
    trips?.map((trip) => ({
      url: `${BASE_URL}/trips/${trip.slug}`,
      lastModified: new Date(trip.updated_at || new Date()),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })) || []

  // Fetch destinations
  const { data: destinations } = await supabase
    .from('destinations')
    .select('slug, continent, updated_at')

  const destinationPages =
    destinations?.map((dest) => ({
      url: `${BASE_URL}/destinations/${dest.continent?.toLowerCase() || 'other'}/${dest.slug}`,
      lastModified: new Date(dest.updated_at || new Date()),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })) || []

  // Fetch continent pages
  const continents = [
    ...new Set(destinations?.map((d) => d.continent?.toLowerCase()).filter(Boolean)),
  ]
  const continentPages = continents.map((continent) => ({
    url: `${BASE_URL}/destinations/${continent}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.85,
  }))

  // Fetch tournaments
  const { data: tournaments } = await supabase
    .from('tournaments')
    .select('slug, updated_at')

  const tournamentPages =
    tournaments?.map((tournament) => ({
      url: `${BASE_URL}/tournaments/${tournament.slug}`,
      lastModified: new Date(tournament.updated_at || new Date()),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })) || []

  // Fetch tournament events
  const { data: tournamentEvents } = await supabase
    .from('tournament_events')
    .select('slug, tournament_id, updated_at, tournaments!inner(slug)')

  const eventPages =
    tournamentEvents?.map((event: any) => ({
      url: `${BASE_URL}/tournaments/${event.tournaments.slug}/${event.slug}`,
      lastModified: new Date(event.updated_at || new Date()),
      changeFrequency: 'weekly' as const,
      priority: 0.75,
    })) || []

  return [
    ...staticPages,
    ...tripPages,
    ...continentPages,
    ...destinationPages,
    ...tournamentPages,
    ...eventPages,
  ]
}
