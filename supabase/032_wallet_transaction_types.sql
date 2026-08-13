-- 032_wallet_transaction_types.sql
--
-- wallet_transactions_type_check allowed only:
--   credit, debit, promo, referral, refund
--
-- Two flows write types outside that set and would fail on every attempt:
--
--   * 'penalty'    — driver deduction in the dispute flow. The original
--                    client-side code in app/[locale]/admin/disputes/page.tsx
--                    inserted this type, so that insert could never have
--                    succeeded. It is one more reason the dispute flow has
--                    never worked, alongside the RPC parameter mismatch and the
--                    bid-id-as-user-id bug fixed in 026.
--   * 'withdrawal' — driver payout in approve_withdrawal (031).
--
-- Both are genuine, distinct transaction kinds and deserve their own labels
-- rather than being folded into the generic 'debit', because reconciliation and
-- driver-facing statements need to tell a payout apart from a penalty.
--
-- Safe to apply: wallet_transactions is empty, so no existing row can violate
-- the widened constraint.

ALTER TABLE public.wallet_transactions
  DROP CONSTRAINT IF EXISTS wallet_transactions_type_check;

ALTER TABLE public.wallet_transactions
  ADD CONSTRAINT wallet_transactions_type_check
  CHECK (type = ANY (ARRAY[
    'credit'::text,
    'debit'::text,
    'promo'::text,
    'referral'::text,
    'refund'::text,
    'penalty'::text,
    'withdrawal'::text
  ]));
