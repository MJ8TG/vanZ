-- 020_lock_user_columns.sql
-- Defense-in-depth: stop a user from editing server-managed columns on their
-- OWN users row.
--
-- The `users_update_own` RLS policy allows a user to UPDATE their own row, but
-- RLS cannot compare OLD vs NEW values, so it cannot prevent column tampering on
-- its own. Without this, an authenticated user could (via a direct Supabase
-- update with their session) set their own `role`, lift their own
-- `account_status`/ban, or inflate `credit_balance` / `loyalty_points` /
-- `pending_commission_debt`.
--
-- A BEFORE UPDATE trigger is the correct tool: it reverts protected columns to
-- their previous values for ordinary end-user self-updates, while leaving the
-- columns users legitimately edit (name, email, city, phone, is_online,
-- last_online_at, …) untouched.
--
-- Role specifically: becoming a driver must go through the driver onboarding
-- flow (the wizard -> /api/drivers/signup, which runs with the service role and
-- also creates a `drivers` row pending admin approval). A user cannot flip their
-- own role to 'driver' (or 'admin') here.

CREATE OR REPLACE FUNCTION public.lock_protected_user_columns()
RETURNS TRIGGER AS $$
BEGIN
  -- Server-side calls (service role -> no auth context) and admins may change
  -- anything. auth.uid() is NULL when there is no end-user JWT (service role).
  IF auth.uid() IS NULL OR public.is_admin() THEN
    RETURN NEW;
  END IF;

  -- Ordinary authenticated user editing their own row: keep server-managed
  -- columns at their previous values.
  NEW.role                    := OLD.role;
  NEW.account_status          := OLD.account_status;
  NEW.suspended_until         := OLD.suspended_until;
  NEW.ban_reason              := OLD.ban_reason;
  NEW.credit_balance          := OLD.credit_balance;
  NEW.loyalty_points          := OLD.loyalty_points;
  NEW.pending_commission_debt := OLD.pending_commission_debt;
  NEW.cached_rating           := OLD.cached_rating;
  NEW.total_reviews           := OLD.total_reviews;
  NEW.referral_code           := OLD.referral_code;
  NEW.referred_by             := OLD.referred_by;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_lock_protected_user_columns ON public.users;
CREATE TRIGGER trg_lock_protected_user_columns
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.lock_protected_user_columns();
