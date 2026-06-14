-- 019_rls_reconcile.sql
-- Canonical RLS for: notifications, saved_addresses, referrals,
-- wallet_transactions, loyalty_transactions.
--
-- WHY THIS FILE EXISTS (repo <-> DB drift):
-- The live database already had correctly-scoped policies on these tables
-- (e.g. `*_select`, `*_insert`) that were created out-of-band and never
-- committed to this repo. Migrations 016/017/018 then added *duplicate*
-- SELECT policies (`*_read_own`, `saved_addresses_own`). RLS policies are
-- permissive (OR-ed), so the duplicates were harmless but messy.
--
-- This file is the SINGLE SOURCE OF TRUTH for these 5 tables' RLS. It drops
-- every previously-known policy name (both the out-of-band ones and the ones
-- added by 016/017/018) and recreates exactly ONE canonical policy per command,
-- preserving the original grants (verified against pg_policies on the live DB):
--   * SELECT  -> own rows (or involved parties for referrals), plus is_admin().
--   * UPDATE  -> own rows (notifications read_at).
--   * INSERT  -> referrals: the referred user; wallet/loyalty: admin only
--               (normal writes happen server-side via the service role, which
--               bypasses RLS entirely).
-- Idempotent: safe to re-run. RLS is already enabled by 002_rls_policies.sql.

-- ============================ notifications ============================
DROP POLICY IF EXISTS "notifications_read_own"   ON public.notifications;
DROP POLICY IF EXISTS "notifications_update_own" ON public.notifications;
DROP POLICY IF EXISTS "notifications_select"     ON public.notifications;
DROP POLICY IF EXISTS "notifications_update"     ON public.notifications;

CREATE POLICY "notifications_select" ON public.notifications
  FOR SELECT USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "notifications_update" ON public.notifications
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
-- INSERT: server-side only (service role bypasses RLS) -> no policy.

-- Ensure realtime delivers INSERTs to the per-user channel used by the app.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
END $$;

-- ============================ saved_addresses ============================
DROP POLICY IF EXISTS "saved_addresses_own"    ON public.saved_addresses;
DROP POLICY IF EXISTS "saved_addresses_select" ON public.saved_addresses;
DROP POLICY IF EXISTS "saved_addresses_insert" ON public.saved_addresses;
DROP POLICY IF EXISTS "saved_addresses_update" ON public.saved_addresses;
DROP POLICY IF EXISTS "saved_addresses_delete" ON public.saved_addresses;

-- One FOR ALL policy covers SELECT/INSERT/UPDATE/DELETE on own rows.
CREATE POLICY "saved_addresses_own" ON public.saved_addresses
  FOR ALL
  USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid());

-- ============================ referrals ============================
DROP POLICY IF EXISTS "referrals_read_involved" ON public.referrals;
DROP POLICY IF EXISTS "referrals_select"        ON public.referrals;
DROP POLICY IF EXISTS "referrals_insert"        ON public.referrals;

CREATE POLICY "referrals_select" ON public.referrals
  FOR SELECT USING (referrer_id = auth.uid() OR referred_id = auth.uid() OR public.is_admin());

-- Preserve the existing self-insert grant (signup also writes via service role).
CREATE POLICY "referrals_insert" ON public.referrals
  FOR INSERT WITH CHECK (referred_id = auth.uid());

-- ============================ wallet_transactions ============================
DROP POLICY IF EXISTS "wallet_transactions_read_own" ON public.wallet_transactions;
DROP POLICY IF EXISTS "wallet_tx_select"             ON public.wallet_transactions;
DROP POLICY IF EXISTS "wallet_tx_insert"             ON public.wallet_transactions;

CREATE POLICY "wallet_transactions_select" ON public.wallet_transactions
  FOR SELECT USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "wallet_transactions_insert" ON public.wallet_transactions
  FOR INSERT WITH CHECK (public.is_admin());

-- ============================ loyalty_transactions ============================
DROP POLICY IF EXISTS "loyalty_transactions_read_own" ON public.loyalty_transactions;
DROP POLICY IF EXISTS "loyalty_tx_select"             ON public.loyalty_transactions;
DROP POLICY IF EXISTS "loyalty_tx_insert"             ON public.loyalty_transactions;

CREATE POLICY "loyalty_transactions_select" ON public.loyalty_transactions
  FOR SELECT USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "loyalty_transactions_insert" ON public.loyalty_transactions
  FOR INSERT WITH CHECK (public.is_admin());
