-- Create bookings table
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  trip_id uuid not null references public.trips(id) on delete cascade,
  start_date date not null,
  end_date date not null,
  num_guests integer not null default 1,
  room_type text not null check (room_type in ('single', 'double')),
  selected_courses jsonb default '[]'::jsonb,
  num_rounds integer not null default 2,
  includes_breakfast boolean default true,
  includes_transport boolean default true,
  additional_requests text,
  total_price numeric(10, 2) not null,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'cancelled')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.bookings enable row level security;

-- Users can view their own bookings
create policy "bookings_select_own"
  on public.bookings for select
  using (auth.uid() = user_id);

-- Users can insert their own bookings
create policy "bookings_insert_own"
  on public.bookings for insert
  with check (auth.uid() = user_id);

-- Users can update their own bookings
create policy "bookings_update_own"
  on public.bookings for update
  using (auth.uid() = user_id);

-- Admins can view all bookings
create policy "bookings_select_admin"
  on public.bookings for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and user_type = 'admin'
    )
  );

-- Admins can update all bookings
create policy "bookings_update_admin"
  on public.bookings for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and user_type = 'admin'
    )
  );
