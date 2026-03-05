-- Add translation columns for Korean and German to content tables
-- This migration adds _ko and _de suffix columns for translatable content

-- =====================================================
-- TRIPS TABLE
-- =====================================================
ALTER TABLE trips ADD COLUMN IF NOT EXISTS title_ko TEXT;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS title_de TEXT;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS description_ko TEXT;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS description_de TEXT;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS overview_content_ko TEXT;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS overview_content_de TEXT;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS highlights_ko TEXT[];
ALTER TABLE trips ADD COLUMN IF NOT EXISTS highlights_de TEXT[];
ALTER TABLE trips ADD COLUMN IF NOT EXISTS location_ko TEXT;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS location_de TEXT;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS refund_policy_ko TEXT;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS refund_policy_de TEXT;

-- =====================================================
-- DESTINATIONS TABLE
-- =====================================================
ALTER TABLE destinations ADD COLUMN IF NOT EXISTS name_ko TEXT;
ALTER TABLE destinations ADD COLUMN IF NOT EXISTS name_de TEXT;
ALTER TABLE destinations ADD COLUMN IF NOT EXISTS description_ko TEXT;
ALTER TABLE destinations ADD COLUMN IF NOT EXISTS description_de TEXT;

-- =====================================================
-- TOURNAMENTS TABLE
-- =====================================================
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS name_ko TEXT;
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS name_de TEXT;
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS display_name_ko TEXT;
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS display_name_de TEXT;

-- =====================================================
-- TOURNAMENT_EVENTS TABLE
-- =====================================================
ALTER TABLE tournament_events ADD COLUMN IF NOT EXISTS title_ko TEXT;
ALTER TABLE tournament_events ADD COLUMN IF NOT EXISTS title_de TEXT;
ALTER TABLE tournament_events ADD COLUMN IF NOT EXISTS location_ko TEXT;
ALTER TABLE tournament_events ADD COLUMN IF NOT EXISTS location_de TEXT;
ALTER TABLE tournament_events ADD COLUMN IF NOT EXISTS description_ko TEXT[];
ALTER TABLE tournament_events ADD COLUMN IF NOT EXISTS description_de TEXT[];
ALTER TABLE tournament_events ADD COLUMN IF NOT EXISTS trip_highlights_ko TEXT[];
ALTER TABLE tournament_events ADD COLUMN IF NOT EXISTS trip_highlights_de TEXT[];
ALTER TABLE tournament_events ADD COLUMN IF NOT EXISTS travel_itinerary_ko TEXT[];
ALTER TABLE tournament_events ADD COLUMN IF NOT EXISTS travel_itinerary_de TEXT[];
ALTER TABLE tournament_events ADD COLUMN IF NOT EXISTS includes_ko TEXT[];
ALTER TABLE tournament_events ADD COLUMN IF NOT EXISTS includes_de TEXT[];
ALTER TABLE tournament_events ADD COLUMN IF NOT EXISTS excludes_ko TEXT[];
ALTER TABLE tournament_events ADD COLUMN IF NOT EXISTS excludes_de TEXT[];

-- =====================================================
-- PACKAGES TABLE
-- =====================================================
ALTER TABLE packages ADD COLUMN IF NOT EXISTS name_ko VARCHAR;
ALTER TABLE packages ADD COLUMN IF NOT EXISTS name_de VARCHAR;
ALTER TABLE packages ADD COLUMN IF NOT EXISTS description_ko TEXT;
ALTER TABLE packages ADD COLUMN IF NOT EXISTS description_de TEXT;

-- =====================================================
-- TOURNAMENT_EVENT_ITINERARY_DAYS TABLE
-- =====================================================
ALTER TABLE tournament_event_itinerary_days ADD COLUMN IF NOT EXISTS title_ko TEXT;
ALTER TABLE tournament_event_itinerary_days ADD COLUMN IF NOT EXISTS title_de TEXT;
ALTER TABLE tournament_event_itinerary_days ADD COLUMN IF NOT EXISTS content_ko TEXT;
ALTER TABLE tournament_event_itinerary_days ADD COLUMN IF NOT EXISTS content_de TEXT;

-- =====================================================
-- TOURNAMENT_EVENT_PRICING_TIERS TABLE
-- =====================================================
ALTER TABLE tournament_event_pricing_tiers ADD COLUMN IF NOT EXISTS name_ko TEXT;
ALTER TABLE tournament_event_pricing_tiers ADD COLUMN IF NOT EXISTS name_de TEXT;

-- =====================================================
-- ADD_ONS TABLE
-- =====================================================
ALTER TABLE add_ons ADD COLUMN IF NOT EXISTS name_ko VARCHAR;
ALTER TABLE add_ons ADD COLUMN IF NOT EXISTS name_de VARCHAR;
ALTER TABLE add_ons ADD COLUMN IF NOT EXISTS description_ko TEXT;
ALTER TABLE add_ons ADD COLUMN IF NOT EXISTS description_de TEXT;

-- =====================================================
-- TRIP_GOLF_COURSES TABLE
-- =====================================================
ALTER TABLE trip_golf_courses ADD COLUMN IF NOT EXISTS course_name_ko VARCHAR;
ALTER TABLE trip_golf_courses ADD COLUMN IF NOT EXISTS course_name_de VARCHAR;
ALTER TABLE trip_golf_courses ADD COLUMN IF NOT EXISTS description_ko TEXT;
ALTER TABLE trip_golf_courses ADD COLUMN IF NOT EXISTS description_de TEXT;

-- =====================================================
-- TRIP_MEAL_OPTIONS TABLE
-- =====================================================
ALTER TABLE trip_meal_options ADD COLUMN IF NOT EXISTS name_ko VARCHAR;
ALTER TABLE trip_meal_options ADD COLUMN IF NOT EXISTS name_de VARCHAR;
ALTER TABLE trip_meal_options ADD COLUMN IF NOT EXISTS description_ko TEXT;
ALTER TABLE trip_meal_options ADD COLUMN IF NOT EXISTS description_de TEXT;

-- =====================================================
-- TRIP_SERVICE_OPTIONS TABLE
-- =====================================================
ALTER TABLE trip_service_options ADD COLUMN IF NOT EXISTS name_ko VARCHAR;
ALTER TABLE trip_service_options ADD COLUMN IF NOT EXISTS name_de VARCHAR;
ALTER TABLE trip_service_options ADD COLUMN IF NOT EXISTS description_ko TEXT;
ALTER TABLE trip_service_options ADD COLUMN IF NOT EXISTS description_de TEXT;

-- =====================================================
-- TRIP_TRANSPORTATION_OPTIONS TABLE
-- =====================================================
ALTER TABLE trip_transportation_options ADD COLUMN IF NOT EXISTS name_ko VARCHAR;
ALTER TABLE trip_transportation_options ADD COLUMN IF NOT EXISTS name_de VARCHAR;
ALTER TABLE trip_transportation_options ADD COLUMN IF NOT EXISTS description_ko TEXT;
ALTER TABLE trip_transportation_options ADD COLUMN IF NOT EXISTS description_de TEXT;

-- Add comments for documentation
COMMENT ON COLUMN trips.title_ko IS 'Korean translation of title';
COMMENT ON COLUMN trips.title_de IS 'German translation of title';
COMMENT ON COLUMN destinations.name_ko IS 'Korean translation of name';
COMMENT ON COLUMN destinations.name_de IS 'German translation of name';
COMMENT ON COLUMN tournaments.name_ko IS 'Korean translation of name';
COMMENT ON COLUMN tournaments.name_de IS 'German translation of name';
