-- 026_atomic_wallet_adjustment.sql
--
-- Every balance change must write a ledger row, in the same transaction.
--
-- The existing pattern is two independent statements: insert into
-- wallet_transactions, then call increment_credit_balance. Neither call site
-- checks its error, so a failure in either half leaves users.credit_balance
-- and the ledger permanently out of agreement, with no signal to anyone.
-- The admin dispute flow does exactly this
-- (app/[locale]/admin/disputes/page.tsx).
--
-- This function makes the pair atomic and returns the resulting balance, so a
-- caller cannot silently observe success when nothing happened.
--
-- Server-only: revoked from anon and authenticated, granted to service_role.
-- See 025_lock_down_atomic_helpers.sql for why the grants are explicit here.

CREATE OR REPLACE FUNCTION public.apply_wallet_adjustment(
  p_user_id uuid,
  p_amount  numeric,
  p_type    text,
  p_job_id  uuid DEFAULT NULL,
  p_note    text DEFAULT NULL
)
RETURNS numeric AS $$
DECLARE
  v_new_balance numeric;
BEGIN
  IF p_amount IS NULL OR p_amount = 0 THEN
    RAISE EXCEPTION 'Wallet adjustment amount must be non-zero';
  END IF;

  IF p_type IS NULL OR btrim(p_type) = '' THEN
    RAISE EXCEPTION 'Wallet adjustment requires a transaction type';
  END IF;

  -- Lock the user row so concurrent adjustments serialise.
  PERFORM 1 FROM public.users WHERE id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User % not found', p_user_id;
  END IF;

  INSERT INTO public.wallet_transactions (user_id, amount, type, job_id, note)
  VALUES (p_user_id, p_amount, p_type, p_job_id, p_note);

  UPDATE public.users
  SET credit_balance = COALESCE(credit_balance, 0) + p_amount
  WHERE id = p_user_id
  RETURNING credit_balance INTO v_new_balance;

  RETURN v_new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

REVOKE EXECUTE ON FUNCTION public.apply_wallet_adjustment(uuid, numeric, text, uuid, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.apply_wallet_adjustment(uuid, numeric, text, uuid, text)
  TO service_role;
