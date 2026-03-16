-- Add price_per_extra_night column to packages table
-- This allows trips to charge extra for nights beyond the minimum stay

ALTER TABLE packages
ADD COLUMN IF NOT EXISTS price_per_extra_night numeric DEFAULT NULL;

-- Add a comment to describe the column
COMMENT ON COLUMN packages.price_per_extra_night IS 'Optional: Additional price charged per night beyond the minimum stay';
