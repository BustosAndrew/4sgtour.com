-- Add max_days column to trips table
ALTER TABLE public.trips
ADD COLUMN IF NOT EXISTS max_days integer;

-- Add comment to describe the column
COMMENT ON COLUMN public.trips.max_days IS 'Maximum number of days allowed for this trip';
