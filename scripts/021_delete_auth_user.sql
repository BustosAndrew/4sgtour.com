-- Delete admin@golftravel.com user completely
-- This must be run with elevated privileges

-- First, delete all related data (cascade should handle this, but being explicit)
DELETE FROM public.favorites WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'admin@golftravel.com'
);

DELETE FROM public.bookings WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'admin@golftravel.com'
);

DELETE FROM public.profiles WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'admin@golftravel.com'
);

-- Finally, delete from auth.users (this is the critical step)
DELETE FROM auth.users WHERE email = 'admin@golftravel.com';
