-- Make destination_id nullable since we're now using continent field instead
ALTER TABLE public.trips ALTER COLUMN destination_id DROP NOT NULL;

-- Add continent column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'trips' AND column_name = 'continent') THEN
    ALTER TABLE public.trips ADD COLUMN continent TEXT;
  END IF;
END $$;
