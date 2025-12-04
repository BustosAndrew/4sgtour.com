-- Add minimum days field to trips table
-- This defines the minimum number of days that must be selected on the calendar

ALTER TABLE trips ADD COLUMN IF NOT EXISTS min_days integer DEFAULT 1;

-- Update any existing trips to have a default min_days of 1
UPDATE trips SET min_days = 1 WHERE min_days IS NULL;
