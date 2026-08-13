<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Database rules

**Dropping a function resets its permissions.** `CREATE OR REPLACE FUNCTION`
preserves a function's ACL; `DROP FUNCTION` followed by a recreate does not — the
new function gets the Supabase default of `PUBLIC EXECUTE`, which exposes it to
`anon` and `authenticated` through PostgREST.

This has already caused one production vulnerability: `revoke_anon_execute_and_fix_rls`
(April 2026) revoked execute on the money RPCs, and `atomic_helpers_force` (June 2026)
re-created them, silently handing anonymous callers the ability to credit any user's
wallet. See `supabase/025_lock_down_atomic_helpers.sql`.

So: any migration that drops and recreates a `SECURITY DEFINER` function must
re-assert its `REVOKE`/`GRANT` in the same file, and pin `search_path`.

**Balance changes must be atomic with their ledger row.** Never update
`users.credit_balance` or `users.loyalty_points` alongside a separate insert into
`wallet_transactions` / `loyalty_transactions` — a half-failure leaves the two
permanently divergent with no signal. Use `apply_wallet_adjustment` and
`apply_loyalty_award`, and check the error they return.

**RLS controls rows, not columns.** A policy like `USING (client_id = auth.uid())`
lets that user rewrite *every* column of their own row, including status and money.
Protect server-managed columns with a `BEFORE UPDATE` trigger — see
`020_lock_user_columns.sql` and `028_lock_job_columns.sql` for the pattern.

`scripts/db-permission-check.sql` asserts all of the above and runs in CI.
