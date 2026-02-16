export interface TournamentEvent {
  id: string
  slug: string
  title: string
  location: string
  date: string
  duration: string
  price: string
  image: string
  heroImage: string
  description: string[]
  tripHighlights: string[]
  travelItinerary: string[]
  itineraryDays: {
    title: string
    content: string
  }[]
  galleryImages: string[]
  galleryImages2: string[]
  includes: string[]
  excludes: string[]
  pricingTiers: {
    name: string
    price: string
    bookingUrl: string
  }[]
}

export interface Tournament {
  name: string
  displayName: string
  heroImage: string
  logo: string
  objectPosition: string
  events: TournamentEvent[]
}

export const TOURNAMENTS: Record<string, Tournament> = {
  'the-open': {
    name: 'THE OPEN',
    displayName: 'The Open',
    heroImage: '/images/1.png',
    logo: '/images/open.png',
    objectPosition: '50% 35%',
    events: [
      {
        id: '1',
        slug: 'the-154th-open-at-royal-birkdale',
        title: 'THE 154TH OPEN AT ROYAL BIRKDALE',
        location: 'Southport, England',
        date: 'July 17-20, 2025',
        duration: '3 Nights & 3 Rounds',
        price: '$615',
        image: '/images/1.png',
        heroImage: '/images/open.png',
        description: [
          'The Open Championship is golf\'s oldest major, first played in 1860 and governed by The R&A. Contested exclusively on traditional links courses, The Open presents a unique challenge defined by coastal winds, firm fairways, and storied history.',
          'The 154th Open returns to Royal Birkdale, a classic links venue that has crowned legends of the game and is renowned for its demanding yet fair championship test.',
        ],
        tripHighlights: [
          'Championship access to The 154th Open at Royal Birkdale',
          'Prime viewing locations to experience Open drama firsthand',
          'Hosted group experience with on-site support throughout the trip',
          'Luxury accommodations near the championship venue',
          'Optional golf rounds at iconic English links courses',
          'Seamless transfers, event coordination, and local expertise',
        ],
        travelItinerary: [
          '4 Nights of Premium Accommodations',
          'Official Open Championship Access',
          'Curated Golf Experiences',
          'Daily Breakfast & Select Hosted Dining',
          'Luxury Ground Transportation',
          'Leisure Time & Cultural Exploration',
          'Dedicated Golf Concierge Service',
        ],
        itineraryDays: [
          {
            title: 'Day 1: Arrival',
            content: 'Arrive in England and check into your hotel. Enjoy a welcome briefing and evening at leisure to explore the local area.',
          },
          {
            title: 'Day 2: The Open Championship',
            content: 'Full day at Royal Birkdale for The Open Championship. Experience the electric atmosphere, explore the championship village, and watch the world\'s best golfers compete on this legendary links course.',
          },
          {
            title: 'Day 3: Golf & Exploration',
            content: 'Morning round at a premier regional links course followed by an afternoon at leisure. Optional return to The Open for continued championship viewing.',
          },
          {
            title: 'Day 4: Departure',
            content: 'Enjoy a farewell breakfast before transfer to the airport for your departure. Optional late checkout available.',
          },
        ],
        galleryImages: [
          '/placeholder.svg?height=600&width=1000',
          '/placeholder.svg?height=600&width=1000',
          '/placeholder.svg?height=600&width=1000',
        ],
        galleryImages2: [
          '/placeholder.svg?height=600&width=1000',
          '/placeholder.svg?height=600&width=1000',
          '/placeholder.svg?height=600&width=1000',
        ],
        includes: [
          'Daily Breakfast',
          'Official Open Championship Tickets',
          'Choice Of Practice Or Championship Round Attendance',
          'Official Open Championship Tickets',
          'Transportation For All Scheduled Events',
        ],
        excludes: [
          'Personal Items',
          'Meal Is Unspecified',
          'Travel Insurance',
        ],
        pricingTiers: [
          {
            name: 'ORIGINAL',
            price: '$615',
            bookingUrl: '/contact',
          },
          {
            name: 'PREMIUM',
            price: '$615',
            bookingUrl: '/contact',
          },
        ],
      },
      {
        id: '2',
        slug: 'the-155th-open-at-royal-portrush',
        title: 'THE 155TH OPEN AT ROYAL PORTRUSH',
        location: 'County Antrim, Northern Ireland',
        date: 'July 16-19, 2026',
        duration: '3 Nights & 3 Rounds',
        price: '$615',
        image: '/images/1.png',
        heroImage: '/images/open.png',
        description: [
          'The Open Championship is golf\'s oldest major, first played in 1860 and governed by The R&A. Contested exclusively on traditional links courses, The Open presents a unique challenge defined by coastal winds, firm fairways, and storied history.',
          'The 155th Open heads to Royal Portrush, a spectacular links venue on the dramatic Antrim coastline of Northern Ireland, offering breathtaking scenery and a world-class championship test.',
        ],
        tripHighlights: [
          'Championship access to The 155th Open at Royal Portrush',
          'Prime viewing locations to experience Open drama firsthand',
          'Hosted group experience with on-site support throughout the trip',
          'Luxury accommodations near the championship venue',
          'Optional golf rounds at iconic Northern Irish links courses',
          'Seamless transfers, event coordination, and local expertise',
        ],
        travelItinerary: [
          '4 Nights of Premium Accommodations',
          'Official Open Championship Access',
          'Curated Golf Experiences',
          'Daily Breakfast & Select Hosted Dining',
          'Luxury Ground Transportation',
          'Leisure Time & Cultural Exploration',
          'Dedicated Golf Concierge Service',
        ],
        itineraryDays: [
          {
            title: 'Day 1: Arrival',
            content: 'Arrive in Northern Ireland and check into your hotel. Enjoy a welcome briefing and evening at leisure to explore the stunning Antrim coast.',
          },
          {
            title: 'Day 2: The Open Championship',
            content: 'Full day at Royal Portrush for The Open Championship. Experience the electric atmosphere along the dramatic coastline as the world\'s best golfers compete.',
          },
          {
            title: 'Day 3: Golf & Exploration',
            content: 'Morning round at a premier regional links course followed by an afternoon at leisure. Optional return to The Open for continued championship viewing.',
          },
          {
            title: 'Day 4: Departure',
            content: 'Enjoy a farewell breakfast before transfer to the airport for your departure. Optional late checkout available.',
          },
        ],
        galleryImages: [
          '/placeholder.svg?height=600&width=1000',
          '/placeholder.svg?height=600&width=1000',
          '/placeholder.svg?height=600&width=1000',
        ],
        galleryImages2: [
          '/placeholder.svg?height=600&width=1000',
          '/placeholder.svg?height=600&width=1000',
          '/placeholder.svg?height=600&width=1000',
        ],
        includes: [
          'Daily Breakfast',
          'Official Open Championship Tickets',
          'Choice Of Practice Or Championship Round Attendance',
          'Transportation For All Scheduled Events',
        ],
        excludes: [
          'Personal Items',
          'Meal Is Unspecified',
          'Travel Insurance',
        ],
        pricingTiers: [
          {
            name: 'ORIGINAL',
            price: '$615',
            bookingUrl: '/contact',
          },
          {
            name: 'PREMIUM',
            price: '$615',
            bookingUrl: '/contact',
          },
        ],
      },
      {
        id: '3',
        slug: 'the-156th-open-at-st-andrews',
        title: 'THE 156TH OPEN AT ST ANDREWS',
        location: 'St Andrews, Scotland',
        date: 'July 15-18, 2027',
        duration: '3 Nights & 3 Rounds',
        price: '$615',
        image: '/images/1.png',
        heroImage: '/images/open.png',
        description: [
          'The Open Championship is golf\'s oldest major, first played in 1860 and governed by The R&A. Contested exclusively on traditional links courses, The Open presents a unique challenge defined by coastal winds, firm fairways, and storied history.',
          'The 156th Open returns to the Home of Golf at St Andrews, the most iconic venue in all of golf. The Old Course provides a timeless championship experience steeped in centuries of tradition.',
        ],
        tripHighlights: [
          'Championship access to The 156th Open at St Andrews',
          'Prime viewing locations at the Home of Golf',
          'Hosted group experience with on-site support throughout the trip',
          'Luxury accommodations in the heart of St Andrews',
          'Optional golf rounds at iconic Scottish links courses',
          'Seamless transfers, event coordination, and local expertise',
        ],
        travelItinerary: [
          '4 Nights of Premium Accommodations',
          'Official Open Championship Access',
          'Curated Golf Experiences',
          'Daily Breakfast & Select Hosted Dining',
          'Luxury Ground Transportation',
          'Leisure Time & Cultural Exploration',
          'Dedicated Golf Concierge Service',
        ],
        itineraryDays: [
          {
            title: 'Day 1: Arrival',
            content: 'Arrive in Scotland and check into your hotel in St Andrews. Enjoy a welcome briefing and evening strolling the historic streets of the Home of Golf.',
          },
          {
            title: 'Day 2: The Open Championship',
            content: 'Full day at the Old Course for The Open Championship. Witness golfing history unfold on the most famous course in the world.',
          },
          {
            title: 'Day 3: Golf & Exploration',
            content: 'Morning round at a premier Scottish links course followed by an afternoon at leisure. Optional return to The Open for continued championship viewing.',
          },
          {
            title: 'Day 4: Departure',
            content: 'Enjoy a farewell breakfast before transfer to the airport for your departure. Optional late checkout available.',
          },
        ],
        galleryImages: [
          '/placeholder.svg?height=600&width=1000',
          '/placeholder.svg?height=600&width=1000',
          '/placeholder.svg?height=600&width=1000',
        ],
        galleryImages2: [
          '/placeholder.svg?height=600&width=1000',
          '/placeholder.svg?height=600&width=1000',
          '/placeholder.svg?height=600&width=1000',
        ],
        includes: [
          'Daily Breakfast',
          'Official Open Championship Tickets',
          'Choice Of Practice Or Championship Round Attendance',
          'Transportation For All Scheduled Events',
        ],
        excludes: [
          'Personal Items',
          'Meal Is Unspecified',
          'Travel Insurance',
        ],
        pricingTiers: [
          {
            name: 'ORIGINAL',
            price: '$615',
            bookingUrl: '/contact',
          },
          {
            name: 'PREMIUM',
            price: '$615',
            bookingUrl: '/contact',
          },
        ],
      },
    ],
  },
  'ryder-cup': {
    name: 'RYDER CUP',
    displayName: 'Ryder Cup',
    heroImage: '/images/2.png',
    logo: '/images/ryder.png',
    objectPosition: '50% 35%',
    events: [
      {
        id: '1',
        slug: 'the-2027-ryder-cup',
        title: 'THE 2027 RYDER CUP',
        location: 'Limerick, Ireland',
        date: 'September, 2027',
        duration: '3 Nights & 3 Rounds',
        price: '$615',
        image: '/images/2.png',
        heroImage: '/images/ryder.png',
        description: [
          'The Ryder Cup is one of sport\'s greatest spectacles, pitting the best golfers from Europe against the United States in a biennial team competition that ignites passions on both sides of the Atlantic.',
          'The 2027 Ryder Cup heads to Adare Manor in Limerick, Ireland, one of the most prestigious golf resorts in the world, promising an unforgettable atmosphere of competition and camaraderie.',
        ],
        tripHighlights: [
          'Championship access to The 2027 Ryder Cup at Adare Manor',
          'Prime viewing locations for all matches',
          'Hosted group experience with on-site support throughout the trip',
          'Luxury accommodations in the Limerick area',
          'Optional golf rounds at iconic Irish courses',
          'Seamless transfers, event coordination, and local expertise',
        ],
        travelItinerary: [
          '4 Nights of Premium Accommodations',
          'Official Ryder Cup Access',
          'Curated Golf Experiences',
          'Daily Breakfast & Select Hosted Dining',
          'Luxury Ground Transportation',
          'Leisure Time & Cultural Exploration',
          'Dedicated Golf Concierge Service',
        ],
        itineraryDays: [
          {
            title: 'Day 1: Arrival',
            content: 'Arrive in Ireland and check into your hotel. Enjoy a welcome briefing and evening at leisure to explore the charming city of Limerick.',
          },
          {
            title: 'Day 2: Ryder Cup Day 1',
            content: 'Full day at Adare Manor for the opening day of the Ryder Cup. Experience the incredible team atmosphere as foursomes and fourball matches get underway.',
          },
          {
            title: 'Day 3: Golf & Ryder Cup',
            content: 'Morning round at a premier Irish course followed by afternoon Ryder Cup singles action at Adare Manor.',
          },
          {
            title: 'Day 4: Departure',
            content: 'Enjoy a farewell breakfast before transfer to the airport for your departure.',
          },
        ],
        galleryImages: [
          '/placeholder.svg?height=600&width=1000',
          '/placeholder.svg?height=600&width=1000',
          '/placeholder.svg?height=600&width=1000',
        ],
        galleryImages2: [
          '/placeholder.svg?height=600&width=1000',
          '/placeholder.svg?height=600&width=1000',
          '/placeholder.svg?height=600&width=1000',
        ],
        includes: [
          'Daily Breakfast',
          'Official Ryder Cup Tickets',
          'Choice Of Practice Or Competition Day Attendance',
          'Transportation For All Scheduled Events',
        ],
        excludes: [
          'Personal Items',
          'Meal Is Unspecified',
          'Travel Insurance',
        ],
        pricingTiers: [
          {
            name: 'ORIGINAL',
            price: '$615',
            bookingUrl: '/contact',
          },
          {
            name: 'PREMIUM',
            price: '$615',
            bookingUrl: '/contact',
          },
        ],
      },
      {
        id: '2',
        slug: 'the-2029-ryder-cup',
        title: 'THE 2029 RYDER CUP',
        location: 'Bethpage, New York',
        date: 'September, 2029',
        duration: '3 Nights & 3 Rounds',
        price: '$615',
        image: '/images/2.png',
        heroImage: '/images/ryder.png',
        description: [
          'The Ryder Cup is one of sport\'s greatest spectacles, pitting the best golfers from Europe against the United States in a biennial team competition that ignites passions on both sides of the Atlantic.',
          'The 2029 Ryder Cup takes place at Bethpage Black in New York, one of America\'s most iconic and challenging public golf courses, promising a thrilling atmosphere.',
        ],
        tripHighlights: [
          'Championship access to The 2029 Ryder Cup at Bethpage Black',
          'Prime viewing locations for all matches',
          'Hosted group experience with on-site support throughout the trip',
          'Luxury accommodations in the New York area',
          'Optional golf rounds at iconic regional courses',
          'Seamless transfers, event coordination, and local expertise',
        ],
        travelItinerary: [
          '4 Nights of Premium Accommodations',
          'Official Ryder Cup Access',
          'Curated Golf Experiences',
          'Daily Breakfast & Select Hosted Dining',
          'Luxury Ground Transportation',
          'Leisure Time & Cultural Exploration',
          'Dedicated Golf Concierge Service',
        ],
        itineraryDays: [
          {
            title: 'Day 1: Arrival',
            content: 'Arrive in New York and check into your hotel. Enjoy a welcome briefing and evening at leisure.',
          },
          {
            title: 'Day 2: Ryder Cup Day 1',
            content: 'Full day at Bethpage Black for the opening day of the Ryder Cup. Experience the incredible American sports atmosphere.',
          },
          {
            title: 'Day 3: Golf & Ryder Cup',
            content: 'Morning round at a premier regional course followed by afternoon Ryder Cup singles action at Bethpage Black.',
          },
          {
            title: 'Day 4: Departure',
            content: 'Enjoy a farewell breakfast before transfer to the airport for your departure.',
          },
        ],
        galleryImages: [
          '/placeholder.svg?height=600&width=1000',
          '/placeholder.svg?height=600&width=1000',
          '/placeholder.svg?height=600&width=1000',
        ],
        galleryImages2: [
          '/placeholder.svg?height=600&width=1000',
          '/placeholder.svg?height=600&width=1000',
          '/placeholder.svg?height=600&width=1000',
        ],
        includes: [
          'Daily Breakfast',
          'Official Ryder Cup Tickets',
          'Choice Of Practice Or Competition Day Attendance',
          'Transportation For All Scheduled Events',
        ],
        excludes: [
          'Personal Items',
          'Meal Is Unspecified',
          'Travel Insurance',
        ],
        pricingTiers: [
          {
            name: 'ORIGINAL',
            price: '$615',
            bookingUrl: '/contact',
          },
          {
            name: 'PREMIUM',
            price: '$615',
            bookingUrl: '/contact',
          },
        ],
      },
    ],
  },
  masters: {
    name: 'MASTERS',
    displayName: 'Masters',
    heroImage: '/images/3.png',
    logo: '/images/masters.png',
    objectPosition: '50% 35%',
    events: [
      {
        id: '1',
        slug: 'the-masters-2026',
        title: 'THE MASTERS 2026',
        location: 'Augusta, Georgia',
        date: 'April 9-13, 2026',
        duration: '4 Nights & 3 Rounds',
        price: '$1,250',
        image: '/images/3.png',
        heroImage: '/images/masters.png',
        description: [
          'The Masters Tournament is golf\'s most prestigious invitation-only event, held annually at Augusta National Golf Club. Known for its iconic green jacket, azalea-lined fairways, and Amen Corner, The Masters represents the pinnacle of golf tradition.',
          'The Masters 2026 invites you to witness greatness at Augusta National, where the world\'s finest golfers compete on one of the most beautiful and challenging courses in existence.',
        ],
        tripHighlights: [
          'Championship access to The Masters 2026 at Augusta National',
          'Prime viewing locations at iconic holes including Amen Corner',
          'Hosted group experience with on-site support throughout the trip',
          'Luxury accommodations in the Augusta area',
          'Optional golf rounds at premier regional courses',
          'Seamless transfers, event coordination, and local expertise',
        ],
        travelItinerary: [
          '4 Nights of Premium Accommodations',
          'Official Masters Tournament Access',
          'Curated Golf Experiences',
          'Daily Breakfast & Select Hosted Dining',
          'Luxury Ground Transportation',
          'Leisure Time & Cultural Exploration',
          'Dedicated Golf Concierge Service',
        ],
        itineraryDays: [
          {
            title: 'Day 1: Arrival',
            content: 'Arrive in Augusta and check into your hotel. Enjoy a welcome briefing and evening at leisure.',
          },
          {
            title: 'Day 2: Practice Round',
            content: 'Attend the practice round at Augusta National. Explore the grounds, visit the merchandise shop, and soak in the legendary atmosphere.',
          },
          {
            title: 'Day 3: Tournament Day',
            content: 'Full day at Augusta National for tournament play. Experience the drama of competitive golf at the highest level.',
          },
          {
            title: 'Day 4: Golf & Exploration',
            content: 'Morning round at a premier regional course. Afternoon at leisure or optional return to Augusta National.',
          },
          {
            title: 'Day 5: Departure',
            content: 'Enjoy a farewell breakfast before transfer to the airport for your departure.',
          },
        ],
        galleryImages: [
          '/placeholder.svg?height=600&width=1000',
          '/placeholder.svg?height=600&width=1000',
          '/placeholder.svg?height=600&width=1000',
        ],
        galleryImages2: [
          '/placeholder.svg?height=600&width=1000',
          '/placeholder.svg?height=600&width=1000',
          '/placeholder.svg?height=600&width=1000',
        ],
        includes: [
          'Daily Breakfast',
          'Official Masters Tournament Badges',
          'Choice Of Practice Or Tournament Round Attendance',
          'Transportation For All Scheduled Events',
        ],
        excludes: [
          'Personal Items',
          'Meal Is Unspecified',
          'Travel Insurance',
        ],
        pricingTiers: [
          {
            name: 'ORIGINAL',
            price: '$1,250',
            bookingUrl: '/contact',
          },
          {
            name: 'PREMIUM',
            price: '$1,250',
            bookingUrl: '/contact',
          },
        ],
      },
      {
        id: '2',
        slug: 'the-masters-2027',
        title: 'THE MASTERS 2027',
        location: 'Augusta, Georgia',
        date: 'April 8-11, 2027',
        duration: '4 Nights & 3 Rounds',
        price: '$1,250',
        image: '/images/3.png',
        heroImage: '/images/masters.png',
        description: [
          'The Masters Tournament is golf\'s most prestigious invitation-only event, held annually at Augusta National Golf Club. Known for its iconic green jacket, azalea-lined fairways, and Amen Corner, The Masters represents the pinnacle of golf tradition.',
          'The Masters 2027 offers another opportunity to witness greatness at Augusta National, one of the most beautiful and challenging courses in existence.',
        ],
        tripHighlights: [
          'Championship access to The Masters 2027 at Augusta National',
          'Prime viewing locations at iconic holes including Amen Corner',
          'Hosted group experience with on-site support throughout the trip',
          'Luxury accommodations in the Augusta area',
          'Optional golf rounds at premier regional courses',
          'Seamless transfers, event coordination, and local expertise',
        ],
        travelItinerary: [
          '4 Nights of Premium Accommodations',
          'Official Masters Tournament Access',
          'Curated Golf Experiences',
          'Daily Breakfast & Select Hosted Dining',
          'Luxury Ground Transportation',
          'Leisure Time & Cultural Exploration',
          'Dedicated Golf Concierge Service',
        ],
        itineraryDays: [
          {
            title: 'Day 1: Arrival',
            content: 'Arrive in Augusta and check into your hotel. Enjoy a welcome briefing and evening at leisure.',
          },
          {
            title: 'Day 2: Practice Round',
            content: 'Attend the practice round at Augusta National. Explore the grounds and soak in the legendary atmosphere.',
          },
          {
            title: 'Day 3: Tournament Day',
            content: 'Full day at Augusta National for tournament play.',
          },
          {
            title: 'Day 4: Golf & Exploration',
            content: 'Morning round at a premier regional course. Afternoon at leisure or optional return to Augusta National.',
          },
          {
            title: 'Day 5: Departure',
            content: 'Enjoy a farewell breakfast before transfer to the airport for your departure.',
          },
        ],
        galleryImages: [
          '/placeholder.svg?height=600&width=1000',
          '/placeholder.svg?height=600&width=1000',
          '/placeholder.svg?height=600&width=1000',
        ],
        galleryImages2: [
          '/placeholder.svg?height=600&width=1000',
          '/placeholder.svg?height=600&width=1000',
          '/placeholder.svg?height=600&width=1000',
        ],
        includes: [
          'Daily Breakfast',
          'Official Masters Tournament Badges',
          'Choice Of Practice Or Tournament Round Attendance',
          'Transportation For All Scheduled Events',
        ],
        excludes: [
          'Personal Items',
          'Meal Is Unspecified',
          'Travel Insurance',
        ],
        pricingTiers: [
          {
            name: 'ORIGINAL',
            price: '$1,250',
            bookingUrl: '/contact',
          },
          {
            name: 'PREMIUM',
            price: '$1,250',
            bookingUrl: '/contact',
          },
        ],
      },
    ],
  },
  'us-open': {
    name: 'US OPEN',
    displayName: 'US Open',
    heroImage: '/images/4.png',
    logo: '/images/us.png',
    objectPosition: '50% 35%',
    events: [
      {
        id: '1',
        slug: 'us-open-2026',
        title: 'US OPEN 2026',
        location: 'Shinnecock Hills, New York',
        date: 'June 18-21, 2026',
        duration: '3 Nights & 3 Rounds',
        price: '$950',
        image: '/images/4.png',
        heroImage: '/images/us.png',
        description: [
          'The U.S. Open is America\'s national championship, conducted by the USGA and known as the toughest test in golf. With its demanding course setups, narrow fairways, and punishing rough, the U.S. Open rewards only the most complete golfers.',
          'The US Open 2026 returns to Shinnecock Hills, one of the founding member clubs of the USGA and a venue that has produced some of the most dramatic championships in history.',
        ],
        tripHighlights: [
          'Championship access to the US Open 2026 at Shinnecock Hills',
          'Prime viewing locations at this historic venue',
          'Hosted group experience with on-site support throughout the trip',
          'Luxury accommodations in the Hamptons area',
          'Optional golf rounds at premier Long Island courses',
          'Seamless transfers, event coordination, and local expertise',
        ],
        travelItinerary: [
          '3 Nights of Premium Accommodations',
          'Official US Open Championship Access',
          'Curated Golf Experiences',
          'Daily Breakfast & Select Hosted Dining',
          'Luxury Ground Transportation',
          'Leisure Time & Cultural Exploration',
          'Dedicated Golf Concierge Service',
        ],
        itineraryDays: [
          {
            title: 'Day 1: Arrival',
            content: 'Arrive in New York and transfer to the Hamptons. Check into your hotel and enjoy a welcome briefing.',
          },
          {
            title: 'Day 2: US Open Championship',
            content: 'Full day at Shinnecock Hills for the US Open. Experience America\'s toughest test of golf on one of the nation\'s most prestigious links-style courses.',
          },
          {
            title: 'Day 3: Golf & Exploration',
            content: 'Morning round at a premier Long Island course. Afternoon at leisure in the Hamptons or optional return to Shinnecock Hills.',
          },
          {
            title: 'Day 4: Departure',
            content: 'Enjoy a farewell breakfast before transfer to the airport for your departure.',
          },
        ],
        galleryImages: [
          '/placeholder.svg?height=600&width=1000',
          '/placeholder.svg?height=600&width=1000',
          '/placeholder.svg?height=600&width=1000',
        ],
        galleryImages2: [
          '/placeholder.svg?height=600&width=1000',
          '/placeholder.svg?height=600&width=1000',
          '/placeholder.svg?height=600&width=1000',
        ],
        includes: [
          'Daily Breakfast',
          'Official US Open Championship Tickets',
          'Choice Of Practice Or Championship Round Attendance',
          'Transportation For All Scheduled Events',
        ],
        excludes: [
          'Personal Items',
          'Meal Is Unspecified',
          'Travel Insurance',
        ],
        pricingTiers: [
          {
            name: 'ORIGINAL',
            price: '$950',
            bookingUrl: '/contact',
          },
          {
            name: 'PREMIUM',
            price: '$950',
            bookingUrl: '/contact',
          },
        ],
      },
      {
        id: '2',
        slug: 'us-open-2027',
        title: 'US OPEN 2027',
        location: 'Pebble Beach, California',
        date: 'June 17-20, 2027',
        duration: '3 Nights & 3 Rounds',
        price: '$950',
        image: '/images/4.png',
        heroImage: '/images/us.png',
        description: [
          'The U.S. Open is America\'s national championship, conducted by the USGA and known as the toughest test in golf. With its demanding course setups, narrow fairways, and punishing rough, the U.S. Open rewards only the most complete golfers.',
          'The US Open 2027 heads to the breathtaking Pebble Beach Golf Links along the stunning Monterey Peninsula, offering one of the most scenic championship experiences in all of golf.',
        ],
        tripHighlights: [
          'Championship access to the US Open 2027 at Pebble Beach',
          'Prime viewing locations along the Pacific coastline',
          'Hosted group experience with on-site support throughout the trip',
          'Luxury accommodations on the Monterey Peninsula',
          'Optional golf rounds at premier California courses',
          'Seamless transfers, event coordination, and local expertise',
        ],
        travelItinerary: [
          '3 Nights of Premium Accommodations',
          'Official US Open Championship Access',
          'Curated Golf Experiences',
          'Daily Breakfast & Select Hosted Dining',
          'Luxury Ground Transportation',
          'Leisure Time & Cultural Exploration',
          'Dedicated Golf Concierge Service',
        ],
        itineraryDays: [
          {
            title: 'Day 1: Arrival',
            content: 'Arrive in Monterey and check into your hotel. Enjoy a welcome briefing and evening exploring the charming coastal town.',
          },
          {
            title: 'Day 2: US Open Championship',
            content: 'Full day at Pebble Beach for the US Open. Watch the world\'s best golfers tackle one of the most scenic and challenging courses on Earth.',
          },
          {
            title: 'Day 3: Golf & Exploration',
            content: 'Morning round at a premier Monterey Peninsula course. Afternoon at leisure or optional 17-Mile Drive tour.',
          },
          {
            title: 'Day 4: Departure',
            content: 'Enjoy a farewell breakfast before transfer to the airport for your departure.',
          },
        ],
        galleryImages: [
          '/placeholder.svg?height=600&width=1000',
          '/placeholder.svg?height=600&width=1000',
          '/placeholder.svg?height=600&width=1000',
        ],
        galleryImages2: [
          '/placeholder.svg?height=600&width=1000',
          '/placeholder.svg?height=600&width=1000',
          '/placeholder.svg?height=600&width=1000',
        ],
        includes: [
          'Daily Breakfast',
          'Official US Open Championship Tickets',
          'Choice Of Practice Or Championship Round Attendance',
          'Transportation For All Scheduled Events',
        ],
        excludes: [
          'Personal Items',
          'Meal Is Unspecified',
          'Travel Insurance',
        ],
        pricingTiers: [
          {
            name: 'ORIGINAL',
            price: '$950',
            bookingUrl: '/contact',
          },
          {
            name: 'PREMIUM',
            price: '$950',
            bookingUrl: '/contact',
          },
        ],
      },
    ],
  },
}
