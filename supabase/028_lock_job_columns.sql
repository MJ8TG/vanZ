-- 028_lock_job_columns.sql
--
-- Mirrors 020_lock_user_columns.sql for public.jobs.
--
-- The `jobs_update` RLS policy is:
--   USING ((client_id = auth.uid()) OR is_admin())   -- and no WITH CHECK
--
-- RLS decides which ROWS a user may update, never which COLUMNS. So any client,
-- using their ordinary session straight from the browser, could update every
-- column of their own job: set `status` to 'completed' without ever paying,
-- rewrite `commission_amount` / `driver_payout` / `accepted_bid_amount`, or
-- reassign `client_id` to hand the row to someone else. The state machine in
-- bookingService.validateStatusTransition is application logic and does not
-- constrain a direct table write.
--
-- This is not hypothetical. All 17 jobs currently in 'completed' reached that
-- state without a single `status_transition -> completed` row in audit_logs,
-- meaning bookingService.completeJob never ran for any of them; they were
-- written directly (the /simulator page does exactly this, see its
-- dbCompleteJob). That is also why wallet_transactions is empty: the payout
-- half of completion never executed.
--
-- Server-side calls (service role, so auth.uid() IS NULL) and admins keep full
-- access, which is how the legitimate API routes continue to work.
--
-- Columns left editable are the ones a client genuinely owns on their own
-- booking: addresses, coordinates, description, photos, stops, capacity,
-- payment method, schedule, service type, insurance, preferred driver.

CREATE OR REPLACE FUNCTION public.lock_protected_job_columns()
RETURNS TRIGGER AS $$
BEGIN
  -- Service role (no end-user JWT) and admins may change anything.
  IF auth.uid() IS NULL OR public.is_admin() THEN
    RETURN NEW;
  END IF;

  -- Ownership: a job cannot be handed to another user.
  NEW.client_id           := OLD.client_id;

  -- Lifecycle state is server-managed and must go through the API routes.
  NEW.status              := OLD.status;

  -- Matching and money.
  NEW.accepted_bid_id     := OLD.accepted_bid_id;
  NEW.accepted_bid_amount := OLD.accepted_bid_amount;
  NEW.commission_rate     := OLD.commission_rate;
  NEW.commission_amount   := OLD.commission_amount;
  NEW.driver_payout       := OLD.driver_payout;
  NEW.paymee_ref          := OLD.paymee_ref;

  -- Proof of delivery: written by the completion route from the driver's upload.
  NEW.delivery_photo_url  := OLD.delivery_photo_url;
  NEW.delivery_photo_lat  := OLD.delivery_photo_lat;
  NEW.delivery_photo_lng  := OLD.delivery_photo_lng;

  -- Cancellation bookkeeping and generated artefacts.
  NEW.cancelled_by        := OLD.cancelled_by;
  NEW.cancel_fee          := OLD.cancel_fee;
  NEW.cancelled_at        := OLD.cancelled_at;
  NEW.receipt_url         := OLD.receipt_url;
  NEW.review_prompted_at  := OLD.review_prompted_at;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

REVOKE EXECUTE ON FUNCTION public.lock_protected_job_columns()
  FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_lock_protected_job_columns ON public.jobs;
CREATE TRIGGER trg_lock_protected_job_columns
  BEFORE UPDATE ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.lock_protected_job_columns();
