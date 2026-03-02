-- Seed tournaments with one event each, including full details and existing images

-- Clear existing data in correct order (respecting foreign keys)
DELETE FROM tournament_event_gallery_images;
DELETE FROM tournament_event_itinerary_days;
DELETE FROM tournament_event_pricing_tiers;
DELETE FROM tournament_events;
DELETE FROM tournaments;

-- Insert The Open tournament
INSERT INTO tournaments (id, name, display_name, slug, hero_image, logo, object_position, created_at, updated_at)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'THE OPEN',
  'The Open',
  'the-open',
  '/images/1.png',
  '/images/open.png',
  '50% 35%',
  NOW(),
  NOW()
);

-- Insert The Open event (154th Open at Royal Birkdale)
INSERT INTO tournament_events (id, tournament_id, slug, title, location, date, duration, price, image, hero_image, description, trip_highlights, travel_itinerary, includes, excludes, created_at, updated_at)
VALUES (
  'e1e2e3e4-e5e6-7890-abcd-ef1234567891',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
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
  ARRAY['Personal Items', 'Meal Is Unspecified', 'Travel Insurance'],
  NOW(),
  NOW()
);

-- Insert The Open itinerary days
INSERT INTO tournament_event_itinerary_days (id, event_id, title, content, display_order, created_at)
VALUES 
  (gen_random_uuid(), 'e1e2e3e4-e5e6-7890-abcd-ef1234567891', 'Day 1: Arrival', 'Arrive in England and check into your hotel. Enjoy a welcome briefing and evening at leisure to explore the local area.', 1, NOW()),
  (gen_random_uuid(), 'e1e2e3e4-e5e6-7890-abcd-ef1234567891', 'Day 2: The Open Championship', 'Full day at Royal Birkdale for The Open Championship. Experience the electric atmosphere, explore the championship village, and watch the world''s best golfers compete on this legendary links course.', 2, NOW()),
  (gen_random_uuid(), 'e1e2e3e4-e5e6-7890-abcd-ef1234567891', 'Day 3: Golf & Exploration', 'Morning round at a premier regional links course followed by an afternoon at leisure. Optional return to The Open for continued championship viewing.', 3, NOW()),
  (gen_random_uuid(), 'e1e2e3e4-e5e6-7890-abcd-ef1234567891', 'Day 4: Departure', 'Enjoy a farewell breakfast before transfer to the airport for your departure. Optional late checkout available.', 4, NOW());

-- Insert The Open gallery images
INSERT INTO tournament_event_gallery_images (id, event_id, image_url, gallery_type, display_order, created_at)
VALUES 
  (gen_random_uuid(), 'e1e2e3e4-e5e6-7890-abcd-ef1234567891', '/images/event.jpg', 'event', 1, NOW()),
  (gen_random_uuid(), 'e1e2e3e4-e5e6-7890-abcd-ef1234567891', '/images/event.jpg', 'event', 2, NOW()),
  (gen_random_uuid(), 'e1e2e3e4-e5e6-7890-abcd-ef1234567891', '/images/event.jpg', 'event', 3, NOW()),
  (gen_random_uuid(), 'e1e2e3e4-e5e6-7890-abcd-ef1234567891', '/images/hotel.jpg', 'hotel', 1, NOW()),
  (gen_random_uuid(), 'e1e2e3e4-e5e6-7890-abcd-ef1234567891', '/images/hotel.jpg', 'hotel', 2, NOW()),
  (gen_random_uuid(), 'e1e2e3e4-e5e6-7890-abcd-ef1234567891', '/images/hotel.jpg', 'hotel', 3, NOW());

-- Insert The Open pricing tiers
INSERT INTO tournament_event_pricing_tiers (id, event_id, name, price, booking_url, display_order, created_at)
VALUES 
  (gen_random_uuid(), 'e1e2e3e4-e5e6-7890-abcd-ef1234567891', 'ORIGINAL', '$615', '/contact', 1, NOW()),
  (gen_random_uuid(), 'e1e2e3e4-e5e6-7890-abcd-ef1234567891', 'PREMIUM', '$615', '/contact', 2, NOW());


-- Insert Ryder Cup tournament
INSERT INTO tournaments (id, name, display_name, slug, hero_image, logo, object_position, created_at, updated_at)
VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'RYDER CUP',
  'Ryder Cup',
  'ryder-cup',
  '/images/2.png',
  '/images/ryder.png',
  '50% 35%',
  NOW(),
  NOW()
);

-- Insert Ryder Cup event (2027 at Adare Manor)
INSERT INTO tournament_events (id, tournament_id, slug, title, location, date, duration, price, image, hero_image, description, trip_highlights, travel_itinerary, includes, excludes, created_at, updated_at)
VALUES (
  'e2e3e4e5-e6e7-8901-bcde-f12345678902',
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
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
  ARRAY['Personal Items', 'Meal Is Unspecified', 'Travel Insurance'],
  NOW(),
  NOW()
);

-- Insert Ryder Cup itinerary days
INSERT INTO tournament_event_itinerary_days (id, event_id, title, content, display_order, created_at)
VALUES 
  (gen_random_uuid(), 'e2e3e4e5-e6e7-8901-bcde-f12345678902', 'Day 1: Arrival', 'Arrive in Ireland and check into your hotel. Enjoy a welcome briefing and evening at leisure to explore the charming city of Limerick.', 1, NOW()),
  (gen_random_uuid(), 'e2e3e4e5-e6e7-8901-bcde-f12345678902', 'Day 2: Ryder Cup Day 1', 'Full day at Adare Manor for the opening day of the Ryder Cup. Experience the incredible team atmosphere as foursomes and fourball matches get underway.', 2, NOW()),
  (gen_random_uuid(), 'e2e3e4e5-e6e7-8901-bcde-f12345678902', 'Day 3: Golf & Ryder Cup', 'Morning round at a premier Irish course followed by afternoon Ryder Cup singles action at Adare Manor.', 3, NOW()),
  (gen_random_uuid(), 'e2e3e4e5-e6e7-8901-bcde-f12345678902', 'Day 4: Departure', 'Enjoy a farewell breakfast before transfer to the airport for your departure.', 4, NOW());

-- Insert Ryder Cup gallery images
INSERT INTO tournament_event_gallery_images (id, event_id, image_url, gallery_type, display_order, created_at)
VALUES 
  (gen_random_uuid(), 'e2e3e4e5-e6e7-8901-bcde-f12345678902', '/images/event.jpg', 'event', 1, NOW()),
  (gen_random_uuid(), 'e2e3e4e5-e6e7-8901-bcde-f12345678902', '/images/event.jpg', 'event', 2, NOW()),
  (gen_random_uuid(), 'e2e3e4e5-e6e7-8901-bcde-f12345678902', '/images/event.jpg', 'event', 3, NOW()),
  (gen_random_uuid(), 'e2e3e4e5-e6e7-8901-bcde-f12345678902', '/images/hotel.jpg', 'hotel', 1, NOW()),
  (gen_random_uuid(), 'e2e3e4e5-e6e7-8901-bcde-f12345678902', '/images/hotel.jpg', 'hotel', 2, NOW()),
  (gen_random_uuid(), 'e2e3e4e5-e6e7-8901-bcde-f12345678902', '/images/hotel.jpg', 'hotel', 3, NOW());

-- Insert Ryder Cup pricing tiers
INSERT INTO tournament_event_pricing_tiers (id, event_id, name, price, booking_url, display_order, created_at)
VALUES 
  (gen_random_uuid(), 'e2e3e4e5-e6e7-8901-bcde-f12345678902', 'ORIGINAL', '$615', '/contact', 1, NOW()),
  (gen_random_uuid(), 'e2e3e4e5-e6e7-8901-bcde-f12345678902', 'PREMIUM', '$615', '/contact', 2, NOW());


-- Insert Masters tournament
INSERT INTO tournaments (id, name, display_name, slug, hero_image, logo, object_position, created_at, updated_at)
VALUES (
  'c3d4e5f6-a7b8-9012-cdef-123456789012',
  'MASTERS',
  'Masters',
  'masters',
  '/images/3.png',
  '/images/masters.png',
  '50% 35%',
  NOW(),
  NOW()
);

-- Insert Masters event (2026)
INSERT INTO tournament_events (id, tournament_id, slug, title, location, date, duration, price, image, hero_image, description, trip_highlights, travel_itinerary, includes, excludes, created_at, updated_at)
VALUES (
  'e3e4e5e6-e7e8-9012-cdef-123456789013',
  'c3d4e5f6-a7b8-9012-cdef-123456789012',
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
  ARRAY['Personal Items', 'Meal Is Unspecified', 'Travel Insurance'],
  NOW(),
  NOW()
);

-- Insert Masters itinerary days
INSERT INTO tournament_event_itinerary_days (id, event_id, title, content, display_order, created_at)
VALUES 
  (gen_random_uuid(), 'e3e4e5e6-e7e8-9012-cdef-123456789013', 'Day 1: Arrival', 'Arrive in Augusta and check into your hotel. Enjoy a welcome briefing and evening at leisure.', 1, NOW()),
  (gen_random_uuid(), 'e3e4e5e6-e7e8-9012-cdef-123456789013', 'Day 2: Practice Round', 'Attend the practice round at Augusta National. Explore the grounds, visit the merchandise shop, and soak in the legendary atmosphere.', 2, NOW()),
  (gen_random_uuid(), 'e3e4e5e6-e7e8-9012-cdef-123456789013', 'Day 3: Tournament Day', 'Full day at Augusta National for tournament play. Experience the drama of competitive golf at the highest level.', 3, NOW()),
  (gen_random_uuid(), 'e3e4e5e6-e7e8-9012-cdef-123456789013', 'Day 4: Golf & Exploration', 'Morning round at a premier regional course. Afternoon at leisure or optional return to Augusta National.', 4, NOW()),
  (gen_random_uuid(), 'e3e4e5e6-e7e8-9012-cdef-123456789013', 'Day 5: Departure', 'Enjoy a farewell breakfast before transfer to the airport for your departure.', 5, NOW());

-- Insert Masters gallery images
INSERT INTO tournament_event_gallery_images (id, event_id, image_url, gallery_type, display_order, created_at)
VALUES 
  (gen_random_uuid(), 'e3e4e5e6-e7e8-9012-cdef-123456789013', '/images/event.jpg', 'event', 1, NOW()),
  (gen_random_uuid(), 'e3e4e5e6-e7e8-9012-cdef-123456789013', '/images/event.jpg', 'event', 2, NOW()),
  (gen_random_uuid(), 'e3e4e5e6-e7e8-9012-cdef-123456789013', '/images/event.jpg', 'event', 3, NOW()),
  (gen_random_uuid(), 'e3e4e5e6-e7e8-9012-cdef-123456789013', '/images/hotel.jpg', 'hotel', 1, NOW()),
  (gen_random_uuid(), 'e3e4e5e6-e7e8-9012-cdef-123456789013', '/images/hotel.jpg', 'hotel', 2, NOW()),
  (gen_random_uuid(), 'e3e4e5e6-e7e8-9012-cdef-123456789013', '/images/hotel.jpg', 'hotel', 3, NOW());

-- Insert Masters pricing tiers
INSERT INTO tournament_event_pricing_tiers (id, event_id, name, price, booking_url, display_order, created_at)
VALUES 
  (gen_random_uuid(), 'e3e4e5e6-e7e8-9012-cdef-123456789013', 'ORIGINAL', '$1,250', '/contact', 1, NOW()),
  (gen_random_uuid(), 'e3e4e5e6-e7e8-9012-cdef-123456789013', 'PREMIUM', '$1,250', '/contact', 2, NOW());


-- Insert US Open tournament
INSERT INTO tournaments (id, name, display_name, slug, hero_image, logo, object_position, created_at, updated_at)
VALUES (
  'd4e5f6a7-b8c9-0123-def0-234567890123',
  'US OPEN',
  'US Open',
  'us-open',
  '/images/4.png',
  '/images/us.png',
  '50% 35%',
  NOW(),
  NOW()
);

-- Insert US Open event (2026 at Shinnecock Hills)
INSERT INTO tournament_events (id, tournament_id, slug, title, location, date, duration, price, image, hero_image, description, trip_highlights, travel_itinerary, includes, excludes, created_at, updated_at)
VALUES (
  'e4e5e6e7-e8e9-0123-def0-234567890124',
  'd4e5f6a7-b8c9-0123-def0-234567890123',
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
  ARRAY['Personal Items', 'Meal Is Unspecified', 'Travel Insurance'],
  NOW(),
  NOW()
);

-- Insert US Open itinerary days
INSERT INTO tournament_event_itinerary_days (id, event_id, title, content, display_order, created_at)
VALUES 
  (gen_random_uuid(), 'e4e5e6e7-e8e9-0123-def0-234567890124', 'Day 1: Arrival', 'Arrive in New York and transfer to the Hamptons. Check into your hotel and enjoy a welcome briefing.', 1, NOW()),
  (gen_random_uuid(), 'e4e5e6e7-e8e9-0123-def0-234567890124', 'Day 2: US Open Championship', 'Full day at Shinnecock Hills for the US Open. Experience America''s toughest test of golf on one of the nation''s most prestigious links-style courses.', 2, NOW()),
  (gen_random_uuid(), 'e4e5e6e7-e8e9-0123-def0-234567890124', 'Day 3: Golf & Exploration', 'Morning round at a premier Long Island course. Afternoon at leisure in the Hamptons or optional return to Shinnecock Hills.', 3, NOW()),
  (gen_random_uuid(), 'e4e5e6e7-e8e9-0123-def0-234567890124', 'Day 4: Departure', 'Enjoy a farewell breakfast before transfer to the airport for your departure.', 4, NOW());

-- Insert US Open gallery images
INSERT INTO tournament_event_gallery_images (id, event_id, image_url, gallery_type, display_order, created_at)
VALUES 
  (gen_random_uuid(), 'e4e5e6e7-e8e9-0123-def0-234567890124', '/images/event.jpg', 'event', 1, NOW()),
  (gen_random_uuid(), 'e4e5e6e7-e8e9-0123-def0-234567890124', '/images/event.jpg', 'event', 2, NOW()),
  (gen_random_uuid(), 'e4e5e6e7-e8e9-0123-def0-234567890124', '/images/event.jpg', 'event', 3, NOW()),
  (gen_random_uuid(), 'e4e5e6e7-e8e9-0123-def0-234567890124', '/images/hotel.jpg', 'hotel', 1, NOW()),
  (gen_random_uuid(), 'e4e5e6e7-e8e9-0123-def0-234567890124', '/images/hotel.jpg', 'hotel', 2, NOW()),
  (gen_random_uuid(), 'e4e5e6e7-e8e9-0123-def0-234567890124', '/images/hotel.jpg', 'hotel', 3, NOW());

-- Insert US Open pricing tiers
INSERT INTO tournament_event_pricing_tiers (id, event_id, name, price, booking_url, display_order, created_at)
VALUES 
  (gen_random_uuid(), 'e4e5e6e7-e8e9-0123-def0-234567890124', 'ORIGINAL', '$950', '/contact', 1, NOW()),
  (gen_random_uuid(), 'e4e5e6e7-e8e9-0123-def0-234567890124', 'PREMIUM', '$950', '/contact', 2, NOW());
