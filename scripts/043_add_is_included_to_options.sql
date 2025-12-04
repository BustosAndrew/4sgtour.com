-- Migration: Add is_included field to option tables and remove global is_all_inclusive
-- Each meal, transportation, and golf course option can now be individually marked as included

-- Add is_included to trip_meal_options
ALTER TABLE trip_meal_options
ADD COLUMN IF NOT EXISTS is_included BOOLEAN DEFAULT false;

-- Add is_included to trip_transportation_options  
ALTER TABLE trip_transportation_options
ADD COLUMN IF NOT EXISTS is_included BOOLEAN DEFAULT false;

-- Add is_included to trip_golf_courses
ALTER TABLE trip_golf_courses
ADD COLUMN IF NOT EXISTS is_included BOOLEAN DEFAULT false;

-- Remove the global is_all_inclusive column from trips (now handled per-option)
ALTER TABLE trips
DROP COLUMN IF EXISTS is_all_inclusive;
