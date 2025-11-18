-- Add max_rounds field to trip_golf_courses table
ALTER TABLE trip_golf_courses 
ADD COLUMN IF NOT EXISTS max_rounds INTEGER NOT NULL DEFAULT 5;

COMMENT ON COLUMN trip_golf_courses.max_rounds IS 'Maximum number of rounds available for this course (minimum 0)';
