-- Promote an existing user to admin
-- 
-- INSTRUCTIONS:
-- 1. Replace 'your-email@example.com' with the email you used to sign up
-- 2. Run this script in the Supabase SQL Editor
-- 3. Check the results below to confirm the promotion worked
-- 
-- Example: If you signed up with test@example.com, change line 14 to:
-- WHERE email = 'test@example.com';

UPDATE public.profiles
SET user_type = 'admin'
WHERE email = 'bustosandrew28@gmail.com'; -- <-- REPLACE THIS EMAIL

-- Verify the update worked - you should see user_type = 'admin' in the results
SELECT 
  email, 
  display_name, 
  user_type,
  created_at,
  CASE 
    WHEN user_type = 'admin' THEN '✓ Admin promotion successful!'
    ELSE '✗ User is not admin - check the email address'
  END as status
FROM public.profiles
WHERE email = 'bustosandrew28@gmail.com'; -- <-- REPLACE THIS EMAIL TOO
