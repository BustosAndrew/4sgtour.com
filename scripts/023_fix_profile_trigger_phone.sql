create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name, user_type, phone)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'display_name', new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'user_type', 'regular'),
    -- Pull phone from metadata or auth.users.phone field
    coalesce(new.phone, new.raw_user_meta_data ->> 'phone')
  )
  on conflict (id) do update set
    display_name = coalesce(excluded.display_name, profiles.display_name),
    phone = coalesce(excluded.phone, profiles.phone);

  return new;
end;
$$;
