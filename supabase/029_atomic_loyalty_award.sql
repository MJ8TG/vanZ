-- 029_atomic_loyalty_award.sql
--
-- Loyalty counterpart to apply_wallet_adjustment (026). Same reasoning: the
-- ledger row and the counter on users must move together or not at all.
--
-- bookingService.completeJob step 7 currently inserts into loyalty_transactions
-- and then calls increment_loyalty_points as two independent statements, neither
-- of which checks its error.
--
-- Server-only: revoked from anon and authenticated, granted to service_role.

CREATE OR REPLACE FUNCTION public.apply_loyalty_award(
  p_user_id uuid,
  p_points  integer,
  p_type    text,
  p_job_id  uuid DEFAULT NULL
)
RETURNS integer AS $$
DECLARE
  v_new_total integer;
BEGIN
  IF p_points IS NULL OR p_points = 0 THEN
    RAISE EXCEPTION 'Loyalty award must be a non-zero number of points';
  END IF;

  IF p_type IS NULL OR btrim(p_type) = '' THEN
    RAISE EXCEPTION 'Loyalty award requires a transaction type';
  END IF;

  PERFORM 1 FROM public.users WHERE id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User % not found', p_user_id;
  END IF;

  INSERT INTO public.loyalty_transactions (user_id, points, type, job_id)
  VALUES (p_user_id, p_points, p_type, p_job_id);

  UPDATE public.users
  SET loyalty_points = COALESCE(loyalty_points, 0) + p_points
  WHERE id = p_user_id
  RETURNING loyalty_points INTO v_new_total;

  RETURN v_new_total;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

REVOKE EXECUTE ON FUNCTION public.apply_loyalty_award(uuid, integer, text, uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.apply_loyalty_award(uuid, integer, text, uuid)
  TO service_role;
