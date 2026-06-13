-- 016_notifications_rls.sql
-- RLS + realtime for public.notifications.
-- RLS is already enabled on all public tables by 002_rls_policies.sql, but no
-- policy existed for notifications, so authenticated users could neither read
-- nor mark their own notifications. These policies fix the mobile/web
-- Notifications screens.

-- A user can read their own notifications (admins can read all).
DROP POLICY IF EXISTS "notifications_read_own" ON public.notifications;
CREATE POLICY "notifications_read_own" ON public.notifications
  FOR SELECT USING (user_id = auth.uid() OR public.is_admin());

-- A user can update their own notifications (used to set read_at).
DROP POLICY IF EXISTS "notifications_update_own" ON public.notifications;
CREATE POLICY "notifications_update_own" ON public.notifications
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Note: INSERTs are performed server-side (service role / Edge Functions),
-- which bypass RLS, so no INSERT policy is granted to end users.

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
