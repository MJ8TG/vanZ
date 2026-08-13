-- 027_revoke_trigger_function_execute.sql
--
-- lock_protected_user_columns is a trigger function on public.users, but it was
-- also reachable as an RPC via /rest/v1/rpc/. Triggers fire through the trigger
-- mechanism and do not consult EXECUTE privilege on the invoking role, so
-- removing the grant closes the RPC surface while the trigger keeps working.
--
-- Verified after applying: trg_lock_protected_user_columns on public.users is
-- still enabled, and authenticated can no longer call it as an RPC.

REVOKE EXECUTE ON FUNCTION public.lock_protected_user_columns()
  FROM PUBLIC, anon, authenticated;
