-- Update job status enum to match code reality
ALTER TABLE public.jobs DROP CONSTRAINT IF EXISTS jobs_status_check;
ALTER TABLE public.jobs ADD CONSTRAINT jobs_status_check
  CHECK (status IN (
    'open',
    'matched',
    'paid',
    'confirmed',
    'in_progress',
    'arrived_pickup',
    'arrived_dropoff',
    'completed',
    'cancelled',
    'expired'
  ));

-- Optional: index on status for admin filtering
CREATE INDEX IF NOT EXISTS idx_jobs_status ON public.jobs(status);
