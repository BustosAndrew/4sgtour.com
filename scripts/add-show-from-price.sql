-- Add show_from_price boolean column to trips table
ALTER TABLE trips ADD COLUMN IF NOT EXISTS show_from_price boolean DEFAULT false;
