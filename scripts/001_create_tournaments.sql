-- Create tournaments table
CREATE TABLE IF NOT EXISTS public.tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  hero_image TEXT,
  logo TEXT,
  object_position TEXT DEFAULT '50% 35%',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- Create tournament_events table
CREATE TABLE IF NOT EXISTS public.tournament_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  location TEXT NOT NULL,
  date TEXT NOT NULL,
  duration TEXT,
  price TEXT,
  image TEXT,
  hero_image TEXT,
  description TEXT[] DEFAULT '{}',
  trip_highlights TEXT[] DEFAULT '{}',
  travel_itinerary TEXT[] DEFAULT '{}',
  includes TEXT[] DEFAULT '{}',
  excludes TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  UNIQUE(tournament_id, slug)
);

-- Create tournament_event_itinerary_days table for day-by-day itinerary
CREATE TABLE IF NOT EXISTS public.tournament_event_itinerary_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.tournament_events(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- Create tournament_event_gallery_images table
CREATE TABLE IF NOT EXISTS public.tournament_event_gallery_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.tournament_events(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  gallery_type TEXT NOT NULL DEFAULT 'primary', -- 'primary' or 'secondary'
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- Create tournament_event_pricing_tiers table
CREATE TABLE IF NOT EXISTS public.tournament_event_pricing_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.tournament_events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price TEXT NOT NULL,
  booking_url TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- Enable RLS on all tables
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_event_itinerary_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_event_gallery_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_event_pricing_tiers ENABLE ROW LEVEL SECURITY;

-- RLS policies for tournaments (public read, admin write)
CREATE POLICY "tournaments_select_all" ON public.tournaments FOR SELECT USING (true);
CREATE POLICY "tournaments_insert_admin" ON public.tournaments FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND user_type = 'admin')
);
CREATE POLICY "tournaments_update_admin" ON public.tournaments FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND user_type = 'admin')
);
CREATE POLICY "tournaments_delete_admin" ON public.tournaments FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND user_type = 'admin')
);

-- RLS policies for tournament_events (public read, admin write)
CREATE POLICY "tournament_events_select_all" ON public.tournament_events FOR SELECT USING (true);
CREATE POLICY "tournament_events_insert_admin" ON public.tournament_events FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND user_type = 'admin')
);
CREATE POLICY "tournament_events_update_admin" ON public.tournament_events FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND user_type = 'admin')
);
CREATE POLICY "tournament_events_delete_admin" ON public.tournament_events FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND user_type = 'admin')
);

-- RLS policies for tournament_event_itinerary_days (public read, admin write)
CREATE POLICY "tournament_event_itinerary_days_select_all" ON public.tournament_event_itinerary_days FOR SELECT USING (true);
CREATE POLICY "tournament_event_itinerary_days_insert_admin" ON public.tournament_event_itinerary_days FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND user_type = 'admin')
);
CREATE POLICY "tournament_event_itinerary_days_update_admin" ON public.tournament_event_itinerary_days FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND user_type = 'admin')
);
CREATE POLICY "tournament_event_itinerary_days_delete_admin" ON public.tournament_event_itinerary_days FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND user_type = 'admin')
);

-- RLS policies for tournament_event_gallery_images (public read, admin write)
CREATE POLICY "tournament_event_gallery_images_select_all" ON public.tournament_event_gallery_images FOR SELECT USING (true);
CREATE POLICY "tournament_event_gallery_images_insert_admin" ON public.tournament_event_gallery_images FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND user_type = 'admin')
);
CREATE POLICY "tournament_event_gallery_images_update_admin" ON public.tournament_event_gallery_images FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND user_type = 'admin')
);
CREATE POLICY "tournament_event_gallery_images_delete_admin" ON public.tournament_event_gallery_images FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND user_type = 'admin')
);

-- RLS policies for tournament_event_pricing_tiers (public read, admin write)
CREATE POLICY "tournament_event_pricing_tiers_select_all" ON public.tournament_event_pricing_tiers FOR SELECT USING (true);
CREATE POLICY "tournament_event_pricing_tiers_insert_admin" ON public.tournament_event_pricing_tiers FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND user_type = 'admin')
);
CREATE POLICY "tournament_event_pricing_tiers_update_admin" ON public.tournament_event_pricing_tiers FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND user_type = 'admin')
);
CREATE POLICY "tournament_event_pricing_tiers_delete_admin" ON public.tournament_event_pricing_tiers FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND user_type = 'admin')
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_tournaments_slug ON public.tournaments(slug);
CREATE INDEX IF NOT EXISTS idx_tournament_events_tournament_id ON public.tournament_events(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_events_slug ON public.tournament_events(slug);
CREATE INDEX IF NOT EXISTS idx_tournament_event_itinerary_days_event_id ON public.tournament_event_itinerary_days(event_id);
CREATE INDEX IF NOT EXISTS idx_tournament_event_gallery_images_event_id ON public.tournament_event_gallery_images(event_id);
CREATE INDEX IF NOT EXISTS idx_tournament_event_pricing_tiers_event_id ON public.tournament_event_pricing_tiers(event_id);
