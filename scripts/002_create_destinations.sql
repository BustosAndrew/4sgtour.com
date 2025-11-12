-- Create destinations table
create table if not exists public.destinations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  continent text not null,
  country text not null,
  image_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.destinations enable row level security;

-- Anyone can view destinations
create policy "destinations_select_all"
  on public.destinations for select
  using (true);

-- Only admins can insert/update/delete destinations
create policy "destinations_insert_admin"
  on public.destinations for insert
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and user_type = 'admin'
    )
  );

create policy "destinations_update_admin"
  on public.destinations for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and user_type = 'admin'
    )
  );

create policy "destinations_delete_admin"
  on public.destinations for delete
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and user_type = 'admin'
    )
  );
