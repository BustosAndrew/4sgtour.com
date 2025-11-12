-- Create trip images table
create table if not exists public.trip_images (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  image_url text not null,
  display_order integer not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.trip_images enable row level security;

-- Anyone can view trip images
create policy "trip_images_select_all"
  on public.trip_images for select
  using (true);

-- Only admins can insert/update/delete trip images
create policy "trip_images_insert_admin"
  on public.trip_images for insert
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and user_type = 'admin'
    )
  );

create policy "trip_images_update_admin"
  on public.trip_images for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and user_type = 'admin'
    )
  );

create policy "trip_images_delete_admin"
  on public.trip_images for delete
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and user_type = 'admin'
    )
  );
