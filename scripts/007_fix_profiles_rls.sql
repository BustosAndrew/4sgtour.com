-- Drop the problematic admin policy that causes infinite recursion
drop policy if exists "profiles_select_admin" on public.profiles;

-- Create a security definer function to check if user is admin
-- This bypasses RLS and prevents infinite recursion
create or replace function public.is_admin()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid() and user_type = 'admin'
  );
end;
$$;

-- Create a new admin policy using the security definer function
create policy "profiles_select_admin"
  on public.profiles for select
  using (public.is_admin());

-- Also allow admins to update any profile
create policy "profiles_update_admin"
  on public.profiles for update
  using (public.is_admin());

-- Allow admins to delete any profile
create policy "profiles_delete_admin"
  on public.profiles for delete
  using (public.is_admin());
