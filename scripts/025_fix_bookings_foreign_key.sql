-- Fix bookings table to reference profiles instead of auth.users
-- This allows Supabase PostgREST to properly join bookings with profiles

-- Drop the old foreign key constraint
ALTER TABLE public.bookings
DROP CONSTRAINT IF EXISTS bookings_user_id_fkey;

-- Add new foreign key constraint referencing profiles
ALTER TABLE public.bookings
ADD CONSTRAINT bookings_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES public.profiles(id)
ON DELETE CASCADE;

-- Verify the constraint was added
SELECT
    conname AS constraint_name,
    conrelid::regclass AS table_name,
    confrelid::regclass AS referenced_table
FROM pg_constraint
WHERE conname = 'bookings_user_id_fkey';
