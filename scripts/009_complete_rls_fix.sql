-- Complete RLS Policy Fix - Removes all dependencies and recreates simplified policies
-- This script fixes the infinite recursion error by using simple, non-recursive policies

-- Step 1: Drop all existing policies that might depend on is_admin()
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;

DROP POLICY IF EXISTS "destinations_select_all" ON public.destinations;
DROP POLICY IF EXISTS "destinations_modify_admin" ON public.destinations;

DROP POLICY IF EXISTS "trips_select_all" ON public.trips;
DROP POLICY IF EXISTS "trips_modify_admin" ON public.trips;

DROP POLICY IF EXISTS "trip_images_select_all" ON public.trip_images;
DROP POLICY IF EXISTS "trip_images_modify_admin" ON public.trip_images;

DROP POLICY IF EXISTS "bookings_select_own" ON public.bookings;
DROP POLICY IF EXISTS "bookings_select_admin" ON public.bookings;
DROP POLICY IF EXISTS "bookings_insert_authenticated" ON public.bookings;
DROP POLICY IF EXISTS "bookings_update_own" ON public.bookings;
DROP POLICY IF EXISTS "bookings_update_admin" ON public.bookings;

DROP POLICY IF EXISTS "favorites_select_own" ON public.favorites;
DROP POLICY IF EXISTS "favorites_insert_own" ON public.favorites;
DROP POLICY IF EXISTS "favorites_delete_own" ON public.favorites;

-- Step 2: Now we can safely drop the function
DROP FUNCTION IF EXISTS public.is_admin();

-- Step 3: Create new simplified policies without recursion

-- Profiles: Users can only see and update their own profile
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Destinations: Public read access (no auth required for browsing)
CREATE POLICY "destinations_select_all"
  ON public.destinations FOR SELECT
  USING (true);

-- Trips: Public read access (no auth required for browsing)
CREATE POLICY "trips_select_all"
  ON public.trips FOR SELECT
  USING (true);

-- Trip Images: Public read access
CREATE POLICY "trip_images_select_all"
  ON public.trip_images FOR SELECT
  USING (true);

-- Bookings: Users can see and manage their own bookings
CREATE POLICY "bookings_select_own"
  ON public.bookings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "bookings_insert_authenticated"
  ON public.bookings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "bookings_update_own"
  ON public.bookings FOR UPDATE
  USING (auth.uid() = user_id);

-- Favorites: Users can manage their own favorites
CREATE POLICY "favorites_select_own"
  ON public.favorites FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "favorites_insert_own"
  ON public.favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "favorites_delete_own"
  ON public.favorites FOR DELETE
  USING (auth.uid() = user_id);

-- Note: Admin access control is now handled in the application layer
-- This prevents infinite recursion and is more maintainable
