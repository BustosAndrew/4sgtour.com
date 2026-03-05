export type ContinentItem = {
  name: string
  displayName?: string
  nameKey: string
  slug: string
  image: string
}

// Source of truth for the continent tiles used in the Destinations UI.
// nameKey maps to destinations.continents.* in the messages files.
export const CONTINENTS: ContinentItem[] = [
  {
    name: 'EUROPE',
    nameKey: 'europe',
    slug: 'europe',
    image: '/images/eu.png',
  },
  {
    name: 'NORTH\nAMERICA',
    displayName: 'NORTH AMERICA',
    nameKey: 'northAmerica',
    slug: 'north-america',
    image: '/images/na.png',
  },
  {
    name: 'LATIN\nAMERICA',
    displayName: 'LATIN AMERICA',
    nameKey: 'latinAmerica',
    slug: 'south-america',
    image: '/images/sa.jpg',
  },
  {
    name: 'ASIA',
    nameKey: 'asia',
    slug: 'asia',
    image: '/images/asia_1.jpg',
  },
  {
    name: 'WORLD',
    nameKey: 'world',
    slug: 'africa',
    image: '/images/world.png',
  },
]
