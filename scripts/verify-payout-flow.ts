/**
 * Integration check for the driver payout path.
 *
 * This exists because that path has never executed. wallet_transactions and
 * loyalty_transactions are empty, no user has a positive credit_balance, and no
 * job carries a `status_transition -> completed` audit row — so
 * bookingService.completeJob has never run against this database. See P0-7 in
 * LAUNCH_READINESS.md.
 *
 * What it asserts, end to end through the real service layer:
 *   1. completeJob credits the driver exactly once, with a matching ledger row
 *   2. credit_balance and wallet_transactions agree afterwards
 *   3. the client is awarded loyalty points, with a matching ledger row
 *   4. an audit row records the transition to 'completed'
 *   5. calling it a second time is idempotent — no double payment
 *
 * It creates its own scratch rows and removes them in a finally block.
 *
 * NEVER point this at production. It refuses to run unless
 * ALLOW_DESTRUCTIVE_TEST=1 is set, and is intended for a Supabase branch or a
 * local stack:
 *
 *   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
 *   ALLOW_DESTRUCTIVE_TEST=1 npx tsx scripts/verify-payout-flow.ts
 */

import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import { bookingService } from '../lib/services/bookingService';

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!URL || !KEY) {
  console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

if (process.env.ALLOW_DESTRUCTIVE_TEST !== '1') {
  console.error(
    'Refusing to run: this creates and deletes rows.\n' +
    'Point it at a Supabase branch or local stack, then set ALLOW_DESTRUCTIVE_TEST=1.'
  );
  process.exit(1);
}

const supabase = createClient(URL, KEY);

const BID_AMOUNT = 150;             // commission 15% => 22.50, payout 127.50
const EXPECTED_PAYOUT = 127.5;
const EXPECTED_LOYALTY = 15;        // floor(150 / 10)

const failures: string[] = [];
function check(label: string, actual: unknown, expected: unknown) {
  const ok = String(actual) === String(expected);
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${label} (expected ${expected}, got ${actual})`);
  if (!ok) failures.push(label);
}

async function main() {
  const clientId = randomUUID();
  const driverId = randomUUID();
  let jobId: string | undefined;
  let bidId: string | undefined;

  try {
    await supabase.from('users').insert([
      { id: clientId, role: 'client', first_name: 'PayoutTest', last_name: 'Client', credit_balance: 0, loyalty_points: 0 },
      { id: driverId, role: 'driver', first_name: 'PayoutTest', last_name: 'Driver', credit_balance: 0, loyalty_points: 0 },
    ]).throwOnError();

    const { data: job } = await supabase.from('jobs').insert({
      client_id: clientId,
      service_type: 'van_standard',
      pickup_address: 'Test pickup',
      dropoff_address: 'Test dropoff',
      status: 'in_progress',
      accepted_bid_amount: BID_AMOUNT,
    }).select('id').single().throwOnError();
    jobId = job!.id;

    const { data: bid } = await supabase.from('bids').insert({
      job_id: jobId, driver_id: driverId, amount: BID_AMOUNT,
    }).select('id').single().throwOnError();
    bidId = bid!.id;

    await supabase.from('jobs').update({ accepted_bid_id: bidId }).eq('id', jobId).throwOnError();

    console.log('\nFirst completion:');
    await bookingService.completeJob(supabase, jobId!, driverId, 'https://example.test/proof.jpg', 36.8, 10.18, '127.0.0.1');

    const driverAfter = await supabase.from('users').select('credit_balance').eq('id', driverId).single();
    check('driver credit_balance', driverAfter.data?.credit_balance, EXPECTED_PAYOUT);

    const ledger = await supabase.from('wallet_transactions').select('amount').eq('job_id', jobId).eq('user_id', driverId);
    check('wallet ledger rows', ledger.data?.length, 1);
    check('wallet ledger amount', ledger.data?.[0]?.amount, EXPECTED_PAYOUT);

    const clientAfter = await supabase.from('users').select('loyalty_points').eq('id', clientId).single();
    check('client loyalty_points', clientAfter.data?.loyalty_points, EXPECTED_LOYALTY);

    const loyaltyLedger = await supabase.from('loyalty_transactions').select('points').eq('job_id', jobId);
    check('loyalty ledger rows', loyaltyLedger.data?.length, 1);

    const audit = await supabase.from('audit_logs').select('id')
      .eq('entity_id', jobId).eq('action', 'status_transition').eq('new_state', 'completed');
    check('completion audit rows', audit.data?.length, 1);

    // Idempotency: a retry must not pay twice.
    console.log('\nSecond completion (retry):');
    try {
      await bookingService.completeJob(supabase, jobId!, driverId, 'https://example.test/proof.jpg', 36.8, 10.18, '127.0.0.1');
    } catch (err) {
      console.log(`  (threw, which is acceptable: ${(err as Error).message})`);
    }

    const driverRetry = await supabase.from('users').select('credit_balance').eq('id', driverId).single();
    check('driver balance unchanged after retry', driverRetry.data?.credit_balance, EXPECTED_PAYOUT);

    const ledgerRetry = await supabase.from('wallet_transactions').select('id').eq('job_id', jobId).eq('user_id', driverId);
    check('wallet ledger still one row', ledgerRetry.data?.length, 1);

  } finally {
    console.log('\nCleaning up scratch rows...');
    if (jobId) {
      await supabase.from('wallet_transactions').delete().eq('job_id', jobId);
      await supabase.from('loyalty_transactions').delete().eq('job_id', jobId);
      await supabase.from('audit_logs').delete().eq('entity_id', jobId);
      await supabase.from('jobs').update({ accepted_bid_id: null }).eq('id', jobId);
    }
    if (bidId)  await supabase.from('bids').delete().eq('id', bidId);
    if (jobId)  await supabase.from('jobs').delete().eq('id', jobId);
    await supabase.from('users').delete().in('id', [clientId, driverId]);
    console.log('Cleanup done.');
  }

  if (failures.length) {
    console.error(`\n${failures.length} check(s) FAILED: ${failures.join(', ')}`);
    process.exit(1);
  }
  console.log('\nAll payout checks passed.');
}

main().catch((err) => {
  console.error('\nPayout verification errored:', err);
  process.exit(1);
});
