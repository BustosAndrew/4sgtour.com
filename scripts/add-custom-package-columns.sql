-- Add columns to support custom packages in inquiries table
-- These columns allow admins to create standalone custom packages with manual pricing

-- Mark inquiries as custom packages (not tied to existing website packages)
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS is_custom_package boolean DEFAULT false;

-- Store custom package description for manually created packages
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS custom_package_description text;

-- Admin-selected date for when the remainder balance is due (if deposit < 100%)
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS remainder_due_date date;

-- Store the deposit percentage used (0-100)
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS deposit_percentage integer DEFAULT 30;
