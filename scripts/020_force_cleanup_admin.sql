-- Force cleanup of incorrectly created admin user
-- This disables RLS temporarily to ensure deletion works

-- Temporarily disable RLS to force deletion
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE favorites DISABLE ROW LEVEL SECURITY;
ALTER TABLE bookings DISABLE ROW LEVEL SECURITY;

-- Delete related records first
DELETE FROM favorites WHERE user_id IN (SELECT id FROM profiles WHERE email = 'admin@example.com');
DELETE FROM bookings WHERE user_id IN (SELECT id FROM profiles WHERE email = 'admin@example.com');

-- Delete the profile
DELETE FROM profiles WHERE email = 'admin@example.com';

-- Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Also try to delete from auth.users if it exists
-- Note: This requires elevated permissions and might fail if you don't have access
DO $$
BEGIN
  DELETE FROM auth.users WHERE email = 'admin@example.com';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not delete from auth.users - you may need to delete this manually from Supabase Auth dashboard';
END $$;

SELECT 'Cleanup complete. Check Supabase Auth dashboard to manually delete the user if needed.' as message;
