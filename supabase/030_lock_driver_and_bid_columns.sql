-- 030_lock_driver_and_bid_columns.sql
--
-- Third and fourth instances of the pattern fixed in 020 (users) and 028 (jobs):
-- an RLS policy grants UPDATE on a row, and RLS cannot constrain which columns
-- change, so the owner can rewrite server-managed fields.
--
-- === drivers ===
-- Policy: USING ((id = auth.uid()) OR is_admin()), no WITH CHECK.
--
-- A driver could therefore set their own `status` to 'approved' and fill in
-- approved_at/approved_by, skipping admin vetting entirely — no CIN check, no
-- licence check, no insurance check — and then bid on jobs and take possession
-- of customers' goods. Verified against the live database (rolled back): a
-- driver session moved their own row 'approved' -> 'pending' -> 'approved'.
--
-- Drivers keep control of what they legitimately supply: vehicle details and
-- their own document uploads.
--
-- Note for later: editing documents or vehicle details after approval arguably
-- ought to send the driver back to 'pending' for re-verification. That is a
-- product decision, deliberately not made here.
--
-- === bids ===
-- Policy: USING ((driver_id = auth.uid()) OR check_is_client(job_id, auth.uid())
--                OR is_admin()) WITH CHECK (...).
--
-- The WITH CHECK does stop a client rewriting a driver's bid (verified: blocked).
-- It does not stop the driver: a driver could change `amount` on their own bid
-- after it was accepted. Verified against the live database (rolled back): an
-- accepted bid moved 150.00 -> 99999.00. jobs.accepted_bid_amount is protected
-- by 028, so the payout itself is safe, but a driver could still raise their
-- offer between the client seeing it and accepting it.
--
-- A driver may still revise or withdraw their own bid while it is 'pending' —
-- that is the legitimate use of the policy.

-- ---------------------------------------------------------------- drivers ---
CREATE OR REPLACE FUNCTION public.lock_protected_driver_columns()
RETURNS TRIGGER AS $$
BEGIN
  IF auth.uid() IS NULL OR public.is_admin() THEN
    RETURN NEW;
  END IF;

  NEW.id               := OLD.id;
  NEW.status           := OLD.status;
  NEW.approved_at      := OLD.approved_at;
  NEW.approved_by      := OLD.approved_by;
  NEW.rejection_reason := OLD.rejection_reason;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

REVOKE EXECUTE ON FUNCTION public.lock_protected_driver_columns()
  FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_lock_protected_driver_columns ON public.drivers;
CREATE TRIGGER trg_lock_protected_driver_columns
  BEFORE UPDATE ON public.drivers
  FOR EACH ROW
  EXECUTE FUNCTION public.lock_protected_driver_columns();

-- ------------------------------------------------------------------- bids ---
CREATE OR REPLACE FUNCTION public.lock_protected_bid_columns()
RETURNS TRIGGER AS $$
BEGIN
  IF auth.uid() IS NULL OR public.is_admin() THEN
    RETURN NEW;
  END IF;

  -- Identity is never editable.
  NEW.job_id    := OLD.job_id;
  NEW.driver_id := OLD.driver_id;

  -- The owning driver may withdraw a bid that is still pending. Every other
  -- status transition (acceptance, rejection, expiry) is server-managed.
  IF NOT (auth.uid() = OLD.driver_id
          AND OLD.status = 'pending'
          AND NEW.status IN ('pending', 'withdrawn')) THEN
    NEW.status := OLD.status;
  END IF;

  -- The offer itself is editable only by its driver, and only while pending.
  IF OLD.status IS DISTINCT FROM 'pending' OR auth.uid() IS DISTINCT FROM OLD.driver_id THEN
    NEW.amount                     := OLD.amount;
    NEW.estimated_duration_minutes := OLD.estimated_duration_minutes;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

REVOKE EXECUTE ON FUNCTION public.lock_protected_bid_columns()
  FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_lock_protected_bid_columns ON public.bids;
CREATE TRIGGER trg_lock_protected_bid_columns
  BEFORE UPDATE ON public.bids
  FOR EACH ROW
  EXECUTE FUNCTION public.lock_protected_bid_columns();
