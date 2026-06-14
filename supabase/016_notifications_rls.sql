-- 016_notifications_rls.sql
-- SUPERSEDED by 019_rls_reconcile.sql.
--
-- This file originally added own-row RLS for public.notifications plus the
-- realtime publication. The live DB already had equivalent policies created
-- out-of-band, so the canonical RLS for notifications (and the realtime
-- publication add) now lives in 019_rls_reconcile.sql, which is the single
-- source of truth. Run 019; this file is intentionally a no-op kept for
-- numbering/history.
SELECT 1;
