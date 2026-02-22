-- Migration: Merge single_room_photo_url and double_room_photo_url into room_photo_url
-- Keeps whichever photo exists (prefers double, falls back to single)

ALTER TABLE trips ADD COLUMN IF NOT EXISTS room_photo_url text;

UPDATE trips
SET room_photo_url = COALESCE(double_room_photo_url, single_room_photo_url);

ALTER TABLE trips DROP COLUMN IF EXISTS single_room_photo_url;
ALTER TABLE trips DROP COLUMN IF EXISTS double_room_photo_url;
