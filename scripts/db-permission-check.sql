-- db-permission-check.sql
--
-- Asserts the authorization invariants that protect money movement. Run with:
--
--   psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f scripts/db-permission-check.sql
--
-- Any violation raises, so psql exits non-zero and CI fails.
--
-- This exists because the invariant has already been broken once without anyone
-- noticing: revoke_anon_execute_and_fix_rls (2026-04-28) revoked these grants,
-- and atomic_helpers_force (2026-06-07) re-created the functions, silently
-- resetting their ACLs to the default PUBLIC EXECUTE. A DROP resets a function's
-- ACL; CREATE OR REPLACE preserves it. This check makes that class of regression
-- fail loudly instead of shipping.

DO $$
DECLARE
  r            record;
  v_failures   text[] := '{}';
  -- Functions that move money or points. None may be reachable from a client.
  v_protected  text[] := ARRAY[
    'public.increment_credit_balance(uuid,numeric)',
    'public.increment_loyalty_points(uuid,integer)',
    'public.try_use_promo(text,uuid,numeric)',
    'public.complete_job_atomic(uuid,numeric,numeric)',
    'public.apply_wallet_adjustment(uuid,numeric,text,uuid,text)',
    'public.apply_loyalty_award(uuid,integer,text,uuid)',
    'public.auto_cancel_stale_payments()',
    'public.approve_withdrawal(uuid,uuid)'
  ];
  v_sig        text;
BEGIN
  ----------------------------------------------------------------------------
  -- 1. No client-facing role may execute a money function.
  ----------------------------------------------------------------------------
  FOREACH v_sig IN ARRAY v_protected LOOP
    IF has_function_privilege('anon', v_sig, 'EXECUTE') THEN
      v_failures := v_failures || format('anon can EXECUTE %s', v_sig);
    END IF;

    IF has_function_privilege('authenticated', v_sig, 'EXECUTE') THEN
      v_failures := v_failures || format('authenticated can EXECUTE %s', v_sig);
    END IF;

    -- The server still has to be able to do its job.
    IF NOT has_function_privilege('service_role', v_sig, 'EXECUTE') THEN
      v_failures := v_failures || format('service_role CANNOT execute %s', v_sig);
    END IF;
  END LOOP;

  ----------------------------------------------------------------------------
  -- 2. Column-lock triggers must be present and enabled.
  ----------------------------------------------------------------------------
  FOR r IN
    SELECT t.expected_table, t.expected_trigger
    FROM (VALUES
      ('users',   'trg_lock_protected_user_columns'),
      ('jobs',    'trg_lock_protected_job_columns'),
      ('drivers', 'trg_lock_protected_driver_columns'),
      ('bids',    'trg_lock_protected_bid_columns')
    ) AS t(expected_table, expected_trigger)
  LOOP
    IF NOT EXISTS (
      SELECT 1
      FROM pg_trigger tg
      JOIN pg_class c ON c.oid = tg.tgrelid
      WHERE NOT tg.tgisinternal
        AND c.relname  = r.expected_table
        AND tg.tgname  = r.expected_trigger
        AND tg.tgenabled = 'O'
    ) THEN
      v_failures := v_failures || format('trigger %s missing or disabled on %s',
                                         r.expected_trigger, r.expected_table);
    END IF;
  END LOOP;

  ----------------------------------------------------------------------------
  -- 3. SECURITY DEFINER functions must pin search_path.
  ----------------------------------------------------------------------------
  FOR r IN
    SELECT p.proname
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prosecdef
      AND p.proname IN (
        'increment_credit_balance','increment_loyalty_points','try_use_promo',
        'complete_job_atomic','apply_wallet_adjustment','apply_loyalty_award',
        'auto_cancel_stale_payments','lock_protected_user_columns',
        'lock_protected_job_columns','lock_protected_driver_columns',
        'lock_protected_bid_columns','approve_withdrawal'
      )
      AND (p.proconfig IS NULL
           OR NOT EXISTS (SELECT 1 FROM unnest(p.proconfig) cfg
                          WHERE cfg LIKE 'search_path=%'))
  LOOP
    v_failures := v_failures || format('%s is SECURITY DEFINER without a pinned search_path', r.proname);
  END LOOP;

  ----------------------------------------------------------------------------
  IF array_length(v_failures, 1) > 0 THEN
    RAISE EXCEPTION E'Database permission check FAILED:\n  - %',
      array_to_string(v_failures, E'\n  - ');
  END IF;

  RAISE NOTICE 'Database permission check passed (% functions, 2 triggers).',
    array_length(v_protected, 1);
END $$;
