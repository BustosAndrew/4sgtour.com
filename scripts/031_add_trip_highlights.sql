-- Add highlights field to trips table
ALTER TABLE trips ADD COLUMN IF NOT EXISTS highlights TEXT[];

-- Add overview_content for more detailed description
ALTER TABLE trips ADD COLUMN IF NOT EXISTS overview_content TEXT;
