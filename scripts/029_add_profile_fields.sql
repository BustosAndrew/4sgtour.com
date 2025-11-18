-- Add phone and photo_url fields to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS photo_url text;
