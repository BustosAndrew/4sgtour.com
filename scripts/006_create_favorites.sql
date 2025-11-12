-- Create favorites table
create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  trip_id uuid not null references public.trips(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, trip_id)
);

-- Enable RLS
alter table public.favorites enable row level security;

-- Users can view their own favorites
create policy "favorites_select_own"
  on public.favorites for select
  using (auth.uid() = user_id);

-- Users can insert their own favorites
create policy "favorites_insert_own"
  on public.favorites for insert
  with check (auth.uid() = user_id);

-- Users can delete their own favorites
create policy "favorites_delete_own"
  on public.favorites for delete
  using (auth.uid() = user_id);
