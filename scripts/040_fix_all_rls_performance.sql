-- Fix RLS performance for ALL tables
-- Replace auth.uid() with (select auth.uid()) to prevent re-evaluation per row
-- This significantly improves query performance at scale

-- =====================
-- PROFILES
-- =====================
DROP POLICY IF EXISTS profiles_select_own ON profiles;
DROP POLICY IF EXISTS profiles_insert_own ON profiles;
DROP POLICY IF EXISTS profiles_update_own ON profiles;
DROP POLICY IF EXISTS profiles_delete_own ON profiles;

CREATE POLICY profiles_select_own ON profiles
  FOR SELECT USING (id = (select auth.uid()));

CREATE POLICY profiles_insert_own ON profiles
  FOR INSERT WITH CHECK (id = (select auth.uid()));

CREATE POLICY profiles_update_own ON profiles
  FOR UPDATE USING (id = (select auth.uid()))
  WITH CHECK (id = (select auth.uid()));

CREATE POLICY profiles_delete_own ON profiles
  FOR DELETE USING (id = (select auth.uid()));

-- =====================
-- DESTINATIONS
-- =====================
DROP POLICY IF EXISTS destinations_select_all ON destinations;
DROP POLICY IF EXISTS destinations_insert_admin ON destinations;
DROP POLICY IF EXISTS destinations_update_admin ON destinations;
DROP POLICY IF EXISTS destinations_delete_admin ON destinations;

CREATE POLICY destinations_select_all ON destinations
  FOR SELECT USING (true);

CREATE POLICY destinations_insert_admin ON destinations
  FOR INSERT WITH CHECK (
    exists (
      select 1 from profiles
      where id = (select auth.uid()) and user_type = 'admin'
    )
  );

CREATE POLICY destinations_update_admin ON destinations
  FOR UPDATE USING (
    exists (
      select 1 from profiles
      where id = (select auth.uid()) and user_type = 'admin'
    )
  );

CREATE POLICY destinations_delete_admin ON destinations
  FOR DELETE USING (
    exists (
      select 1 from profiles
      where id = (select auth.uid()) and user_type = 'admin'
    )
  );

-- =====================
-- TRIPS
-- =====================
DROP POLICY IF EXISTS trips_select_all ON trips;
DROP POLICY IF EXISTS trips_insert_admin ON trips;
DROP POLICY IF EXISTS trips_update_admin ON trips;
DROP POLICY IF EXISTS trips_delete_admin ON trips;

CREATE POLICY trips_select_all ON trips
  FOR SELECT USING (true);

CREATE POLICY trips_insert_admin ON trips
  FOR INSERT WITH CHECK (
    exists (
      select 1 from profiles
      where id = (select auth.uid()) and user_type = 'admin'
    )
  );

CREATE POLICY trips_update_admin ON trips
  FOR UPDATE USING (
    exists (
      select 1 from profiles
      where id = (select auth.uid()) and user_type = 'admin'
    )
  );

CREATE POLICY trips_delete_admin ON trips
  FOR DELETE USING (
    exists (
      select 1 from profiles
      where id = (select auth.uid()) and user_type = 'admin'
    )
  );

-- =====================
-- TRIP_IMAGES
-- =====================
DROP POLICY IF EXISTS trip_images_select_all ON trip_images;
DROP POLICY IF EXISTS trip_images_insert_admin ON trip_images;
DROP POLICY IF EXISTS trip_images_update_admin ON trip_images;
DROP POLICY IF EXISTS trip_images_delete_admin ON trip_images;

CREATE POLICY trip_images_select_all ON trip_images
  FOR SELECT USING (true);

CREATE POLICY trip_images_insert_admin ON trip_images
  FOR INSERT WITH CHECK (
    exists (
      select 1 from profiles
      where id = (select auth.uid()) and user_type = 'admin'
    )
  );

CREATE POLICY trip_images_update_admin ON trip_images
  FOR UPDATE USING (
    exists (
      select 1 from profiles
      where id = (select auth.uid()) and user_type = 'admin'
    )
  );

CREATE POLICY trip_images_delete_admin ON trip_images
  FOR DELETE USING (
    exists (
      select 1 from profiles
      where id = (select auth.uid()) and user_type = 'admin'
    )
  );

-- =====================
-- BOOKINGS
-- =====================
DROP POLICY IF EXISTS bookings_select_own ON bookings;
DROP POLICY IF EXISTS bookings_insert_own ON bookings;
DROP POLICY IF EXISTS bookings_insert_authenticated ON bookings;
DROP POLICY IF EXISTS bookings_update_own ON bookings;

CREATE POLICY bookings_select_own ON bookings
  FOR SELECT USING (user_id = (select auth.uid()));

CREATE POLICY bookings_insert_own ON bookings
  FOR INSERT WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY bookings_update_own ON bookings
  FOR UPDATE USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- =====================
-- FAVORITES
-- =====================
DROP POLICY IF EXISTS favorites_select_own ON favorites;
DROP POLICY IF EXISTS favorites_insert_own ON favorites;
DROP POLICY IF EXISTS favorites_delete_own ON favorites;

CREATE POLICY favorites_select_own ON favorites
  FOR SELECT USING (user_id = (select auth.uid()));

CREATE POLICY favorites_insert_own ON favorites
  FOR INSERT WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY favorites_delete_own ON favorites
  FOR DELETE USING (user_id = (select auth.uid()));

-- =====================
-- PACKAGES
-- =====================
DROP POLICY IF EXISTS "Packages are viewable by everyone" ON packages;
DROP POLICY IF EXISTS "Packages are insertable by admins" ON packages;
DROP POLICY IF EXISTS "Packages are updatable by admins" ON packages;
DROP POLICY IF EXISTS "Packages are deletable by admins" ON packages;

CREATE POLICY "Packages are viewable by everyone" ON packages
  FOR SELECT USING (true);

CREATE POLICY "Packages are insertable by admins" ON packages
  FOR INSERT WITH CHECK (
    exists (
      select 1 from profiles
      where profiles.id = (select auth.uid()) and user_type = 'admin'
    )
  );

CREATE POLICY "Packages are updatable by admins" ON packages
  FOR UPDATE USING (
    exists (
      select 1 from profiles
      where profiles.id = (select auth.uid()) and user_type = 'admin'
    )
  );

CREATE POLICY "Packages are deletable by admins" ON packages
  FOR DELETE USING (
    exists (
      select 1 from profiles
      where profiles.id = (select auth.uid()) and user_type = 'admin'
    )
  );

-- =====================
-- ADD_ONS
-- =====================
DROP POLICY IF EXISTS "Add-ons are viewable by everyone" ON add_ons;
DROP POLICY IF EXISTS "Add-ons are insertable by admins" ON add_ons;
DROP POLICY IF EXISTS "Add-ons are updatable by admins" ON add_ons;
DROP POLICY IF EXISTS "Add-ons are deletable by admins" ON add_ons;

CREATE POLICY "Add-ons are viewable by everyone" ON add_ons
  FOR SELECT USING (true);

CREATE POLICY "Add-ons are insertable by admins" ON add_ons
  FOR INSERT WITH CHECK (
    exists (
      select 1 from profiles
      where profiles.id = (select auth.uid()) and user_type = 'admin'
    )
  );

CREATE POLICY "Add-ons are updatable by admins" ON add_ons
  FOR UPDATE USING (
    exists (
      select 1 from profiles
      where profiles.id = (select auth.uid()) and user_type = 'admin'
    )
  );

CREATE POLICY "Add-ons are deletable by admins" ON add_ons
  FOR DELETE USING (
    exists (
      select 1 from profiles
      where profiles.id = (select auth.uid()) and user_type = 'admin'
    )
  );

-- =====================
-- TRIP_GOLF_COURSES
-- =====================
DROP POLICY IF EXISTS "Golf courses are viewable by everyone" ON trip_golf_courses;
DROP POLICY IF EXISTS "Golf courses are insertable by admins" ON trip_golf_courses;
DROP POLICY IF EXISTS "Golf courses are updatable by admins" ON trip_golf_courses;
DROP POLICY IF EXISTS "Golf courses are deletable by admins" ON trip_golf_courses;

CREATE POLICY "Golf courses are viewable by everyone" ON trip_golf_courses
  FOR SELECT USING (true);

CREATE POLICY "Golf courses are insertable by admins" ON trip_golf_courses
  FOR INSERT WITH CHECK (
    exists (
      select 1 from profiles
      where profiles.id = (select auth.uid()) and user_type = 'admin'
    )
  );

CREATE POLICY "Golf courses are updatable by admins" ON trip_golf_courses
  FOR UPDATE USING (
    exists (
      select 1 from profiles
      where profiles.id = (select auth.uid()) and user_type = 'admin'
    )
  );

CREATE POLICY "Golf courses are deletable by admins" ON trip_golf_courses
  FOR DELETE USING (
    exists (
      select 1 from profiles
      where profiles.id = (select auth.uid()) and user_type = 'admin'
    )
  );

-- =====================
-- TRIP_MEAL_OPTIONS
-- =====================
DROP POLICY IF EXISTS "Meal options are viewable by everyone" ON trip_meal_options;
DROP POLICY IF EXISTS "Meal options are insertable by admins" ON trip_meal_options;
DROP POLICY IF EXISTS "Meal options are updatable by admins" ON trip_meal_options;
DROP POLICY IF EXISTS "Meal options are deletable by admins" ON trip_meal_options;

CREATE POLICY "Meal options are viewable by everyone" ON trip_meal_options
  FOR SELECT USING (true);

CREATE POLICY "Meal options are insertable by admins" ON trip_meal_options
  FOR INSERT WITH CHECK (
    exists (
      select 1 from profiles
      where profiles.id = (select auth.uid()) and user_type = 'admin'
    )
  );

CREATE POLICY "Meal options are updatable by admins" ON trip_meal_options
  FOR UPDATE USING (
    exists (
      select 1 from profiles
      where profiles.id = (select auth.uid()) and user_type = 'admin'
    )
  );

CREATE POLICY "Meal options are deletable by admins" ON trip_meal_options
  FOR DELETE USING (
    exists (
      select 1 from profiles
      where profiles.id = (select auth.uid()) and user_type = 'admin'
    )
  );

-- =====================
-- TRIP_TRANSPORTATION_OPTIONS
-- =====================
DROP POLICY IF EXISTS "Transportation options are viewable by everyone" ON trip_transportation_options;
DROP POLICY IF EXISTS "Transportation options are insertable by admins" ON trip_transportation_options;
DROP POLICY IF EXISTS "Transportation options are updatable by admins" ON trip_transportation_options;
DROP POLICY IF EXISTS "Transportation options are deletable by admins" ON trip_transportation_options;

CREATE POLICY "Transportation options are viewable by everyone" ON trip_transportation_options
  FOR SELECT USING (true);

CREATE POLICY "Transportation options are insertable by admins" ON trip_transportation_options
  FOR INSERT WITH CHECK (
    exists (
      select 1 from profiles
      where profiles.id = (select auth.uid()) and user_type = 'admin'
    )
  );

CREATE POLICY "Transportation options are updatable by admins" ON trip_transportation_options
  FOR UPDATE USING (
    exists (
      select 1 from profiles
      where profiles.id = (select auth.uid()) and user_type = 'admin'
    )
  );

CREATE POLICY "Transportation options are deletable by admins" ON trip_transportation_options
  FOR DELETE USING (
    exists (
      select 1 from profiles
      where profiles.id = (select auth.uid()) and user_type = 'admin'
    )
  );

-- =====================
-- INQUIRIES
-- =====================
DROP POLICY IF EXISTS "Allow inquiry creation" ON inquiries;
DROP POLICY IF EXISTS "Users can view own inquiries" ON inquiries;
DROP POLICY IF EXISTS "Admin can view all inquiries" ON inquiries;
DROP POLICY IF EXISTS "Admin can update inquiries" ON inquiries;

CREATE POLICY "Allow inquiry creation" ON inquiries
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view own inquiries" ON inquiries
  FOR SELECT USING (
    customer_email = (
      SELECT email FROM profiles WHERE id = (select auth.uid())
    )
  );

CREATE POLICY "Admin can view all inquiries" ON inquiries
  FOR SELECT USING (
    exists (
      select 1 from profiles
      where profiles.id = (select auth.uid()) and user_type = 'admin'
    )
  );

CREATE POLICY "Admin can update inquiries" ON inquiries
  FOR UPDATE USING (
    exists (
      select 1 from profiles
      where profiles.id = (select auth.uid()) and user_type = 'admin'
    )
  );

-- =====================
-- MESSAGES
-- =====================
DROP POLICY IF EXISTS "Admin can view all messages" ON messages;
DROP POLICY IF EXISTS "Admin can insert messages" ON messages;
DROP POLICY IF EXISTS "Users can view own inquiry messages" ON messages;
DROP POLICY IF EXISTS "Users can send messages for own inquiries" ON messages;
DROP POLICY IF EXISTS "Allow inquiry message creation" ON messages;

CREATE POLICY "Admin can view all messages" ON messages
  FOR SELECT USING (
    exists (
      select 1 from profiles
      where profiles.id = (select auth.uid()) and user_type = 'admin'
    )
  );

CREATE POLICY "Admin can insert messages" ON messages
  FOR INSERT WITH CHECK (
    exists (
      select 1 from profiles
      where profiles.id = (select auth.uid()) and user_type = 'admin'
    )
  );

CREATE POLICY "Users can view own inquiry messages" ON messages
  FOR SELECT USING (
    exists (
      select 1 from inquiries
      where inquiries.id = messages.inquiry_id
      and inquiries.customer_email = (
        SELECT email FROM profiles WHERE id = (select auth.uid())
      )
    )
  );

CREATE POLICY "Users can send messages for own inquiries" ON messages
  FOR INSERT WITH CHECK (
    exists (
      select 1 from inquiries
      where inquiries.id = inquiry_id
      and inquiries.customer_email = (
        SELECT email FROM profiles WHERE id = (select auth.uid())
      )
    )
  );
