-- Update all existing "Regular" packages to "Basic"
-- Fixed table name from trip_packages to packages
UPDATE packages
SET name = 'Basic'
WHERE name = 'Regular';
