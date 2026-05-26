-- Trigger function to limit concurrently active jobs to 2 per client
CREATE OR REPLACE FUNCTION public.check_active_jobs_limit()
RETURNS TRIGGER AS $$
DECLARE
  v_active_count integer;
BEGIN
  SELECT count(*) INTO v_active_count
  FROM public.jobs
  WHERE client_id = NEW.client_id
    AND status IN ('open', 'payment_pending', 'matched', 'in_progress');

  IF v_active_count >= 2 THEN
    RAISE EXCEPTION 'Vous ne pouvez pas avoir plus de 2 missions actives en même temps.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_limit_active_jobs ON public.jobs;
CREATE TRIGGER trg_limit_active_jobs
BEFORE INSERT ON public.jobs
FOR EACH ROW EXECUTE FUNCTION public.check_active_jobs_limit();
