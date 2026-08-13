-- 025_lock_down_atomic_helpers.sql
--
-- The four helpers in 011_atomic_helpers.sql are SECURITY DEFINER and owned by
-- postgres, so they execute with owner privileges and RLS does not apply to them.
-- They were exposed to the `anon` and `authenticated` roles via PostgREST, letting
-- any holder of the public anon key mint credit or loyalty points for an arbitrary
-- user id.
--
-- This was a regression. Migration `revoke_anon_execute_and_fix_rls` (20260428161044)
-- already revoked these grants; `is_admin` still carries that hardening. Migration
-- `atomic_helpers_force` (20260607010019) then re-created the four helpers, which
-- reset their ACLs to the default PUBLIC EXECUTE.
--
-- Any future migration that drops and re-creates these functions MUST re-assert the
-- grants below in the same file. CREATE OR REPLACE preserves an ACL; DROP does not.
--
-- Safe to apply: every caller is a server-side API route using the service-role
-- client (app/api/jobs/{complete,accept,update-status}/route.ts via
-- lib/services/bookingService.ts). No browser or mobile code calls these directly.

BEGIN;

-- 1. Remove direct API access. These are server-only helpers.
REVOKE EXECUTE ON FUNCTION public.increment_credit_balance(uuid, numeric)
  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_loyalty_points(uuid, integer)
  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.try_use_promo(text, uuid, numeric)
  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.complete_job_atomic(uuid, numeric, numeric)
  FROM PUBLIC, anon, authenticated;

-- 2. Grant only to service_role, which is never exposed to a client.
GRANT EXECUTE ON FUNCTION public.increment_credit_balance(uuid, numeric)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.increment_loyalty_points(uuid, integer)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.try_use_promo(text, uuid, numeric)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.complete_job_atomic(uuid, numeric, numeric)
  TO service_role;

-- 3. Pin search_path so a caller-controlled path cannot resolve these to shadowed
--    objects. Also clears the corresponding Supabase advisor warnings.
ALTER FUNCTION public.increment_credit_balance(uuid, numeric)
  SET search_path = public, pg_temp;
ALTER FUNCTION public.increment_loyalty_points(uuid, integer)
  SET search_path = public, pg_temp;
ALTER FUNCTION public.try_use_promo(text, uuid, numeric)
  SET search_path = public, pg_temp;
ALTER FUNCTION public.complete_job_atomic(uuid, numeric, numeric)
  SET search_path = public, pg_temp;

-- 4. Same treatment for the remaining flagged SECURITY DEFINER functions.
REVOKE EXECUTE ON FUNCTION public.auto_cancel_stale_payments()
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.auto_cancel_stale_payments()
  TO service_role;
ALTER FUNCTION public.auto_cancel_stale_payments()
  SET search_path = public, pg_temp;

ALTER FUNCTION public.check_active_jobs_limit()
  SET search_path = public, pg_temp;
ALTER FUNCTION public.get_jobs_within_radius(numeric, numeric, numeric)
  SET search_path = public, pg_temp;
ALTER FUNCTION public.lock_protected_user_columns()
  SET search_path = public, pg_temp;

COMMIT;
