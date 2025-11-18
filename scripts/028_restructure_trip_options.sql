-- Create a new structured trip_options table to replace dynamic add_ons
-- This table stores the fixed options for each trip

CREATE TABLE IF NOT EXISTS trip_golf_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  course_name VARCHAR(255) NOT NULL,
  price_per_round DECIMAL(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS trip_meal_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  breakfast_included_price DECIMAL(10, 2) DEFAULT 0,
  breakfast_not_included_price DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS trip_transportation_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  private_car_price DECIMAL(10, 2) DEFAULT 0,
  self_drive_price DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_golf_courses_trip_id ON trip_golf_courses(trip_id);
CREATE INDEX IF NOT EXISTS idx_meal_options_trip_id ON trip_meal_options(trip_id);
CREATE INDEX IF NOT EXISTS idx_transportation_options_trip_id ON trip_transportation_options(trip_id);

-- Enable RLS
ALTER TABLE trip_golf_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_meal_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_transportation_options ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Golf courses are viewable by everyone" ON trip_golf_courses
  FOR SELECT USING (true);

CREATE POLICY "Golf courses are insertable by admins" ON trip_golf_courses
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

CREATE POLICY "Golf courses are updatable by admins" ON trip_golf_courses
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

CREATE POLICY "Golf courses are deletable by admins" ON trip_golf_courses
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

-- Repeat RLS policies for meal_options
CREATE POLICY "Meal options are viewable by everyone" ON trip_meal_options
  FOR SELECT USING (true);

CREATE POLICY "Meal options are insertable by admins" ON trip_meal_options
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

CREATE POLICY "Meal options are updatable by admins" ON trip_meal_options
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

CREATE POLICY "Meal options are deletable by admins" ON trip_meal_options
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

-- Repeat RLS policies for transportation_options
CREATE POLICY "Transportation options are viewable by everyone" ON trip_transportation_options
  FOR SELECT USING (true);

CREATE POLICY "Transportation options are insertable by admins" ON trip_transportation_options
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

CREATE POLICY "Transportation options are updatable by admins" ON trip_transportation_options
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

CREATE POLICY "Transportation options are deletable by admins" ON trip_transportation_options
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );
