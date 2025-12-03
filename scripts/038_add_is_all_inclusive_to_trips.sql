-- Add is_all_inclusive column to trips table
-- When true, the trip automatically includes transportation and a meal
ALTER TABLE public.trips
ADD COLUMN IF NOT EXISTS is_all_inclusive boolean DEFAULT false;

-- Add comment explaining the field
COMMENT ON COLUMN public.trips.is_all_inclusive IS 'When true, the trip includes transportation and meal by default';
