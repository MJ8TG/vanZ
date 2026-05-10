CREATE TABLE IF NOT EXISTS public.driver_location_history (
  id bigserial PRIMARY KEY,
  driver_id uuid REFERENCES public.drivers(id) ON DELETE CASCADE,
  job_id uuid REFERENCES public.jobs(id) ON DELETE SET NULL,
  lat numeric(10,8) NOT NULL,
  lng numeric(11,8) NOT NULL,
  heading numeric(5,2),
  speed numeric(5,2),
  recorded_at timestamp with time zone DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_driver_location_history_driver ON public.driver_location_history (driver_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_driver_location_history_job ON public.driver_location_history (job_id, recorded_at);

-- Set up RLS for driver_location_history
ALTER TABLE public.driver_location_history ENABLE ROW LEVEL SECURITY;

-- Drivers can insert their own history
CREATE POLICY "drivers_insert_own_history" ON public.driver_location_history
  FOR INSERT WITH CHECK (auth.uid() = driver_id);

-- Admins can read all history
CREATE POLICY "admin_read_all_history" ON public.driver_location_history
  FOR SELECT USING (public.is_admin());

-- Optional: auto-prune older than 90 days via pg_cron
-- Assuming pg_cron is enabled in the database, otherwise this will fail silently or loudly.
-- Let's wrap in DO block to avoid failure if pg_cron isn't loaded.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.schedule(
      'driver-location-history-prune',
      '0 3 * * *',
      'DELETE FROM public.driver_location_history WHERE recorded_at < now() - interval ''90 days'';'
    );
  END IF;
END $$;
