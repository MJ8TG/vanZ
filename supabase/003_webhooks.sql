-- ═══════════════════════════════════════════════════════════════
-- VanZ — Missing Webhooks & Cron Jobs (Edge Functions)
-- Requires Supabase Extensions: pg_net, pg_cron
-- ═══════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 1. Webhook: Referral Reward (Trigger on jobs completed)
CREATE OR REPLACE FUNCTION public.notify_job_completed_referral()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    PERFORM net.http_post(
      url := 'https://hyjagsvunuobarsxrllx.supabase.co/functions/v1/referral-reward',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5amFnc3Z1bnVvYmFyc3hybGx4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDIxMDk2MSwiZXhwIjoyMDg5Nzg2OTYxfQ.Obpv9V8J5iQiDRhClYytL9wg5IHrjjdramWS19nJRLc'
      ),
      body := jsonb_build_object('type', 'UPDATE', 'table', 'jobs', 'record', row_to_json(NEW), 'old_record', row_to_json(OLD))
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_job_completed_referral ON public.jobs;
CREATE TRIGGER trg_job_completed_referral
AFTER UPDATE ON public.jobs
FOR EACH ROW EXECUTE FUNCTION public.notify_job_completed_referral();

-- 1.1 Webhook: Job Completed (Main logic: commission, etc)
CREATE OR REPLACE FUNCTION public.notify_job_completed()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    PERFORM net.http_post(
      url := 'https://hyjagsvunuobarsxrllx.supabase.co/functions/v1/job-completed',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5amFnc3Z1bnVvYmFyc3hybGx4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDIxMDk2MSwiZXhwIjoyMDg5Nzg2OTYxfQ.Obpv9V8J5iQiDRhClYytL9wg5IHrjjdramWS19nJRLc'
      ),
      body := jsonb_build_object('type', 'UPDATE', 'table', 'jobs', 'record', row_to_json(NEW), 'old_record', row_to_json(OLD))
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_job_completed ON public.jobs;
CREATE TRIGGER trg_job_completed
AFTER UPDATE ON public.jobs
FOR EACH ROW EXECUTE FUNCTION public.notify_job_completed();


-- 2. Webhook: Geofence Arrival (Trigger on driver_locations update)
CREATE OR REPLACE FUNCTION public.notify_driver_location_update()
RETURNS TRIGGER AS $$
BEGIN
  -- We only want to trigger this if the driver is actively on a job (job_id is not null)
  IF NEW.job_id IS NOT NULL THEN
    PERFORM net.http_post(
      url := 'https://hyjagsvunuobarsxrllx.supabase.co/functions/v1/geofence-arrival',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5amFnc3Z1bnVvYmFyc3hybGx4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDIxMDk2MSwiZXhwIjoyMDg5Nzg2OTYxfQ.Obpv9V8J5iQiDRhClYytL9wg5IHrjjdramWS19nJRLc'
      ),
      body := jsonb_build_object('type', 'UPDATE', 'table', 'driver_locations', 'record', row_to_json(NEW))
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_driver_location_update ON public.driver_locations;
CREATE TRIGGER trg_driver_location_update
AFTER INSERT OR UPDATE ON public.driver_locations
FOR EACH ROW EXECUTE FUNCTION public.notify_driver_location_update();


-- 3. Cron Job: Job Expiry (Runs every hour)
-- SELECT cron.unschedule('job-expiry-cron');
SELECT cron.schedule(
  'job-expiry-cron',
  '0 * * * *', -- Every hour
  $$
    SELECT net.http_post(
      url := 'https://hyjagsvunuobarsxrllx.supabase.co/functions/v1/job-expiry-cron',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5amFnc3Z1bnVvYmFyc3hybGx4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDIxMDk2MSwiZXhwIjoyMDg5Nzg2OTYxfQ.Obpv9V8J5iQiDRhClYytL9wg5IHrjjdramWS19nJRLc'
      ),
      body := '{}'::jsonb
    );
  $$
);

-- 4. Cron Job: Scheduled Reminders (Runs every 15 minutes)
-- SELECT cron.unschedule('scheduled-reminder-cron');
SELECT cron.schedule(
  'scheduled-reminder-cron',
  '*/15 * * * *', -- Every 15 mins
  $$
    SELECT net.http_post(
      url := 'https://hyjagsvunuobarsxrllx.supabase.co/functions/v1/scheduled-reminder',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5amFnc3Z1bnVvYmFyc3hybGx4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDIxMDk2MSwiZXhwIjoyMDg5Nzg2OTYxfQ.Obpv9V8J5iQiDRhClYytL9wg5IHrjjdramWS19nJRLc'
      ),
      body := '{}'::jsonb
    );
  $$
);

-- 5. Cron Job: Referral Count Reset (Runs at midnight on the 1st of every month)
-- SELECT cron.unschedule('referral-count-reset-cron');
SELECT cron.schedule(
  'referral-count-reset-cron',
  '0 0 1 * *', -- At 00:00 on day-of-month 1
  $$
    SELECT net.http_post(
      url := 'https://hyjagsvunuobarsxrllx.supabase.co/functions/v1/referral-count-reset',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5amFnc3Z1bnVvYmFyc3hybGx4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDIxMDk2MSwiZXhwIjoyMDg5Nzg2OTYxfQ.Obpv9V8J5iQiDRhClYytL9wg5IHrjjdramWS19nJRLc'
      ),
      body := '{}'::jsonb
    );
  $$
);
