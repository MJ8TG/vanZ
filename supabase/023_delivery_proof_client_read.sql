-- ============================================================================
-- VanZ — 023: let a client read the delivery proof of a job they own
-- ----------------------------------------------------------------------------
-- Context:
--   Delivery photos are uploaded by the driver to the private `delivery-proofs`
--   bucket under their own folder: `{driver_id}/{timestamp}_proof.jpg`.
--   Existing policies (002_rls_policies.sql) allow:
--     • driver  → upload to / read from their own folder
--     • admin   → read all
--   …but the CLIENT who owns the job cannot read the proof, because the object
--   lives in the driver's folder and `delivery-proofs` is not in the
--   authenticated-read allowlist.
--
--   The completion flow stores the object path on the job row
--   (`public.jobs.delivery_photo_url = <object name>`), so we can scope the
--   client's read to exactly the proof of a job they own.
--
-- Run as: Supabase Dashboard → SQL Editor → New query → paste → Run.
--         (Idempotent: safe to re-run.)
-- ============================================================================

DROP POLICY IF EXISTS "storage_read_delivery_proof_client" ON storage.objects;

CREATE POLICY "storage_read_delivery_proof_client" ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'delivery-proofs'
    AND EXISTS (
      SELECT 1
      FROM public.jobs j
      WHERE j.client_id = auth.uid()
        AND j.delivery_photo_url = storage.objects.name
    )
  );

-- ----------------------------------------------------------------------------
-- Verify (optional): as the client, this should now return the object row.
--   SELECT name FROM storage.objects
--   WHERE bucket_id = 'delivery-proofs'
--     AND name = (SELECT delivery_photo_url FROM public.jobs WHERE id = '<job_id>');
-- ============================================================================
