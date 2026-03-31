-- Add inquiry_type column to distinguish trip inquiries from tournament event inquiries
ALTER TABLE public.inquiries
ADD COLUMN IF NOT EXISTS inquiry_type TEXT NOT NULL DEFAULT 'trip';

-- Add event_title column for tournament event inquiries (since trip_title maps to event title for tourneys)
ALTER TABLE public.inquiries
ADD COLUMN IF NOT EXISTS participants INTEGER;

-- Add comment for documentation
COMMENT ON COLUMN public.inquiries.inquiry_type IS 'Type of inquiry: trip or tournament';
COMMENT ON COLUMN public.inquiries.participants IS 'Number of participants (used for tournament ticket inquiries)';
