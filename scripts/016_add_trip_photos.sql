-- Add photo columns for courses, single and double occupancy rooms
ALTER TABLE trips ADD COLUMN IF NOT EXISTS courses_photo_url TEXT;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS single_room_photo_url TEXT;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS double_room_photo_url TEXT;

-- Add comments
COMMENT ON COLUMN trips.courses_photo_url IS 'Photo URL for golf courses';
COMMENT ON COLUMN trips.single_room_photo_url IS 'Photo URL for single occupancy room';
COMMENT ON COLUMN trips.double_room_photo_url IS 'Photo URL for double occupancy room';
