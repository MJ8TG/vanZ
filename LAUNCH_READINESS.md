# VanZ — Launch Readiness Plan

Status as of 2026-08-13. Ordered by risk, not by effort.
Every finding below was verified against the live database or the source, not inferred.

## Progress

| Item | Status |
|---|---|
| P0-1 Revoke anon EXECUTE on money RPCs | **done** — migration 025/027, verified as `anon` and `service_role` |
| P0-2 Check for exploitation | **done** — no unexplained gains; see P0-5 for what it did uncover |
| P0-3 Admin dispute refunds | **done** — migration 026 + `POST /api/admin/disputes/adjust` |
| P0-4 Repo visibility, key rotation, Dependabot | **open — your decision** |
| P0-5 Clients can rewrite their own job rows | **done** — migration 028, tamper test passes |
| P0-8 Drivers can approve themselves | **done** — migration 030, tamper test passes |
| P0-9 Drivers can rewrite an accepted bid amount | **done** — migration 030, tamper test passes |
| P0-10 Withdrawal approval could double-pay | **done** — migrations 031/032 + `POST /api/admin/withdrawals/approve` |
| P0-6 Simulator writes to production from the browser | **done** — route now 404s outside development |
| **P0-7 The payout pipeline has never executed** | **partly done** — code hardened (atomic, idempotent, error-checked) and a verification script written; **the run itself is still outstanding** |
| P1-1 CI workflow | **done** — `.github/workflows/ci.yml`, green on Node 24 |
| P1-2 Permission regression test | **done** — `scripts/db-permission-check.sql`, passing |
| P1-3 Migration hygiene note | **done** — `AGENTS.md` |
| Phase 2 test coverage | not started |
| Phase 3 operational readiness | not started |

To enable the CI permission gate, add a `SUPABASE_DB_URL` secret in the repository
settings. Without it that job warns and skips rather than failing, so CI stays green
but the gate is inactive.

---

## P0-8 / P0-9. Self-approval and bid tampering

A sweep of every table's UPDATE policy found the `jobs` problem repeated twice more.
RLS is enabled on all 24 application tables (only `spatial_ref_sys`, a PostGIS
system table, is exempt), but four tables let their owner rewrite server-managed
columns.

**`drivers` was the serious one.** The policy is `USING ((id = auth.uid()) OR
is_admin())` with no `WITH CHECK`, and `status`, `approved_at` and `approved_by`
live on that row. So any signed-up driver could set their own status to
`'approved'` — skipping CIN, licence and insurance verification — then bid on jobs
and take possession of customers' goods. Verified on the live database and rolled
back: a driver session moved their own row `approved -> pending -> approved`.
This is a trust-and-safety hole rather than only a technical one.

**`bids` was narrower.** Its `WITH CHECK` already stops a client rewriting someone
else's bid (confirmed blocked), but not the driver rewriting their own: an accepted
bid moved `150.00 -> 99999.00`. Because `jobs.accepted_bid_amount` is protected by
028 the payout itself is safe, but a driver could still raise their offer between
the client seeing it and accepting it.

Migration 030 adds `lock_protected_driver_columns` and `lock_protected_bid_columns`
on the same pattern as 020 and 028. Drivers keep their vehicle details and document
uploads; a driver may still revise or withdraw a bid while it is `pending`. All four
triggers are now asserted by `scripts/db-permission-check.sql`.

One product decision left open deliberately: editing documents or vehicle details
after approval arguably ought to reset the driver to `pending` for re-verification.

---

## P0-10. Withdrawal approval could pay a driver twice

`app/[locale]/admin/withdrawals/page.tsx` is how every driver gets paid, and it
had four defects at once:

1. **Read-then-write on the balance.** It read `credit_balance` in the browser,
   subtracted in JavaScript, and wrote the result back — the exact pattern
   `increment_credit_balance` was introduced to replace in 011. Two admins
   approving at once, or one admin on a stale page, silently overwrite each
   other: a driver is paid twice while the balance drops once.
2. **No ledger row.** It debited `credit_balance` without touching
   `wallet_transactions`, so there was no record a payout had happened.
3. **No error checks** on either write.
4. **Wrong order, no transaction.** The debit happened before the withdrawal was
   marked complete, so a failure in between debits the driver and leaves the
   request pending — ready to be approved again.

`approve_withdrawal` (031) does the whole thing in one transaction: it locks the
withdrawal, refuses anything not still `pending`, re-checks the balance against
the database rather than trusting the browser, writes the ledger row and the
debit together, marks the withdrawal completed, and records an audit entry. The
page now calls `POST /api/admin/withdrawals/approve`.

Verified against the live database with a synthetic withdrawal, all rolled back:
balance 200 → 80, exactly one ledger row, status `completed`, one audit row, a
replayed approval refused, and a 500 TND request against an 80 TND balance refused.

Migration 032 widens `wallet_transactions_type_check`, which allowed only
`credit, debit, promo, referral, refund`. Both `'withdrawal'` and `'penalty'`
were outside it — meaning the *original* dispute page's ledger insert could never
have succeeded either, independent of the three bugs already found there.

---

## P0-7. The payout pipeline has never run (new top priority)

`wallet_transactions` and `loyalty_transactions` are both empty — zero rows, ever.
No user of any role has a positive `credit_balance`. Yet 17 jobs are `completed`,
12 of them carrying a computed `driver_payout` totalling 1,530 TND.

`audit_logs` contains no `status_transition` row with `new_state = 'completed'`.
Step 4 of `bookingService.completeJob` writes one unconditionally, so that function
has never run — not once. `updateJobStatus` is typed to accept only
`en_route | arrived | in_progress`, so it is not the path either. Those jobs were
written directly to the table, which the `/simulator` page did via `dbCompleteJob`
(now gated by P0-6, and blocked at the database by P0-5).

So the good news is that the missing payouts are an artefact of dev tooling rather
than of real drivers going unpaid. The bad news is larger: **the entire wallet and
payout path is unexercised.** Steps 6 and 7 of `completeJob` — the ledger insert,
the balance credit, the loyalty award — have never executed against this database,
and none of those four calls checks its error, so the first real completion could
fail silently in exactly the way the admin dispute flow did.

**Done so far.** Steps 6 and 7 now go through `apply_wallet_adjustment` (026) and
`apply_loyalty_award` (029), so the ledger row and the balance move in one
transaction, and both errors are checked. A retry hole was closed at the same time:
both blocks were gated on `isFirstCompletion`, which is true only the first time
`complete_job_atomic` sets commission — so a payout that failed after that point
could never be retried and the driver would never be paid. They are now guarded on
the presence of the ledger row, making a retry pay a missed driver exactly once.

**Still outstanding: actually running it.** `scripts/verify-payout-flow.ts` drives
`completeJob` through the real service layer and asserts the payout, the ledger row,
the loyalty award, the audit row, and idempotency on retry, creating and removing
its own scratch rows. It refuses to run without `ALLOW_DESTRUCTIVE_TEST=1` because
it writes rows, so it needs a Supabase branch or a local stack:

```
NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
  ALLOW_DESTRUCTIVE_TEST=1 npx tsx scripts/verify-payout-flow.ts
```

Until that passes somewhere, the payout path remains code that has never run.

---

## Phase 0 — Stop the bleeding (do today, ~2 hours)

### P0-1. Four money RPCs are callable by anonymous users

**Verified.** `pg_proc.proacl` on the live database shows:

| function | ACL | anon can execute |
|---|---|---|
| `increment_credit_balance` | `=X/postgres` + explicit `anon=X` | **yes** |
| `increment_loyalty_points` | `=X/postgres` + explicit `anon=X` | **yes** |
| `try_use_promo` | `=X/postgres` + explicit `anon=X` | **yes** |
| `complete_job_atomic` | `=X/postgres` + explicit `anon=X` | **yes** |
| `is_admin` | no PUBLIC, no anon | no (correct) |

All four are `SECURITY DEFINER` owned by `postgres`, with no `auth.uid()` check in the
body ([supabase/011_atomic_helpers.sql](supabase/011_atomic_helpers.sql)). They run as the
owner, so **row-level security does not apply to them**. Anyone holding the anon key —
which ships inside every copy of the mobile app and is public by design — can POST to
`/rest/v1/rpc/increment_credit_balance` with any user id and any amount.

**Root cause is a regression, not an oversight.** Migration `revoke_anon_execute_and_fix_rls`
(20260428161044) did revoke these grants — `is_admin` still carries that hardening today,
which proves the migration worked. Then `atomic_helpers_force` (20260607010019) re-created
the four helpers. `CREATE OR REPLACE` preserves an ACL, but a `DROP` + recreate resets it to
the Supabase default of PUBLIC EXECUTE. The June migration silently reopened what April closed.

**Fix** — new migration `025_lock_down_atomic_helpers.sql`:

```sql
-- Defence 1: no direct API access. These are server-only helpers.
REVOKE EXECUTE ON FUNCTION public.increment_credit_balance(uuid, numeric)  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_loyalty_points(uuid, integer)  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.try_use_promo(text, uuid, numeric)       FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.complete_job_atomic(uuid, numeric, numeric) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.increment_credit_balance(uuid, numeric)   TO service_role;
GRANT EXECUTE ON FUNCTION public.increment_loyalty_points(uuid, integer)   TO service_role;
GRANT EXECUTE ON FUNCTION public.try_use_promo(text, uuid, numeric)        TO service_role;
GRANT EXECUTE ON FUNCTION public.complete_job_atomic(uuid, numeric, numeric) TO service_role;

-- Defence 2: pin search_path (also clears 8 advisor warnings).
ALTER FUNCTION public.increment_credit_balance(uuid, numeric)   SET search_path = public, pg_temp;
ALTER FUNCTION public.increment_loyalty_points(uuid, integer)   SET search_path = public, pg_temp;
ALTER FUNCTION public.try_use_promo(text, uuid, numeric)        SET search_path = public, pg_temp;
ALTER FUNCTION public.complete_job_atomic(uuid, numeric, numeric) SET search_path = public, pg_temp;
```

Defence in depth is deliberate: the grant alone already regressed once.

### P0-2. Check whether it was already exploited

Before assuming no harm, reconcile stored balances against the transaction ledger. Any user
whose `credit_balance` doesn't match the sum of their `wallet_transactions` got credit from
somewhere other than the app.

```sql
SELECT u.id, u.credit_balance,
       COALESCE(SUM(w.amount), 0) AS ledger_total,
       u.credit_balance - COALESCE(SUM(w.amount), 0) AS discrepancy
FROM public.users u
LEFT JOIN public.wallet_transactions w ON w.user_id = u.id
GROUP BY u.id, u.credit_balance
HAVING u.credit_balance <> COALESCE(SUM(w.amount), 0)
ORDER BY discrepancy DESC;
```

Run the same shape against `loyalty_points` vs `loyalty_transactions`. A clean result closes
the question. A dirty one means manual reconciliation before launch.

### P0-3. Admin dispute refunds are silently broken

[app/[locale]/admin/disputes/page.tsx:97](app/[locale]/admin/disputes/page.tsx:97) and
[:107](app/[locale]/admin/disputes/page.tsx:107) call the RPC with `{ user_id, amount }`.
The function signature is `(p_user_id, p_amount)` — confirmed as the only overload in the
database. PostgREST resolves overloads by argument name, so these calls have never matched a
function. Neither call checks the returned error, so they fail with no signal to the operator,
who sees a success state and assumes the customer was refunded.

Two defects, one line apart: wrong parameter names, and an unchecked `await supabase.rpc(...)`.

This is also a `'use client'` component, so the call goes straight from the browser. Renaming
the parameters is *not* the fix, because P0-1 revokes browser access. Correct fix: move both
adjustments into a server route (`app/api/admin/disputes/adjust/route.ts`) that verifies
`is_admin()`, uses the service-role client, checks the error, and writes an `audit_logs` row.

### P0-4. Repository and credential hygiene

The repo is public (unauthenticated `api.github.com` returns 200) and exposes the schema
including the vulnerable functions above. Also 31 Dependabot alerts on `main`, 23 high.

- Decide public vs private deliberately. If it stays public, that is a real choice with real
  consequences, and P0-1 becomes more urgent, not less.
- Rotate `SUPABASE_SERVICE_ROLE_KEY` and `TWILIO_TOKEN` if they were ever pasted into a
  chat, an issue, a screenshot, or a commit. Cheap to do, expensive to skip.
- Triage the 23 high-severity advisories.

---

## Phase 1 — Make the fix permanent (this week, ~1 day)

The Phase 0 hole was closed once and came back. Without this phase it can come back again.

### P1-1. CI that actually gates

No `.github/workflows` exists today. Add one running on every push and PR:

- `npx tsc --noEmit` (currently passes clean — protect that)
- `npx eslint`
- `npx playwright test`

### P1-2. A permissions regression test

The single highest-value test in the codebase. Assert the invariant directly:

```sql
SELECT has_function_privilege('anon', 'public.increment_credit_balance(uuid,numeric)', 'EXECUTE');
-- must be false
```

Run it in CI against a branch database, and as a post-deploy check against production. Any
future migration that drops and recreates these functions fails the build instead of shipping.

### P1-3. Migration hygiene note

Add to [AGENTS.md](AGENTS.md): dropping and recreating a function resets its ACL. Any
migration that touches a `SECURITY DEFINER` function must re-assert its grants in the same file.

---

## Phase 2 — Make correctness provable (2 weeks)

Right now 57k lines and 13 API routes are covered by one Playwright smoke spec. The system
may well be correct; nothing demonstrates that it is.

- **Money paths first.** Integration tests for job completion → commission split → driver
  payout → loyalty award, and for promo redemption including the per-user limit and the
  concurrent-redemption race that `try_use_promo`'s `FOR UPDATE` exists to prevent.
- **Authorization tests.** For each of the 13 routes: anonymous, wrong-role, and correct-role.
  This is where the class of bug in P0-1 lives.
- **E2E on the two flows that matter**: client books → driver bids → accept → complete;
  and driver onboarding through first payout.
- **Reduce the 91 `any` annotations**, starting with `lib/services/` where the money logic
  lives. A clean typecheck means less than it appears while these remain.

---

## Phase 3 — Operational readiness (before real users)

Not code quality — the things that decide whether you find out about a problem from your
dashboard or from an angry customer.

- **Error monitoring** (Sentry or equivalent) on web and mobile, with alerts on payment and
  job-completion failures. Also remove the 10 stray `console.log` calls.
- **Rate limiting** on auth, booking, and bid endpoints.
- **Backups**: confirm Supabase PITR is on and actually restore once into a branch. An
  untested backup is a hypothesis.
- **Dispute and refund runbook** — a written procedure, since P0-3 shows the tooling can
  fail quietly.
- **Legal**: the CGU `.docx` in the repo root needs to be published and linked from signup.
- **Support channel** and a documented rollback procedure for a bad mobile release.
- **Load check** on `get_jobs_within_radius`, the PostGIS query every driver hits on a map
  refresh. Confirm the spatial index is used under realistic row counts.

---

## Sequencing

Revised after the Phase 0 work. **P0-7 now comes before Phase 1.** A marketplace that
computes payouts correctly but has never once credited one is a harder blocker than
missing CI, and proving that path works is also the natural first integration test —
it feeds directly into Phase 2.

After that, Phase 1 is what stops any of Phase 0 from recurring; the anon-execute hole
had already been fixed once and came back. Phases 2 and 3 can run in parallel.

Launch gate: **Phase 0 complete (including P0-7), Phase 1 complete, plus Phase 3's
monitoring, backups, and legal.** Phase 2 raises confidence and should be underway, but a
cash-first launch with a small user base can begin while test coverage is still being
built — provided CI is green and one real payout has been observed working.
