-- 010_fix_storage_urls.sql
-- Migrate existing full public URLs to clean storage paths.
-- This strips the Supabase public URL prefix, leaving only the path
-- that can be used with createSignedUrl().

-- =================================================================
-- DRIVERS TABLE — driver-documents bucket
-- =================================================================

-- cin_front_url
UPDATE public.drivers
SET cin_front_url = regexp_replace(
  cin_front_url,
  '^https?://[^/]+/storage/v1/object/public/driver-documents/',
  ''
)
WHERE cin_front_url IS NOT NULL
  AND cin_front_url LIKE 'http%';

-- cin_back_url
UPDATE public.drivers
SET cin_back_url = regexp_replace(
  cin_back_url,
  '^https?://[^/]+/storage/v1/object/public/driver-documents/',
  ''
)
WHERE cin_back_url IS NOT NULL
  AND cin_back_url LIKE 'http%';

-- vehicle_photo_url
UPDATE public.drivers
SET vehicle_photo_url = regexp_replace(
  vehicle_photo_url,
  '^https?://[^/]+/storage/v1/object/public/driver-documents/',
  ''
)
WHERE vehicle_photo_url IS NOT NULL
  AND vehicle_photo_url LIKE 'http%';

-- doc_carte_grise
UPDATE public.drivers
SET doc_carte_grise = regexp_replace(
  doc_carte_grise,
  '^https?://[^/]+/storage/v1/object/public/driver-documents/',
  ''
)
WHERE doc_carte_grise IS NOT NULL
  AND doc_carte_grise LIKE 'http%';

-- doc_assurance
UPDATE public.drivers
SET doc_assurance = regexp_replace(
  doc_assurance,
  '^https?://[^/]+/storage/v1/object/public/driver-documents/',
  ''
)
WHERE doc_assurance IS NOT NULL
  AND doc_assurance LIKE 'http%';

-- doc_permis
UPDATE public.drivers
SET doc_permis = regexp_replace(
  doc_permis,
  '^https?://[^/]+/storage/v1/object/public/driver-documents/',
  ''
)
WHERE doc_permis IS NOT NULL
  AND doc_permis LIKE 'http%';

-- doc_visite_technique
UPDATE public.drivers
SET doc_visite_technique = regexp_replace(
  doc_visite_technique,
  '^https?://[^/]+/storage/v1/object/public/driver-documents/',
  ''
)
WHERE doc_visite_technique IS NOT NULL
  AND doc_visite_technique LIKE 'http%';

-- =================================================================
-- JOBS TABLE — documents bucket (delivery proof photos)
-- =================================================================

UPDATE public.jobs
SET delivery_photo_url = regexp_replace(
  delivery_photo_url,
  '^https?://[^/]+/storage/v1/object/public/documents/',
  ''
)
WHERE delivery_photo_url IS NOT NULL
  AND delivery_photo_url LIKE 'http%';
