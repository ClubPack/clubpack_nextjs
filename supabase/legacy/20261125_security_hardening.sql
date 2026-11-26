-- Applied to production 2026-11-25 (security_hardening_waivers_leads_functions + pin_function_search_path).

-- waiver_submissions: replace permissive policies, enable RLS
DROP POLICY IF EXISTS "Allow all operations" ON public.waiver_submissions;
DROP POLICY IF EXISTS "Users can delete waiver submissions for their club" ON public.waiver_submissions;
DROP POLICY IF EXISTS "Users can insert waiver submissions for their club" ON public.waiver_submissions;
DROP POLICY IF EXISTS "Users can update waiver submissions for their club" ON public.waiver_submissions;
DROP POLICY IF EXISTS "Users can view waiver submissions for their club" ON public.waiver_submissions;

ALTER TABLE public.waiver_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY waiver_submissions_admin_all ON public.waiver_submissions
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles p
                 WHERE p.id = auth.uid() AND p.role = 'admin' AND p.club_id = waiver_submissions.club_id))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p
                 WHERE p.id = auth.uid() AND p.role = 'admin' AND p.club_id = waiver_submissions.club_id));

CREATE POLICY waiver_submissions_member_select ON public.waiver_submissions
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.memberships m
                 WHERE m.id = waiver_submissions.membership_id AND m.club_id = waiver_submissions.club_id AND m.auth_user_id = auth.uid()));

CREATE POLICY waiver_submissions_member_insert ON public.waiver_submissions
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.memberships m
                 WHERE m.id = waiver_submissions.membership_id AND m.club_id = waiver_submissions.club_id AND m.auth_user_id = auth.uid()));

-- tour_leads: no client reads
DROP POLICY IF EXISTS tour_leads_select_authenticated ON public.tour_leads;

-- trigger / orphan functions should not be callable over the API
REVOKE EXECUTE ON FUNCTION public.create_waiver_settings_for_club() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.insert_default_club_settings() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_event_created() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_event_deleted() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_member_joined() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_analytics_session(uuid, uuid, uuid) FROM PUBLIC, anon, authenticated;

-- pin search_path on all public functions that lacked one
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prokind = 'f'
      AND NOT EXISTS (SELECT 1 FROM unnest(coalesce(p.proconfig, '{}')) c WHERE c LIKE 'search_path=%')
      AND NOT EXISTS (SELECT 1 FROM pg_depend d WHERE d.objid = p.oid AND d.deptype = 'e')
  LOOP
    EXECUTE format('ALTER FUNCTION %s SET search_path = public, pg_temp', r.sig);
  END LOOP;
END $$;
