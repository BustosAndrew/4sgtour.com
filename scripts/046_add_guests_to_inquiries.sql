-- Add guests JSONB column to inquiries to store per-guest name, phone, and occupancy
ALTER TABLE public.inquiries
  ADD COLUMN IF NOT EXISTS guests jsonb DEFAULT '[]'::jsonb;
