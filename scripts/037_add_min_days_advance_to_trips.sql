-- Add min_days_advance column to trips table
ALTER TABLE public.trips
ADD COLUMN IF NOT EXISTS min_days_advance integer DEFAULT 0;

-- Add comment for documentation
COMMENT ON COLUMN public.trips.min_days_advance IS 'Minimum number of days in advance required to book this trip (e.g., 30 means users must book at least 30 days before start date)';

-- Create index for queries
CREATE INDEX IF NOT EXISTS idx_trips_min_days_advance ON trips(min_days_advance);
