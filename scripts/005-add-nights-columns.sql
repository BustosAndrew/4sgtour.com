-- Add max_nights and min_nights columns to trips table
ALTER TABLE trips ADD COLUMN IF NOT EXISTS max_nights integer;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS min_nights integer DEFAULT 1;

-- Copy values from max_days and min_days if they exist
UPDATE trips SET max_nights = max_days WHERE max_nights IS NULL AND max_days IS NOT NULL;
UPDATE trips SET min_nights = min_days WHERE min_nights IS NULL AND min_days IS NOT NULL;
