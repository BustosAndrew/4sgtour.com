-- Add num_holes column to trip_golf_courses table
ALTER TABLE trip_golf_courses ADD COLUMN IF NOT EXISTS num_holes integer DEFAULT 18;
