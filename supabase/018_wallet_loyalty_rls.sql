-- 018_wallet_loyalty_rls.sql
-- SUPERSEDED by 019_rls_reconcile.sql.
--
-- This file originally added own-row read RLS for public.wallet_transactions
-- and public.loyalty_transactions. The live DB already had equivalent policies
-- created out-of-band, so the canonical RLS for these tables now lives in
-- 019_rls_reconcile.sql, which is the single source of truth. Run 019; this
-- file is intentionally a no-op kept for numbering/history.
SELECT 1;
