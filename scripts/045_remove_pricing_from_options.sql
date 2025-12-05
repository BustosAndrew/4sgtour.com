-- Migration: Remove pricing fields from options tables
-- Pricing is now only set at the package level, not for individual options
-- Options are now just marked as included/not included via is_included field

-- Remove price_per_round from trip_golf_courses
ALTER TABLE trip_golf_courses
DROP COLUMN IF EXISTS price_per_round;

-- Remove price columns from trip_meal_options
-- First check existing columns and remove any price-related ones
ALTER TABLE trip_meal_options
DROP COLUMN IF EXISTS price;

ALTER TABLE trip_meal_options
DROP COLUMN IF EXISTS breakfast_included_price;

ALTER TABLE trip_meal_options
DROP COLUMN IF EXISTS breakfast_not_included_price;

-- Remove price columns from trip_transportation_options
ALTER TABLE trip_transportation_options
DROP COLUMN IF EXISTS price;

ALTER TABLE trip_transportation_options
DROP COLUMN IF EXISTS private_car_price;

ALTER TABLE trip_transportation_options
DROP COLUMN IF EXISTS self_drive_price;

-- Ensure name and description columns exist on meal and transportation options
-- (these should already exist from previous migrations, but adding IF NOT EXISTS for safety)

-- Add name column to trip_meal_options if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'trip_meal_options' AND column_name = 'name'
  ) THEN
    ALTER TABLE trip_meal_options ADD COLUMN name VARCHAR(255);
  END IF;
END $$;

-- Add description column to trip_meal_options if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'trip_meal_options' AND column_name = 'description'
  ) THEN
    ALTER TABLE trip_meal_options ADD COLUMN description TEXT;
  END IF;
END $$;

-- Add name column to trip_transportation_options if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'trip_transportation_options' AND column_name = 'name'
  ) THEN
    ALTER TABLE trip_transportation_options ADD COLUMN name VARCHAR(255);
  END IF;
END $$;

-- Add description column to trip_transportation_options if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'trip_transportation_options' AND column_name = 'description'
  ) THEN
    ALTER TABLE trip_transportation_options ADD COLUMN description TEXT;
  END IF;
END $$;

-- Add description column to trip_golf_courses if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'trip_golf_courses' AND column_name = 'description'
  ) THEN
    ALTER TABLE trip_golf_courses ADD COLUMN description TEXT;
  END IF;
END $$;

-- Remove is_included from trip_golf_courses (golf courses don't use this field)
ALTER TABLE trip_golf_courses
DROP COLUMN IF EXISTS is_included;

-- Summary of final table structures:
-- 
-- trip_golf_courses:
--   id, trip_id, course_name, max_rounds, description, created_at, updated_at
--
-- trip_meal_options:
--   id, trip_id, name, description, is_included, created_at, updated_at
--
-- trip_transportation_options:
--   id, trip_id, name, description, is_included, created_at, updated_at
