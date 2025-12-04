-- Rename packages: Basic -> Premium, Premium -> Upgrade
-- This updates all existing package names in the database

-- First rename Premium to Upgrade (to avoid conflicts)
UPDATE packages
SET name = 'Upgrade'
WHERE name = 'Premium';

-- Then rename Basic to Premium
UPDATE packages
SET name = 'Premium'
WHERE name = 'Basic' OR name = 'Regular';

-- Drop course_start_date and course_end_date columns from inquiries (no longer needed)
ALTER TABLE inquiries
DROP COLUMN IF EXISTS course_start_date,
DROP COLUMN IF EXISTS course_end_date;
