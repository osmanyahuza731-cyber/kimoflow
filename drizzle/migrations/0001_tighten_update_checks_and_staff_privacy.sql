DO $$ DECLARE p record; BEGIN
  FOR p IN SELECT tablename, policyname, qual FROM pg_policies WHERE schemaname='public' AND cmd='UPDATE' AND with_check='true' AND qual IS NOT NULL LOOP
    EXECUTE format('ALTER POLICY %I ON public.%I WITH CHECK (%s)', p.policyname, p.tablename, p.qual);
  END LOOP;
END $$;

DROP POLICY IF EXISTS user_roles_select ON public.user_roles;
CREATE POLICY user_roles_select_own_or_admin ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

-- Profiles: everyone on staff sees names/positions only; contact details stay with self and admins
DROP POLICY IF EXISTS profiles_select_staff ON public.profiles;
CREATE POLICY profiles_select_staff ON public.profiles FOR SELECT TO authenticated USING (public.is_staff(auth.uid()) OR id = auth.uid());
REVOKE SELECT ON public.profiles FROM authenticated, anon;
GRANT SELECT (id, full_name, position, department, employment_status, start_date, avatar_url, is_active, created_at, updated_at) ON public.profiles TO authenticated;

CREATE OR REPLACE FUNCTION public.get_private_profiles()
RETURNS SETOF public.profiles LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT * FROM public.profiles WHERE id = auth.uid() OR public.is_admin(auth.uid()) ORDER BY full_name
$$;
REVOKE ALL ON FUNCTION public.get_private_profiles() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_private_profiles() TO authenticated;