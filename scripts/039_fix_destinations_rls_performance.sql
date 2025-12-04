-- Fix RLS performance for destinations table
-- Replace auth.uid() with (select auth.uid()) to prevent re-evaluation per row

-- Drop existing policies
drop policy if exists "destinations_insert_admin" on public.destinations;
drop policy if exists "destinations_update_admin" on public.destinations;
drop policy if exists "destinations_delete_admin" on public.destinations;

-- Recreate policies with optimized auth function calls
create policy "destinations_insert_admin"
  on public.destinations for insert
  with check (
    exists (
      select 1 from public.profiles
      where id = (select auth.uid()) and user_type = 'admin'
    )
  );

create policy "destinations_update_admin"
  on public.destinations for update
  using (
    exists (
      select 1 from public.profiles
      where id = (select auth.uid()) and user_type = 'admin'
    )
  );

create policy "destinations_delete_admin"
  on public.destinations for delete
  using (
    exists (
      select 1 from public.profiles
      where id = (select auth.uid()) and user_type = 'admin'
    )
  );
