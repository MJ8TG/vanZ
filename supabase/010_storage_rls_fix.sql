-- ═══════════════════════════════════════════════════════════════
-- Fix 2 — Storage RLS: Block anonymous read access to job-photos / chat-media
-- ═══════════════════════════════════════════════════════════════
-- The previous policy's third branch (bucket_id IN ('job-photos', 'chat-media'))
-- had no auth.uid() guard, allowing unauthenticated users to read any file in
-- those buckets by guessing the path.

DROP POLICY IF EXISTS "storage_read_own_or_admin" ON storage.objects;

CREATE POLICY "storage_read_own_or_admin" ON storage.objects
  FOR SELECT USING (
    auth.uid()::text = (storage.foldername(name))[1]
    OR public.is_admin()
    OR (
      auth.uid() IS NOT NULL
      AND bucket_id IN ('job-photos', 'chat-media')
    )
  );
