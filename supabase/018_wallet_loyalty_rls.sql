-- 018_wallet_loyalty_rls.sql
-- Own-row read RLS for wallet_transactions and loyalty_transactions.
-- RLS is enabled on all public tables by 002_rls_policies.sql, but neither had
-- a policy, so the driver wallet and the new client wallet/loyalty screens could
-- not read their own rows. Writes are server-side (service role), so no
-- INSERT/UPDATE policy is granted to end users.

DROP POLICY IF EXISTS "wallet_transactions_read_own" ON public.wallet_transactions;
CREATE POLICY "wallet_transactions_read_own" ON public.wallet_transactions
  FOR SELECT USING (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "loyalty_transactions_read_own" ON public.loyalty_transactions;
CREATE POLICY "loyalty_transactions_read_own" ON public.loyalty_transactions
  FOR SELECT USING (user_id = auth.uid() OR public.is_admin());
