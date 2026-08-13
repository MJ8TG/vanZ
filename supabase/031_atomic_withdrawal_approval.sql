-- 031_atomic_withdrawal_approval.sql
--
-- The admin withdrawal approval flow (app/[locale]/admin/withdrawals/page.tsx)
-- pays drivers, and it had four defects at once:
--
--   1. Read-then-write on the balance:
--        const newCredit = driver.credit_balance - w.amount
--        supabase.from('users').update({ credit_balance: newCredit })
--      This is precisely the pattern increment_credit_balance was introduced to
--      replace (see 011_atomic_helpers.sql). Two admins approving at once, or one
--      admin on a stale page, silently overwrite each other — a driver can be paid
--      twice while the balance drops once.
--
--   2. No ledger row. It debited users.credit_balance without inserting into
--      wallet_transactions, leaving balance and ledger divergent with no record
--      that a payout ever happened.
--
--   3. Neither update checked its error. If the debit failed, the withdrawal was
--      still marked 'completed' and the driver was paid without being debited.
--
--   4. Wrong order with no transaction: the balance was debited first, then the
--      withdrawal marked complete. A failure in between debits the driver while
--      leaving the request pending, so it can be approved again.
--
-- This function does the whole thing atomically and idempotently: it locks the
-- withdrawal row, refuses anything not still pending, re-checks the balance
-- server-side rather than trusting a number from the browser, writes the ledger
-- row and the debit together via apply_wallet_adjustment, and marks the
-- withdrawal completed.
--
-- Server-only: revoked from anon and authenticated, granted to service_role.

CREATE OR REPLACE FUNCTION public.approve_withdrawal(
  p_withdrawal_id uuid,
  p_admin_id      uuid
)
RETURNS TABLE(driver_id uuid, amount numeric, new_balance numeric) AS $$
DECLARE
  v_w         public.withdrawals%ROWTYPE;
  v_balance   numeric;
  v_debt      numeric;
  v_available numeric;
  v_new       numeric;
BEGIN
  SELECT * INTO v_w FROM public.withdrawals WHERE id = p_withdrawal_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Withdrawal % not found', p_withdrawal_id;
  END IF;

  -- Idempotency: only a pending request can be approved.
  IF v_w.status IS DISTINCT FROM 'pending' THEN
    RAISE EXCEPTION 'Withdrawal % is already %', p_withdrawal_id, COALESCE(v_w.status, 'unknown');
  END IF;

  IF v_w.amount IS NULL OR v_w.amount <= 0 THEN
    RAISE EXCEPTION 'Withdrawal % has a non-positive amount', p_withdrawal_id;
  END IF;

  -- Re-check funds against the database, not against a value from the client.
  SELECT COALESCE(credit_balance, 0), COALESCE(pending_commission_debt, 0)
    INTO v_balance, v_debt
  FROM public.users WHERE id = v_w.driver_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Driver % not found', v_w.driver_id;
  END IF;

  v_available := v_balance - v_debt;
  IF v_available < v_w.amount THEN
    RAISE EXCEPTION 'Insufficient balance: available %, requested %', v_available, v_w.amount;
  END IF;

  -- Ledger row and debit in one step.
  v_new := public.apply_wallet_adjustment(
    v_w.driver_id,
    -v_w.amount,
    'withdrawal',
    NULL,
    format('Virement %s TND (demande %s)', v_w.amount, p_withdrawal_id)
  );

  UPDATE public.withdrawals
  SET status = 'completed', processed_at = now()
  WHERE id = p_withdrawal_id;

  INSERT INTO public.audit_logs (entity_type, entity_id, actor_id, action, previous_state, new_state, payload)
  VALUES ('user', v_w.driver_id, p_admin_id, 'withdrawal_approved', 'pending', 'completed',
          jsonb_build_object('withdrawal_id', p_withdrawal_id, 'amount', v_w.amount, 'new_balance', v_new));

  RETURN QUERY SELECT v_w.driver_id, v_w.amount, v_new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

REVOKE EXECUTE ON FUNCTION public.approve_withdrawal(uuid, uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.approve_withdrawal(uuid, uuid)
  TO service_role;
