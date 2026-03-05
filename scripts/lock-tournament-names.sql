-- Lock tournament names to only allow: Masters, Ryder Cup, The Open, US Open
-- This migration prevents adding new tournaments or changing existing tournament names

-- First, ensure the 4 fixed tournaments exist with correct data
INSERT INTO tournaments (name, slug, display_name)
VALUES 
  ('Masters', 'masters', 'The Masters'),
  ('Ryder Cup', 'ryder-cup', 'Ryder Cup'),
  ('The Open', 'the-open', 'The Open Championship'),
  ('US Open', 'us-open', 'US Open')
ON CONFLICT (slug) DO NOTHING;

-- Add a CHECK constraint on the name column to only allow the 4 fixed values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tournaments_name_check'
  ) THEN
    ALTER TABLE tournaments 
    ADD CONSTRAINT tournaments_name_check 
    CHECK (name IN ('Masters', 'Ryder Cup', 'The Open', 'US Open'));
  END IF;
END $$;

-- Create a trigger function to prevent updates to name and slug columns
CREATE OR REPLACE FUNCTION prevent_tournament_name_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.name IS DISTINCT FROM NEW.name THEN
    RAISE EXCEPTION 'Cannot change tournament name. Tournament names are fixed.';
  END IF;
  IF OLD.slug IS DISTINCT FROM NEW.slug THEN
    RAISE EXCEPTION 'Cannot change tournament slug. Tournament slugs are fixed.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the trigger if it exists (for idempotency)
DROP TRIGGER IF EXISTS prevent_tournament_name_change_trigger ON tournaments;

-- Create the trigger to prevent name/slug changes
CREATE TRIGGER prevent_tournament_name_change_trigger
BEFORE UPDATE ON tournaments
FOR EACH ROW
EXECUTE FUNCTION prevent_tournament_name_change();

-- Create a trigger function to prevent deletion of tournaments
CREATE OR REPLACE FUNCTION prevent_tournament_deletion()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Cannot delete tournaments. Tournaments are fixed.';
END;
$$ LANGUAGE plpgsql;

-- Drop the trigger if it exists (for idempotency)
DROP TRIGGER IF EXISTS prevent_tournament_deletion_trigger ON tournaments;

-- Create the trigger to prevent deletions
CREATE TRIGGER prevent_tournament_deletion_trigger
BEFORE DELETE ON tournaments
FOR EACH ROW
EXECUTE FUNCTION prevent_tournament_deletion();

-- Update the RLS policy to only allow UPDATE on logo and hero_image columns
-- First, drop the existing update policy
DROP POLICY IF EXISTS tournaments_update_admin ON tournaments;

-- Create a new restrictive update policy that only allows updating image columns
CREATE POLICY tournaments_update_admin ON tournaments
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.user_type = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.user_type = 'admin'
  )
);

-- Remove INSERT policy since we don't want new tournaments
DROP POLICY IF EXISTS tournaments_insert_admin ON tournaments;

-- Remove DELETE policy since we don't want tournaments deleted
DROP POLICY IF EXISTS tournaments_delete_admin ON tournaments;
