-- API access keys for third-party partners (requested by Tiger Booking).
--
-- A key is shown to the admin exactly once, at creation. Only a SHA-256 hash
-- of it is stored, so a dump of this table cannot be replayed against the API.
-- `key_prefix` holds the first characters of the key purely so a human can tell
-- two keys apart in the admin UI.
--
-- Revoking is a soft delete (`revoked_at`): the row stays so `last_used_at` and
-- the audit trail survive, and the public endpoint rejects any key whose
-- `revoked_at` is not null.

create table if not exists public.api_keys (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  key_prefix text not null,
  key_hash text not null unique,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  last_used_at timestamptz,
  revoked_at timestamptz
);

-- Every authenticated API request is a lookup by hash.
create index if not exists idx_api_keys_key_hash on public.api_keys (key_hash);
create index if not exists idx_api_keys_created_at on public.api_keys (created_at desc);

alter table public.api_keys enable row level security;

-- Admin-only, all four verbs. There is deliberately no policy for anon or
-- ordinary authenticated users: the public API route verifies bearer tokens
-- with the service-role client, which bypasses RLS, so nothing else ever needs
-- to read `key_hash`.
create policy "Admins can read api keys" on public.api_keys
  for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.user_type = 'admin'
    )
  );

create policy "Admins can create api keys" on public.api_keys
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.user_type = 'admin'
    )
  );

create policy "Admins can update api keys" on public.api_keys
  for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.user_type = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.user_type = 'admin'
    )
  );

create policy "Admins can delete api keys" on public.api_keys
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.user_type = 'admin'
    )
  );

comment on table public.api_keys is
  'Bearer tokens for third-party read access to the public API (/api/v1/*). Only the SHA-256 hash of each key is stored.';
comment on column public.api_keys.key_prefix is
  'First characters of the key, e.g. 4sg_live_ab12cd34. Display only, so admins can identify a key they can no longer see in full.';
comment on column public.api_keys.revoked_at is
  'Set when an admin revokes the key. Non-null means every request using it is rejected with 401.';
