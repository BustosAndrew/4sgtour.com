-- Seed tournaments data from existing tournament-data.ts

-- Insert tournaments
INSERT INTO tournaments (slug, name, display_name, hero_image, logo, object_position) VALUES
('the-open', 'THE OPEN', 'The Open', '/images/1.png', '/images/open.png', '50% 35%'),
('ryder-cup', 'RYDER CUP', 'Ryder Cup', '/images/2.png', '/images/ryder.png', '50% 35%'),
('masters', 'MASTERS', 'Masters', '/images/3.png', '/images/masters.png', '50% 35%'),
('us-open', 'US OPEN', 'US Open', '/images/4.png', '/images/us.png', '50% 35%')
ON CONFLICT (slug) DO NOTHING;

-- Insert The Open events
INSERT INTO tournament_events (
  tournament_id, slug, title, location, date, duration, price, image, hero_image,
  description, trip_highlights, travel_itinerary, includes, excludes
) 
SELECT 
  t.id,
  'the-154th-open-at-royal-birkdale',
  'THE 154TH OPEN AT ROYAL BIRKDALE',
  'Southport, England',
  'July 17-20, 2025',
  '3 Nights & 3 Rounds',
  '$615',
  '/images/1.png',
  '/images/open.png',
  ARRAY['The Open Championship is golf''s oldest major, first played in 1860 and governed by The R&A. Contested exclusively on traditional links courses, The Open presents a unique challenge defined by coastal winds, firm fairways, and storied history.', 'The 154th Open returns to Royal Birkdale, a classic links venue that has crowned legends of the game and is renowned for its demanding yet fair championship test.'],
  ARRAY['Championship access to The 154th Open at Royal Birkdale', 'Prime viewing locations to experience Open drama firsthand', 'Hosted group experience with on-site support throughout the trip', 'Luxury accommodations near the championship venue', 'Optional golf rounds at iconic English links courses', 'Seamless transfers, event coordination, and local expertise'],
  ARRAY['4 Nights of Premium Accommodations', 'Official Open Championship Access', 'Curated Golf Experiences', 'Daily Breakfast & Select Hosted Dining', 'Luxury Ground Transportation', 'Leisure Time & Cultural Exploration', 'Dedicated Golf Concierge Service'],
  ARRAY['Daily Breakfast', 'Official Open Championship Tickets', 'Choice Of Practice Or Championship Round Attendance', 'Official Open Championship Tickets', 'Transportation For All Scheduled Events'],
  ARRAY['Personal Items', 'Meal Is Unspecified', 'Travel Insurance']
FROM tournaments t WHERE t.slug = 'the-open'
ON CONFLICT (tournament_id, slug) DO NOTHING;

INSERT INTO tournament_events (
  tournament_id, slug, title, location, date, duration, price, image, hero_image,
  description, trip_highlights, travel_itinerary, includes, excludes
) 
SELECT 
  t.id,
  'the-155th-open-at-royal-portrush',
  'THE 155TH OPEN AT ROYAL PORTRUSH',
  'County Antrim, Northern Ireland',
  'July 16-19, 2026',
  '3 Nights & 3 Rounds',
  '$615',
  '/images/1.png',
  '/images/open.png',
  ARRAY['The Open Championship is golf''s oldest major, first played in 1860 and governed by The R&A. Contested exclusively on traditional links courses, The Open presents a unique challenge defined by coastal winds, firm fairways, and storied history.', 'The 155th Open heads to Royal Portrush, a spectacular links venue on the dramatic Antrim coastline of Northern Ireland, offering breathtaking scenery and a world-class championship test.'],
  ARRAY['Championship access to The 155th Open at Royal Portrush', 'Prime viewing locations to experience Open drama firsthand', 'Hosted group experience with on-site support throughout the trip', 'Luxury accommodations near the championship venue', 'Optional golf rounds at iconic Northern Irish links courses', 'Seamless transfers, event coordination, and local expertise'],
  ARRAY['4 Nights of Premium Accommodations', 'Official Open Championship Access', 'Curated Golf Experiences', 'Daily Breakfast & Select Hosted Dining', 'Luxury Ground Transportation', 'Leisure Time & Cultural Exploration', 'Dedicated Golf Concierge Service'],
  ARRAY['Daily Breakfast', 'Official Open Championship Tickets', 'Choice Of Practice Or Championship Round Attendance', 'Transportation For All Scheduled Events'],
  ARRAY['Personal Items', 'Meal Is Unspecified', 'Travel Insurance']
FROM tournaments t WHERE t.slug = 'the-open'
ON CONFLICT (tournament_id, slug) DO NOTHING;

INSERT INTO tournament_events (
  tournament_id, slug, title, location, date, duration, price, image, hero_image,
  description, trip_highlights, travel_itinerary, includes, excludes
) 
SELECT 
  t.id,
  'the-156th-open-at-st-andrews',
  'THE 156TH OPEN AT ST ANDREWS',
  'St Andrews, Scotland',
  'July 15-18, 2027',
  '3 Nights & 3 Rounds',
  '$615',
  '/images/1.png',
  '/images/open.png',
  ARRAY['The Open Championship is golf''s oldest major, first played in 1860 and governed by The R&A. Contested exclusively on traditional links courses, The Open presents a unique challenge defined by coastal winds, firm fairways, and storied history.', 'The 156th Open returns to the Home of Golf at St Andrews, the most iconic venue in all of golf. The Old Course provides a timeless championship experience steeped in centuries of tradition.'],
  ARRAY['Championship access to The 156th Open at St Andrews', 'Prime viewing locations at the Home of Golf', 'Hosted group experience with on-site support throughout the trip', 'Luxury accommodations in the heart of St Andrews', 'Optional golf rounds at iconic Scottish links courses', 'Seamless transfers, event coordination, and local expertise'],
  ARRAY['4 Nights of Premium Accommodations', 'Official Open Championship Access', 'Curated Golf Experiences', 'Daily Breakfast & Select Hosted Dining', 'Luxury Ground Transportation', 'Leisure Time & Cultural Exploration', 'Dedicated Golf Concierge Service'],
  ARRAY['Daily Breakfast', 'Official Open Championship Tickets', 'Choice Of Practice Or Championship Round Attendance', 'Transportation For All Scheduled Events'],
  ARRAY['Personal Items', 'Meal Is Unspecified', 'Travel Insurance']
FROM tournaments t WHERE t.slug = 'the-open'
ON CONFLICT (tournament_id, slug) DO NOTHING;

-- Insert Ryder Cup events
INSERT INTO tournament_events (
  tournament_id, slug, title, location, date, duration, price, image, hero_image,
  description, trip_highlights, travel_itinerary, includes, excludes
) 
SELECT 
  t.id,
  'the-2027-ryder-cup',
  'THE 2027 RYDER CUP',
  'Limerick, Ireland',
  'September, 2027',
  '3 Nights & 3 Rounds',
  '$615',
  '/images/2.png',
  '/images/ryder.png',
  ARRAY['The Ryder Cup is one of sport''s greatest spectacles, pitting the best golfers from Europe against the United States in a biennial team competition that ignites passions on both sides of the Atlantic.', 'The 2027 Ryder Cup heads to Adare Manor in Limerick, Ireland, one of the most prestigious golf resorts in the world, promising an unforgettable atmosphere of competition and camaraderie.'],
  ARRAY['Championship access to The 2027 Ryder Cup at Adare Manor', 'Prime viewing locations for all matches', 'Hosted group experience with on-site support throughout the trip', 'Luxury accommodations in the Limerick area', 'Optional golf rounds at iconic Irish courses', 'Seamless transfers, event coordination, and local expertise'],
  ARRAY['4 Nights of Premium Accommodations', 'Official Ryder Cup Access', 'Curated Golf Experiences', 'Daily Breakfast & Select Hosted Dining', 'Luxury Ground Transportation', 'Leisure Time & Cultural Exploration', 'Dedicated Golf Concierge Service'],
  ARRAY['Daily Breakfast', 'Official Ryder Cup Tickets', 'Choice Of Practice Or Competition Day Attendance', 'Transportation For All Scheduled Events'],
  ARRAY['Personal Items', 'Meal Is Unspecified', 'Travel Insurance']
FROM tournaments t WHERE t.slug = 'ryder-cup'
ON CONFLICT (tournament_id, slug) DO NOTHING;

INSERT INTO tournament_events (
  tournament_id, slug, title, location, date, duration, price, image, hero_image,
  description, trip_highlights, travel_itinerary, includes, excludes
) 
SELECT 
  t.id,
  'the-2029-ryder-cup',
  'THE 2029 RYDER CUP',
  'Bethpage, New York',
  'September, 2029',
  '3 Nights & 3 Rounds',
  '$615',
  '/images/2.png',
  '/images/ryder.png',
  ARRAY['The Ryder Cup is one of sport''s greatest spectacles, pitting the best golfers from Europe against the United States in a biennial team competition that ignites passions on both sides of the Atlantic.', 'The 2029 Ryder Cup takes place at Bethpage Black in New York, one of America''s most iconic and challenging public golf courses, promising a thrilling atmosphere.'],
  ARRAY['Championship access to The 2029 Ryder Cup at Bethpage Black', 'Prime viewing locations for all matches', 'Hosted group experience with on-site support throughout the trip', 'Luxury accommodations in the New York area', 'Optional golf rounds at iconic regional courses', 'Seamless transfers, event coordination, and local expertise'],
  ARRAY['4 Nights of Premium Accommodations', 'Official Ryder Cup Access', 'Curated Golf Experiences', 'Daily Breakfast & Select Hosted Dining', 'Luxury Ground Transportation', 'Leisure Time & Cultural Exploration', 'Dedicated Golf Concierge Service'],
  ARRAY['Daily Breakfast', 'Official Ryder Cup Tickets', 'Choice Of Practice Or Competition Day Attendance', 'Transportation For All Scheduled Events'],
  ARRAY['Personal Items', 'Meal Is Unspecified', 'Travel Insurance']
FROM tournaments t WHERE t.slug = 'ryder-cup'
ON CONFLICT (tournament_id, slug) DO NOTHING;

-- Insert Masters events
INSERT INTO tournament_events (
  tournament_id, slug, title, location, date, duration, price, image, hero_image,
  description, trip_highlights, travel_itinerary, includes, excludes
) 
SELECT 
  t.id,
  'the-masters-2026',
  'THE MASTERS 2026',
  'Augusta, Georgia',
  'April 9-13, 2026',
  '4 Nights & 3 Rounds',
  '$1,250',
  '/images/3.png',
  '/images/masters.png',
  ARRAY['The Masters Tournament is golf''s most prestigious invitation-only event, held annually at Augusta National Golf Club. Known for its iconic green jacket, azalea-lined fairways, and Amen Corner, The Masters represents the pinnacle of golf tradition.', 'The Masters 2026 invites you to witness greatness at Augusta National, where the world''s finest golfers compete on one of the most beautiful and challenging courses in existence.'],
  ARRAY['Championship access to The Masters 2026 at Augusta National', 'Prime viewing locations at iconic holes including Amen Corner', 'Hosted group experience with on-site support throughout the trip', 'Luxury accommodations in the Augusta area', 'Optional golf rounds at premier regional courses', 'Seamless transfers, event coordination, and local expertise'],
  ARRAY['4 Nights of Premium Accommodations', 'Official Masters Tournament Access', 'Curated Golf Experiences', 'Daily Breakfast & Select Hosted Dining', 'Luxury Ground Transportation', 'Leisure Time & Cultural Exploration', 'Dedicated Golf Concierge Service'],
  ARRAY['Daily Breakfast', 'Official Masters Tournament Badges', 'Choice Of Practice Or Tournament Round Attendance', 'Transportation For All Scheduled Events'],
  ARRAY['Personal Items', 'Meal Is Unspecified', 'Travel Insurance']
FROM tournaments t WHERE t.slug = 'masters'
ON CONFLICT (tournament_id, slug) DO NOTHING;

INSERT INTO tournament_events (
  tournament_id, slug, title, location, date, duration, price, image, hero_image,
  description, trip_highlights, travel_itinerary, includes, excludes
) 
SELECT 
  t.id,
  'the-masters-2027',
  'THE MASTERS 2027',
  'Augusta, Georgia',
  'April 8-11, 2027',
  '4 Nights & 3 Rounds',
  '$1,250',
  '/images/3.png',
  '/images/masters.png',
  ARRAY['The Masters Tournament is golf''s most prestigious invitation-only event, held annually at Augusta National Golf Club. Known for its iconic green jacket, azalea-lined fairways, and Amen Corner, The Masters represents the pinnacle of golf tradition.', 'The Masters 2027 offers another opportunity to witness greatness at Augusta National, one of the most beautiful and challenging courses in existence.'],
  ARRAY['Championship access to The Masters 2027 at Augusta National', 'Prime viewing locations at iconic holes including Amen Corner', 'Hosted group experience with on-site support throughout the trip', 'Luxury accommodations in the Augusta area', 'Optional golf rounds at premier regional courses', 'Seamless transfers, event coordination, and local expertise'],
  ARRAY['4 Nights of Premium Accommodations', 'Official Masters Tournament Access', 'Curated Golf Experiences', 'Daily Breakfast & Select Hosted Dining', 'Luxury Ground Transportation', 'Leisure Time & Cultural Exploration', 'Dedicated Golf Concierge Service'],
  ARRAY['Daily Breakfast', 'Official Masters Tournament Badges', 'Choice Of Practice Or Tournament Round Attendance', 'Transportation For All Scheduled Events'],
  ARRAY['Personal Items', 'Meal Is Unspecified', 'Travel Insurance']
FROM tournaments t WHERE t.slug = 'masters'
ON CONFLICT (tournament_id, slug) DO NOTHING;

-- Insert US Open events
INSERT INTO tournament_events (
  tournament_id, slug, title, location, date, duration, price, image, hero_image,
  description, trip_highlights, travel_itinerary, includes, excludes
) 
SELECT 
  t.id,
  'us-open-2026',
  'US OPEN 2026',
  'Shinnecock Hills, New York',
  'June 18-21, 2026',
  '3 Nights & 3 Rounds',
  '$950',
  '/images/4.png',
  '/images/us.png',
  ARRAY['The U.S. Open is America''s national championship, conducted by the USGA and known as the toughest test in golf. With its demanding course setups, narrow fairways, and punishing rough, the U.S. Open rewards only the most complete golfers.', 'The US Open 2026 returns to Shinnecock Hills, one of the founding member clubs of the USGA and a venue that has produced some of the most dramatic championships in history.'],
  ARRAY['Championship access to the US Open 2026 at Shinnecock Hills', 'Prime viewing locations at this historic venue', 'Hosted group experience with on-site support throughout the trip', 'Luxury accommodations in the Hamptons area', 'Optional golf rounds at premier Long Island courses', 'Seamless transfers, event coordination, and local expertise'],
  ARRAY['3 Nights of Premium Accommodations', 'Official US Open Championship Access', 'Curated Golf Experiences', 'Daily Breakfast & Select Hosted Dining', 'Luxury Ground Transportation', 'Leisure Time & Cultural Exploration', 'Dedicated Golf Concierge Service'],
  ARRAY['Daily Breakfast', 'Official US Open Championship Tickets', 'Choice Of Practice Or Championship Round Attendance', 'Transportation For All Scheduled Events'],
  ARRAY['Personal Items', 'Meal Is Unspecified', 'Travel Insurance']
FROM tournaments t WHERE t.slug = 'us-open'
ON CONFLICT (tournament_id, slug) DO NOTHING;

INSERT INTO tournament_events (
  tournament_id, slug, title, location, date, duration, price, image, hero_image,
  description, trip_highlights, travel_itinerary, includes, excludes
) 
SELECT 
  t.id,
  'us-open-2027',
  'US OPEN 2027',
  'Pebble Beach, California',
  'June 17-20, 2027',
  '3 Nights & 3 Rounds',
  '$950',
  '/images/4.png',
  '/images/us.png',
  ARRAY['The U.S. Open is America''s national championship, conducted by the USGA and known as the toughest test in golf. With its demanding course setups, narrow fairways, and punishing rough, the U.S. Open rewards only the most complete golfers.', 'The US Open 2027 heads to the breathtaking Pebble Beach Golf Links along the stunning Monterey Peninsula, offering one of the most scenic championship experiences in all of golf.'],
  ARRAY['Championship access to the US Open 2027 at Pebble Beach', 'Prime viewing locations along the Pacific coastline', 'Hosted group experience with on-site support throughout the trip', 'Luxury accommodations on the Monterey Peninsula', 'Optional golf rounds at premier California courses', 'Seamless transfers, event coordination, and local expertise'],
  ARRAY['3 Nights of Premium Accommodations', 'Official US Open Championship Access', 'Curated Golf Experiences', 'Daily Breakfast & Select Hosted Dining', 'Luxury Ground Transportation', 'Leisure Time & Cultural Exploration', 'Dedicated Golf Concierge Service'],
  ARRAY['Daily Breakfast', 'Official US Open Championship Tickets', 'Choice Of Practice Or Championship Round Attendance', 'Transportation For All Scheduled Events'],
  ARRAY['Personal Items', 'Meal Is Unspecified', 'Travel Insurance']
FROM tournaments t WHERE t.slug = 'us-open'
ON CONFLICT (tournament_id, slug) DO NOTHING;
