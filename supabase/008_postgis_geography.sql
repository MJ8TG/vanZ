-- Generated geography column for jobs pickup
ALTER TABLE public.jobs 
  ADD COLUMN IF NOT EXISTS pickup_geog geography(POINT, 4326)
  GENERATED ALWAYS AS (
    CASE WHEN pickup_lat IS NOT NULL AND pickup_lng IS NOT NULL
    THEN ST_SetSRID(ST_MakePoint(pickup_lng::float, pickup_lat::float), 4326)::geography
    ELSE NULL END
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_jobs_pickup_geog ON public.jobs USING GIST (pickup_geog);

-- Faster radius function using ST_DWithin (uses GIST index)
CREATE OR REPLACE FUNCTION get_jobs_within_radius(
  driver_lat numeric, driver_lng numeric, radius_km numeric
)
RETURNS SETOF public.jobs AS $$
  SELECT *
  FROM public.jobs
  WHERE status = 'open'
    AND pickup_geog IS NOT NULL
    AND ST_DWithin(
      pickup_geog,
      ST_SetSRID(ST_MakePoint(driver_lng::float, driver_lat::float), 4326)::geography,
      radius_km * 1000
    );
$$ LANGUAGE sql STABLE SECURITY INVOKER;
