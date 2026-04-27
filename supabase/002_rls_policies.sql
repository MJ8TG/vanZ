-- ═══════════════════════════════════════════════════════════════
-- VanZ — Row Level Security (RLS) & Storage Policies
-- ═══════════════════════════════════════════════════════════════

-- 1. Enable RLS on all Public Tables
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'ALTER TABLE public.' || quote_ident(r.tablename) || ' ENABLE ROW LEVEL SECURITY;';
    END LOOP;
END $$;

-- 2. Global Admin Helper
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE id = auth.uid()
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- ──────────────────────────────────────────
-- USERS & PROFILES
-- ──────────────────────────────────────────

DROP POLICY IF EXISTS "users_read_own_or_admin" ON public.users;
CREATE POLICY "users_read_own_or_admin" ON public.users
  FOR SELECT USING (auth.uid() = id OR public.is_admin());

-- Vue publique pour les infos non-sensibles
CREATE OR REPLACE VIEW public.users_public AS
  SELECT id, first_name, last_name, cached_rating, total_reviews, role, city
  FROM public.users
  WHERE account_status = 'active';

GRANT SELECT ON public.users_public TO anon, authenticated;

DROP POLICY IF EXISTS "users_update_own" ON public.users;
CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "drivers_read_approved_or_self" ON public.drivers;
CREATE POLICY "drivers_read_approved_or_self" ON public.drivers
  FOR SELECT USING (status = 'approved' OR id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "drivers_upsert_own" ON public.drivers;
CREATE POLICY "drivers_upsert_own" ON public.drivers
  FOR ALL USING (id = auth.uid() OR public.is_admin());

-- ──────────────────────────────────────────
-- JOBS & BIDS
-- ──────────────────────────────────────────

DROP POLICY IF EXISTS "jobs_read_all" ON public.jobs;
CREATE POLICY "jobs_read_all" ON public.jobs
  FOR SELECT USING (
    client_id = auth.uid() 
    OR status = 'open' 
    OR public.is_admin()
    OR EXISTS (SELECT 1 FROM public.bids WHERE job_id = jobs.id AND driver_id = auth.uid())
  );

DROP POLICY IF EXISTS "jobs_insert_client" ON public.jobs;
CREATE POLICY "jobs_insert_client" ON public.jobs
  FOR INSERT WITH CHECK (client_id = auth.uid());

DROP POLICY IF EXISTS "bids_read_involved" ON public.bids;
CREATE POLICY "bids_read_involved" ON public.bids
  FOR SELECT USING (
    driver_id = auth.uid() 
    OR EXISTS (SELECT 1 FROM public.jobs WHERE id = bids.job_id AND client_id = auth.uid())
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "bids_insert_driver" ON public.bids;
CREATE POLICY "bids_insert_driver" ON public.bids
  FOR INSERT WITH CHECK (driver_id = auth.uid());

-- ──────────────────────────────────────────
-- CHAT & MESSAGING
-- ──────────────────────────────────────────

DROP POLICY IF EXISTS "conversations_access" ON public.conversations;
CREATE POLICY "conversations_access" ON public.conversations
  FOR SELECT USING (client_id = auth.uid() OR driver_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "messages_access" ON public.messages;
CREATE POLICY "messages_access" ON public.messages
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = messages.conversation_id AND (c.client_id = auth.uid() OR c.driver_id = auth.uid()))
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "messages_send" ON public.messages;
CREATE POLICY "messages_send" ON public.messages
  FOR INSERT WITH CHECK (sender_id = auth.uid());

-- ──────────────────────────────────────────
-- STORAGE BUCKETS
-- ──────────────────────────────────────────

-- Ensure buckets exist
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('driver-documents', 'driver-documents', false),
  ('job-photos', 'job-photos', false),
  ('delivery-proofs', 'delivery-proofs', false),
  ('chat-media', 'chat-media', false),
  ('dispute-photos', 'dispute-photos', false)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies: Path-based security (folder = auth.uid)
DROP POLICY IF EXISTS "storage_upload_own_folder" ON storage.objects;
CREATE POLICY "storage_upload_own_folder" ON storage.objects
  FOR INSERT WITH CHECK (auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "storage_read_own_or_admin" ON storage.objects;
CREATE POLICY "storage_read_own_or_admin" ON storage.objects
  FOR SELECT USING (
    auth.uid()::text = (storage.foldername(name))[1] 
    OR public.is_admin()
    OR bucket_id IN ('job-photos', 'chat-media') -- Allow participants to see job/chat media
  );

-- ──────────────────────────────────────────
-- ADMIN PANELS
-- ──────────────────────────────────────────

DROP POLICY IF EXISTS "admin_only_access" ON public.admin_actions;
CREATE POLICY "admin_only_access" ON public.admin_actions
  FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "admin_users_read" ON public.admin_users;
CREATE POLICY "admin_users_read" ON public.admin_users
  FOR SELECT USING (id = auth.uid() OR public.is_admin());

-- ──────────────────────────────────────────
-- MISC (Reviews, SOS, Reports)
-- ──────────────────────────────────────────

DROP POLICY IF EXISTS "reviews_public_read" ON public.reviews;
CREATE POLICY "reviews_public_read" ON public.reviews FOR SELECT USING (true);

DROP POLICY IF EXISTS "reviews_insert_own" ON public.reviews;
CREATE POLICY "reviews_insert_own" ON public.reviews FOR INSERT WITH CHECK (reviewer_id = auth.uid());

DROP POLICY IF EXISTS "sos_insert_own" ON public.sos_events;
CREATE POLICY "sos_insert_own" ON public.sos_events FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "reports_insert_own" ON public.reports;
CREATE POLICY "reports_insert_own" ON public.reports FOR INSERT WITH CHECK (reporter_id = auth.uid());
