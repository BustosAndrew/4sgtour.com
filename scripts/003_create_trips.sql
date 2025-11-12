-- Create trips table
create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  destination_id uuid not null references public.destinations(id) on delete cascade,
  title text not null,
  slug text not null unique,
  description text,
  location text not null,
  price_regular numeric(10, 2) not null,
  price_wholesale numeric(10, 2),
  duration_nights integer not null default 3,
  max_guests integer not null default 2,
  includes_breakfast boolean default true,
  includes_transport boolean default true,
  available_courses jsonb default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.trips enable row level security;

-- Anyone can view trips
create policy "trips_select_all"
  on public.trips for select
  using (true);

-- Only admins can insert/update/delete trips
create policy "trips_insert_admin"
  on public.trips for insert
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and user_type = 'admin'
    )
  );

create policy "trips_update_admin"
  on public.trips for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and user_type = 'admin'
    )
  );

create policy "trips_delete_admin"
  on public.trips for delete
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and user_type = 'admin'
    )
  );
