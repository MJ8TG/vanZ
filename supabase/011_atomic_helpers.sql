-- 011_atomic_helpers.sql
-- Fix race conditions on promo usage and job completion credits.
-- These SQL functions use FOR UPDATE locks to ensure atomicity.

-- =================================================================
-- 1. Atomic promo application with all checks at SQL level
-- =================================================================

CREATE OR REPLACE FUNCTION public.try_use_promo(
  p_code text,
  p_user_id uuid,
  p_job_amount numeric
)
RETURNS TABLE(success boolean, discount numeric, error_msg text) AS $$
DECLARE
  v_promo public.promo_codes%ROWTYPE;
  v_user_uses int;
  v_discount numeric;
BEGIN
  -- Lock the promo row to prevent concurrent usage
  SELECT * INTO v_promo FROM public.promo_codes
  WHERE code = upper(p_code) AND is_active = true FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 0::numeric, 'Code invalide'::text;
    RETURN;
  END IF;

  IF v_promo.valid_until IS NOT NULL AND v_promo.valid_until < now() THEN
    RETURN QUERY SELECT false, 0::numeric, 'Code expiré'::text;
    RETURN;
  END IF;

  IF v_promo.max_uses IS NOT NULL AND v_promo.current_uses >= v_promo.max_uses THEN
    RETURN QUERY SELECT false, 0::numeric, 'Code épuisé'::text;
    RETURN;
  END IF;

  IF p_job_amount < v_promo.min_job_amount THEN
    RETURN QUERY SELECT false, 0::numeric, format('Minimum %s TND requis', v_promo.min_job_amount)::text;
    RETURN;
  END IF;

  -- Check per-user usage limit
  SELECT count(*) INTO v_user_uses
  FROM public.wallet_transactions
  WHERE user_id = p_user_id AND type = 'promo' AND note = upper(p_code);

  IF v_user_uses >= COALESCE(v_promo.uses_per_user, 1) THEN
    RETURN QUERY SELECT false, 0::numeric, 'Déjà utilisé'::text;
    RETURN;
  END IF;

  -- Calculate discount
  v_discount := CASE
    WHEN v_promo.discount_type = 'fixed' THEN v_promo.discount_value
    ELSE round(p_job_amount * v_promo.discount_value / 100, 2)
  END;
  v_discount := LEAST(v_discount, p_job_amount);

  -- Atomically increment usage counter
  UPDATE public.promo_codes SET current_uses = current_uses + 1 WHERE id = v_promo.id;

  RETURN QUERY SELECT true, v_discount, NULL::text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- =================================================================
-- 2. Atomic job completion: set commission only if not already set
-- =================================================================

CREATE OR REPLACE FUNCTION public.complete_job_atomic(
  p_job_id uuid,
  p_amount numeric,
  p_rate numeric
)
RETURNS TABLE(commission numeric, payout numeric) AS $$
DECLARE
  v_commission numeric;
  v_payout numeric;
BEGIN
  v_commission := round(p_amount * p_rate, 2);
  v_payout := p_amount - v_commission;

  -- Only proceed if commission hasn't been calculated yet (idempotent guard)
  UPDATE public.jobs
  SET commission_amount = v_commission,
      driver_payout = v_payout
  WHERE id = p_job_id AND commission_amount IS NULL;

  IF NOT FOUND THEN
    RETURN; -- Already processed, return empty result set
  END IF;

  RETURN QUERY SELECT v_commission, v_payout;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- =================================================================
-- 3. Atomic credit_balance increment (replaces read-then-write)
-- =================================================================

CREATE OR REPLACE FUNCTION public.increment_credit_balance(
  p_user_id uuid,
  p_amount numeric
)
RETURNS void AS $$
BEGIN
  UPDATE public.users
  SET credit_balance = COALESCE(credit_balance, 0) + p_amount
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- =================================================================
-- 4. Atomic loyalty_points increment
-- =================================================================

CREATE OR REPLACE FUNCTION public.increment_loyalty_points(
  p_user_id uuid,
  p_points integer
)
RETURNS void AS $$
BEGIN
  UPDATE public.users
  SET loyalty_points = COALESCE(loyalty_points, 0) + p_points
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
