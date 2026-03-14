-- Add localized duration columns to tournament_events
ALTER TABLE tournament_events
  ADD COLUMN IF NOT EXISTS duration_ko text,
  ADD COLUMN IF NOT EXISTS duration_de text;
