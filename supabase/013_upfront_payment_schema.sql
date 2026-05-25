-- Migration 013: Upfront Payment & Remove Budget

-- 1. Drop the client_budget column
ALTER TABLE public.jobs DROP COLUMN IF EXISTS client_budget;

-- 2. Update the status check constraint to include 'payment_pending'
-- Postgres doesn't allow easy modification of check constraints, so we drop and recreate.
-- We try to drop common auto-generated names. If it fails, it's safe to ignore or we can manually drop if needed.
DO $$ 
DECLARE
  constraint_name text;
BEGIN
  SELECT conname INTO constraint_name
  FROM pg_constraint
  WHERE conrelid = 'public.jobs'::regclass AND contype = 'c' AND consrc ILIKE '%status%';
  
  IF constraint_name IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.jobs DROP CONSTRAINT ' || constraint_name;
  END IF;
END $$;

ALTER TABLE public.jobs
  ADD CONSTRAINT jobs_status_check 
  CHECK (status IN ('open', 'payment_pending', 'matched', 'in_progress', 'completed', 'cancelled', 'expired'));

-- 3. Create a function to auto-cancel stale payment_pending jobs (> 30 mins)
CREATE OR REPLACE FUNCTION public.auto_cancel_stale_payments()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Revert jobs that have been stuck in payment_pending for over 30 minutes
  -- We set them back to 'open' and clear the accepted_bid_id so other drivers can bid again.
  UPDATE public.jobs
  SET 
    status = 'open',
    accepted_bid_id = NULL,
    commission_rate = 0.15, -- reset to default
    commission_amount = NULL,
    updated_at = NOW()
  WHERE 
    status = 'payment_pending' 
    AND updated_at < NOW() - INTERVAL '30 minutes';
END;
$$;

-- Note: To execute this periodically, you can set up a pg_cron job via the Supabase Dashboard:
-- select cron.schedule('auto_cancel_stale_payments', '*/5 * * * *', 'SELECT public.auto_cancel_stale_payments()');
