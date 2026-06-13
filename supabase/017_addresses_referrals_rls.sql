-- 017_addresses_referrals_rls.sql
-- RLS for public.saved_addresses and public.referrals.
-- RLS is enabled on all public tables by 002_rls_policies.sql, but neither of
-- these had a policy, so authenticated users could not read or manage their own
-- rows. These policies back the mobile "Mes adresses" and "Parrainage" screens.

-- ----- saved_addresses: full ownership over own rows -----
-- FOR ALL with USING also governs INSERT/UPDATE checks when WITH CHECK is set.
DROP POLICY IF EXISTS "saved_addresses_own" ON public.saved_addresses;
CREATE POLICY "saved_addresses_own" ON public.saved_addresses
  FOR ALL
  USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid());

-- ----- referrals: a user can read referrals they are part of -----
DROP POLICY IF EXISTS "referrals_read_involved" ON public.referrals;
CREATE POLICY "referrals_read_involved" ON public.referrals
  FOR SELECT
  USING (referrer_id = auth.uid() OR referred_id = auth.uid() OR public.is_admin());

-- Note: referral rows are created server-side (signup flow / service role),
-- which bypasses RLS, so no INSERT policy is granted to end users.
