export type ContinentItem = {
  name: string
  displayName?: string
  slug: string
  image: string
}

// Source of truth for the continent tiles used in the Destinations UI.
export const CONTINENTS: ContinentItem[] = [
  {
    name: 'EUROPE',
    slug: 'europe',
    image: '/images/eu.png',
  },
  {
    name: 'NORTH\nAMERICA',
    displayName: 'NORTH AMERICA',
    slug: 'north-america',
    image: '/images/na.png',
  },
  {
    name: 'LATIN\nAMERICA',
    displayName: 'LATIN AMERICA',
    slug: 'south-america',
    image: '/images/sa.jpg',
  },
  {
    name: 'ASIA',
    slug: 'asia',
    image: '/images/asia.jpg',
  },
  {
    name: 'WORLD',
    slug: 'africa',
    image: '/images/world.jpg',
  },
]
