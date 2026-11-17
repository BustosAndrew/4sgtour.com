-- 057: stop signed-in users from making themselves admin.
--
-- `profiles_update_own` (040) is `USING (id = auth.uid()) WITH CHECK (id =
-- auth.uid())` with no column restriction, and `profiles_insert_own` lets a
-- user insert their own row. 008's comment says "(except user_type)" but
-- nothing enforces it. Per the scripts, any signed-in user can therefore run,
-- from the browser with the public anon key and their own session:
--
--   supabase.from('profiles').update({ user_type: 'admin' }).eq('id', myId)
--
-- and pass every `getUserType() === 'admin'` check and every admin RLS policy.
--
-- CHECK FIRST (read-only) whether something already blocks it — a trigger or a
-- column grant may have been added by hand in the SQL editor:
--
--   SELECT tgname, pg_get_triggerdef(oid) FROM pg_trigger
--   WHERE tgrelid = 'public.profiles'::regclass AND NOT tgisinternal;
--
--   SELECT grantee, privilege_type, column_name
--   FROM information_schema.column_privileges
--   WHERE table_name = 'profiles' AND column_name = 'user_type'
--     AND grantee IN ('authenticated', 'anon');
--
-- Independent of 056 and of any code deploy; safe to run at any time.

CREATE OR REPLACE FUNCTION public.prevent_self_promotion_to_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- No end-user JWT: service role (webhook, cron), the SQL editor, and the
  -- auth sign-up trigger. Those are trusted.
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  -- Existing admins may still change anyone's role (profiles_update_admin).
  IF EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND user_type = 'admin'
  ) THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' AND NEW.user_type = 'admin' THEN
    RAISE EXCEPTION 'Not allowed to create an admin profile'
      USING ERRCODE = '42501';
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.user_type IS DISTINCT FROM OLD.user_type THEN
    RAISE EXCEPTION 'Not allowed to change user_type'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_self_promotion_to_admin ON public.profiles;
CREATE TRIGGER prevent_self_promotion_to_admin
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_self_promotion_to_admin();
