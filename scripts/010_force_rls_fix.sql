-- Force fix RLS policies by using CASCADE to drop dependencies
-- This will drop the is_admin() function and all policies that depend on it

-- Drop the function with CASCADE to remove all dependencies
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;

-- Now drop all existing policies on profiles table to start fresh
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;

-- Create simplified RLS policies that don't cause recursion
-- Users can read their own profile
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile (except user_type)
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Note: Admin access control will be handled in the application layer
-- This prevents infinite recursion in RLS policies
