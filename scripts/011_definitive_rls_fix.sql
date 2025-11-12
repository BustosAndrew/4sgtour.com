-- Definitive fix for RLS infinite recursion
-- This script removes all problematic policies and creates simple, working ones

-- Step 1: Drop ALL existing policies on profiles table
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'profiles' AND schemaname = 'public')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.profiles CASCADE';
    END LOOP;
END $$;

-- Step 2: Drop the is_admin function if it exists (with CASCADE to remove dependencies)
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;

-- Step 3: Create simple, non-recursive RLS policies
-- Users can read their own profile
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can insert their own profile (for the trigger)
CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Users can delete their own profile
CREATE POLICY "profiles_delete_own"
  ON public.profiles FOR DELETE
  USING (auth.uid() = id);

-- Note: Admin access will be handled in the application layer, not via RLS
-- This prevents infinite recursion and is more maintainable
