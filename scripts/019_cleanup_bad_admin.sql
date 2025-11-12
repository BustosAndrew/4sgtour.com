-- Clean up incorrectly created admin user
-- Run this to remove the test admin that was created incorrectly

-- Delete from profiles (this should cascade and clean up related data)
DELETE FROM profiles 
WHERE email = 'admin@example.com';

-- If there are any orphaned records, clean them up
DELETE FROM favorites WHERE user_id NOT IN (SELECT id FROM profiles);
DELETE FROM bookings WHERE user_id NOT IN (SELECT id FROM profiles);

-- Verify cleanup
SELECT 'Cleanup complete. You can now sign up through the website.' as message;
