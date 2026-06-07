import dotenv from 'dotenv';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Load env variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase Service Role credentials.");
  process.exit(1);
}

// Instantiate client
const supabase = createClient(supabaseUrl, supabaseKey);

// Import booking service using relative path
import { bookingService } from '../lib/services/bookingService';

function generateId() {
  return crypto.randomBytes(4).toString('hex');
}

async function runTests() {
  console.log("============== STATE MACHINE & AUDIT LOG VERIFICATION ==============\n");
  const testId = generateId();
  const clientEmail = `sm_client_${testId}@test.vanz`;
  const driverEmail = `sm_driver_${testId}@test.vanz`;
  const testIp = '197.0.0.1'; // Mock Tunisian-like client IP

  let clientId: string | null = null;
  let driverId: string | null = null;
  let jobId: string | null = null;
  let bidId: string | null = null;

  try {
    console.log("[1] Creating Test Client & Driver Identities...");
    const { data: authClient, error: cErr } = await supabase.auth.admin.createUser({
      email: clientEmail,
      email_confirm: true,
      password: 'TestPassword123!',
      user_metadata: { role: 'client', first_name: 'SM_Test', last_name: 'Client', phone: `+21699222${testId.substring(0,3)}` }
    });
    if (cErr) throw new Error("Client creation failed: " + cErr.message);
    clientId = authClient.user.id;

    const { data: authDriver, error: dErr } = await supabase.auth.admin.createUser({
      email: driverEmail,
      email_confirm: true,
      password: 'TestPassword123!',
      user_metadata: { role: 'driver', first_name: 'SM_Test', last_name: 'Driver', phone: `+21699333${testId.substring(0,3)}` }
    });
    if (dErr) throw new Error("Driver creation failed: " + dErr.message);
    driverId = authDriver.user.id;

    // Create driver profile
    const { error: drvErr } = await supabase.from('drivers').insert({
      id: driverId,
      cin_number: `CIN_SM_${testId}`,
      cin_expiry: '2030-01-01',
      date_of_birth: '1990-01-01',
      vehicle_type: 'van_standard',
      vehicle_plate: `${testId.substring(0,4)} TN 217`,
      status: 'approved'
    });
    if (drvErr) throw new Error("Driver Profile creation failed: " + drvErr.message);

    // Make driver active & online
    await supabase.from('users').update({
      account_status: 'active',
      city: 'Tunis',
      is_online: true
    }).eq('id', driverId);

    console.log(`✅ Identities Created. Client: ${clientId} | Driver: ${driverId}`);

    // Create Job
    console.log("\n[2] Creating Job via bookingService.createJob...");
    const jobInput = {
      client_id: clientId,
      service_type: 'van_standard',
      pickup_address: 'Lac 2, Tunis',
      dropoff_address: 'Gammarth, Tunis',
      payment_method: 'cash'
    };
    const job = await bookingService.createJob(supabase, jobInput, testIp);
    jobId = job.id;
    console.log(`✅ Job #${jobId} created in 'open' status.`);

    // Create Bid
    console.log("\n[3] Submitting Driver Bid...");
    const { data: bid, error: bidErr } = await supabase.from('bids').insert({
      job_id: jobId,
      driver_id: driverId,
      amount: 120,
      status: 'pending'
    }).select().single();
    if (bidErr) throw bidErr;
    bidId = bid.id;
    console.log(`✅ Bid #${bidId} submitted for 120 TND.`);

    // Accept Bid (open -> payment_pending)
    console.log("\n[4] Client accepting bid (Transitions open -> payment_pending)...");
    const acceptRes = await bookingService.acceptBid(supabase, jobId, bidId, clientId, testIp);
    console.log(`✅ Bid accepted successfully. Commission: ${acceptRes.commissionAmount} TND. Payout: ${acceptRes.driverPayout} TND.`);

    // Try illegal transition: payment_pending -> completed
    console.log("\n[5] Testing illegal transition: payment_pending -> completed (Expected to FAIL)...");
    try {
      await bookingService.completeJob(supabase, jobId, driverId, 'https://test-photo.com/proof.jpg', 36.8, 10.2, testIp);
      console.error("❌ ERROR: Illegal transition succeeded! This is a failure.");
      process.exit(1);
    } catch (err: any) {
      console.log(`✅ Successfully caught illegal transition error: "${err.message}"`);
    }

    // Try illegal transition: updateJobStatus to 'in_progress' while status is payment_pending
    console.log("\n[6] Testing illegal transition: updateJobStatus to in_progress from payment_pending (Expected to FAIL)...");
    try {
      await bookingService.updateJobStatus(supabase, jobId, driverId, 'in_progress', testIp);
      console.error("❌ ERROR: Illegal transition succeeded! This is a failure.");
      process.exit(1);
    } catch (err: any) {
      console.log(`✅ Successfully caught illegal transition error: "${err.message}"`);
    }

    // Simulate Payment Success by moving job to 'matched' in database
    console.log("\n[7] Simulating payment success (Updating DB job status payment_pending -> matched)...");
    const { error: matchErr } = await supabase.from('jobs').update({ status: 'matched' }).eq('id', jobId);
    if (matchErr) throw matchErr;
    console.log("✅ Job status updated to 'matched' in DB.");

    // Update job status to in_progress
    console.log("\n[8] Driver starts job (Transitions matched -> in_progress)...");
    const updateRes = await bookingService.updateJobStatus(supabase, jobId, driverId, 'in_progress', testIp);
    console.log(`✅ Job status updated to ${updateRes.dbStatus} successfully.`);

    // Complete Job (Transitions in_progress -> completed)
    console.log("\n[9] Driver completes job (Transitions in_progress -> completed)...");
    const completeRes = await bookingService.completeJob(supabase, jobId, driverId, 'https://test-photo.com/delivery.jpg', 36.88, 10.32, testIp);
    console.log(`✅ Job completed successfully. Final Payout: ${completeRes.driverPayout} TND.`);

    // Verify Audit Logs Table
    console.log("\n[10] Verifying audit_logs entries in the database...");
    const { data: logs, error: logsErr } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('entity_id', jobId)
      .order('created_at', { ascending: true });

    if (logsErr) throw logsErr;

    console.log(`Found ${logs.length} audit logs for Job #${jobId}:`);
    for (const log of logs) {
      console.log(` - Action: ${log.action} | Prev: ${log.previous_state} -> New: ${log.new_state} | Actor: ${log.actor_id} | IP: ${log.ip_address}`);
    }

    // Assertions
    if (logs.length < 4) {
      throw new Error(`Expected at least 4 audit log entries, found ${logs.length}`);
    }

    const createdLog = logs.find(l => l.action === 'job_created');
    const acceptLog = logs.find(l => l.action === 'status_transition' && l.new_state === 'payment_pending');
    const inProgressLog = logs.find(l => l.action === 'status_transition' && l.new_state === 'in_progress');
    const completedLog = logs.find(l => l.action === 'status_transition' && l.new_state === 'completed');

    if (!createdLog || createdLog.ip_address !== testIp || createdLog.actor_id !== clientId) {
      throw new Error("Invalid or missing 'job_created' audit log.");
    }
    if (!acceptLog || acceptLog.previous_state !== 'open' || acceptLog.new_state !== 'payment_pending' || acceptLog.ip_address !== testIp || acceptLog.actor_id !== clientId) {
      throw new Error("Invalid or missing 'payment_pending' transition audit log.");
    }
    if (!inProgressLog || inProgressLog.previous_state !== 'matched' || inProgressLog.new_state !== 'in_progress' || inProgressLog.ip_address !== testIp || inProgressLog.actor_id !== driverId) {
      throw new Error("Invalid or missing 'in_progress' transition audit log.");
    }
    if (!completedLog || completedLog.previous_state !== 'in_progress' || completedLog.new_state !== 'completed' || completedLog.ip_address !== testIp || completedLog.actor_id !== driverId) {
      throw new Error("Invalid or missing 'completed' transition audit log.");
    }

    console.log("\n🎉 ALL STATE MACHINE & AUDIT LOG VERIFICATIONS PASSED SUCCESSFULLY!");

  } catch (err: any) {
    console.error("\n❌ VERIFICATION FAILED:", err.message);
    process.exit(1);
  } finally {
    console.log("\n🧹 Cleaning up mock test database traces...");
    if (jobId) {
      // Delete child transactions and messages first
      await supabase.from('wallet_transactions').delete().eq('job_id', jobId);
      await supabase.from('loyalty_transactions').delete().eq('job_id', jobId);
      await supabase.from('messages').delete().filter('conversation_id', 'in', 
        supabase.from('conversations').select('id').eq('job_id', jobId)
      );
      await supabase.from('conversations').delete().eq('job_id', jobId);
      await supabase.from('audit_logs').delete().eq('entity_id', jobId);
      await supabase.from('bids').delete().eq('job_id', jobId);
      await supabase.from('jobs').delete().eq('id', jobId);
    }
    if (driverId) {
      await supabase.from('drivers').delete().eq('id', driverId);
      await supabase.auth.admin.deleteUser(driverId);
    }
    if (clientId) {
      await supabase.auth.admin.deleteUser(clientId);
    }
    console.log("✅ Cleanup completed.");
  }
}

runTests();
