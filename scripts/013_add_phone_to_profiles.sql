-- Add phone number column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone text;

-- Create index for phone lookups
CREATE INDEX IF NOT EXISTS profiles_phone_idx ON profiles(phone);
