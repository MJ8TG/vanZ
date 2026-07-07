-- ============================================================================
-- VanZ — 024: add core tables to the `supabase_realtime` publication
-- ----------------------------------------------------------------------------
-- Problem found (2026-06-22):
--   Only `public.notifications` was a member of the `supabase_realtime`
--   publication. That means postgres_changes subscriptions on `bids`, `jobs`,
--   and `messages` — including the client bid feed wired through
--   `useRealtimeSync` — SILENTLY NEVER FIRED. Bids only appeared on a manual
--   refetch (screen focus / pull-to-refresh), not in real time.
--
--   RLS is already correct (e.g. bids_select allows the owning client via
--   check_is_client), so once these tables publish their changes, the existing
--   client-side subscriptions start receiving live INSERT/UPDATE events with no
--   app-code change.
--
-- Notes:
--   • `driver_locations` is included for completeness per the realtime plan.
--     Live driver tracking currently rides on Realtime *broadcast*
--     (driverTrackingChannel / LOCATION_UPDATE_EVENT), which does NOT need
--     publication membership — but adding it enables postgres_changes too.
--   • Idempotent: each table is added only if not already a member.
--
-- Run as: Supabase Dashboard → SQL Editor → New query → paste → Run.
-- ============================================================================

DO $$
DECLARE
  tbl text;
  tables text[] := ARRAY['bids', 'jobs', 'messages', 'driver_locations'];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = tbl
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', tbl);
      RAISE NOTICE 'Added public.% to supabase_realtime', tbl;
    ELSE
      RAISE NOTICE 'public.% already in supabase_realtime — skipped', tbl;
    END IF;
  END LOOP;
END $$;

-- ----------------------------------------------------------------------------
-- Verify: should now list bids, driver_locations, jobs, messages, notifications
--   SELECT tablename FROM pg_publication_tables
--   WHERE pubname = 'supabase_realtime' ORDER BY tablename;
-- ============================================================================
