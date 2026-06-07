import dotenv from 'dotenv';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Load env variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey || !anonKey) {
  console.error("Missing Supabase credentials in env variables.");
  process.exit(1);
}

// Mock global fetch for third-party Paymee API before importing routes
const originalFetch = global.fetch;
global.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const url = typeof input === 'string' ? input : (input instanceof URL ? input.toString() : (input as any).url || '');
  if (url && url.includes('paymee.tn')) {
    return new Response(JSON.stringify({
      success: true,
      data: {
        payment_url: 'https://sandbox.paymee.tn/gateway/mock_payment_id'
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  return originalFetch(input, init);
};

// Import booking service and API handlers
import { bookingService } from '../lib/services/bookingService';
import { POST as acceptRoute } from '../app/api/jobs/accept/route';
import { POST as completeRoute } from '../app/api/jobs/complete/route';
import { POST as updateStatusRoute } from '../app/api/jobs/update-status/route';
import { POST as paymentMethodRoute } from '../app/api/jobs/payment-method/route';

function generateId() {
  return crypto.randomBytes(4).toString('hex');
}

async function runTests() {
  console.log("============== STATE MACHINE, ROLE VALIDATION, & AUDIT LOG VERIFICATION ==============\n");
  const testId = generateId();
  const clientEmail = `sm_client_${testId}@test.vanz`;
  const driverEmail = `sm_driver_${testId}@test.vanz`;
  const testIp = '197.0.0.1'; // Mock Tunisian client IP

  let clientId: string | null = null;
  let driverId: string | null = null;
  let jobId: string | null = null;
  let bidId: string | null = null;
  let clientToken: string | null = null;
  let driverToken: string | null = null;

  try {
    console.log("[1] Creating Test Client & Driver Identities...");
    const { data: authClient, error: cErr } = await adminSupabase.auth.admin.createUser({
      email: clientEmail,
      email_confirm: true,
      password: 'TestPassword123!',
      user_metadata: { role: 'client', first_name: 'SM_Test', last_name: 'Client', phone: `+21699222${testId.substring(0,3)}` }
    });
    if (cErr) throw new Error("Client creation failed: " + cErr.message);
    clientId = authClient.user.id;

    const { data: authDriver, error: dErr } = await adminSupabase.auth.admin.createUser({
      email: driverEmail,
      email_confirm: true,
      password: 'TestPassword123!',
      user_metadata: { role: 'driver', first_name: 'SM_Test', last_name: 'Driver', phone: `+21699333${testId.substring(0,3)}` }
    });
    if (dErr) throw new Error("Driver creation failed: " + dErr.message);
    driverId = authDriver.user.id;

    // Create profile rows in public.users to register the correct roles
    await adminSupabase.from('users').update({ role: 'client' }).eq('id', clientId);
    await adminSupabase.from('users').update({ role: 'driver' }).eq('id', driverId);

    // Create driver profile
    const { error: drvErr } = await adminSupabase.from('drivers').insert({
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
    await adminSupabase.from('users').update({
      account_status: 'active',
      city: 'Tunis',
      is_online: true
    }).eq('id', driverId);

    // Get Auth Tokens by signing in using user client
    const { data: cSignIn, error: cSInErr } = await userSupabase.auth.signInWithPassword({
      email: clientEmail,
      password: 'TestPassword123!'
    });
    if (cSInErr) throw cSInErr;
    clientToken = cSignIn.session.access_token;

    const { data: dSignIn, error: dSInErr } = await userSupabase.auth.signInWithPassword({
      email: driverEmail,
      password: 'TestPassword123!'
    });
    if (dSInErr) throw dSInErr;
    driverToken = dSignIn.session.access_token;

    console.log(`✅ Identities & Tokens Generated. Client: ${clientId} | Driver: ${driverId}`);

    // Create Job
    console.log("\n[2] Creating Job via bookingService.createJob...");
    const jobInput = {
      client_id: clientId,
      service_type: 'van_standard',
      pickup_address: 'Lac 2, Tunis',
      dropoff_address: 'Gammarth, Tunis',
      payment_method: 'cash'
    };
    const job = await bookingService.createJob(adminSupabase, jobInput, testIp);
    jobId = job.id;
    console.log(`✅ Job #${jobId} created in 'open' status.`);

    // Create Bid
    console.log("\n[3] Submitting Driver Bid...");
    const { data: bid, error: bidErr } = await adminSupabase.from('bids').insert({
      job_id: jobId,
      driver_id: driverId,
      amount: 120,
      status: 'pending'
    }).select().single();
    if (bidErr) throw bidErr;
    bidId = bid.id;
    console.log(`✅ Bid #${bidId} submitted for 120 TND.`);

    // --- SECURITY TESTING: Role-Based Authorization Guards ---
    console.log("\n[4] Testing role-based authentication route-level guards...");

    // Test A: Driver tries to accept bid (should fail with 403)
    console.log("  - Driver trying to call POST /api/jobs/accept (Expected: 403 Forbidden)...");
    const driverAcceptRequest = new Request('http://localhost/api/jobs/accept', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${driverToken}`,
        'Content-Type': 'application/json',
        'x-forwarded-for': testIp
      },
      body: JSON.stringify({ job_id: jobId, bid_id: bidId, client_id: clientId })
    });
    const driverAcceptRes = await acceptRoute(driverAcceptRequest);
    const driverAcceptBody = await driverAcceptRes.json();
    console.log(`    Status: ${driverAcceptRes.status} | Body: ${JSON.stringify(driverAcceptBody)}`);
    if (driverAcceptRes.status !== 403 || !driverAcceptBody.error.includes('Accès interdit')) {
      throw new Error("Security check failed: Driver was allowed to access client-only accept route!");
    }
    console.log("    ✅ Driver successfully blocked from client endpoint.");

    // Test B: Client tries to update status (should fail with 403)
    console.log("  - Client trying to call POST /api/jobs/update-status (Expected: 403 Forbidden)...");
    const clientStatusRequest = new Request('http://localhost/api/jobs/update-status', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${clientToken}`,
        'Content-Type': 'application/json',
        'x-forwarded-for': testIp
      },
      body: JSON.stringify({ job_id: jobId, driver_id: driverId, status: 'in_progress' })
    });
    const clientStatusRes = await updateStatusRoute(clientStatusRequest);
    const clientStatusBody = await clientStatusRes.json();
    console.log(`    Status: ${clientStatusRes.status} | Body: ${JSON.stringify(clientStatusBody)}`);
    if (clientStatusRes.status !== 403 || !clientStatusBody.error.includes('Accès interdit')) {
      throw new Error("Security check failed: Client was allowed to access driver-only update-status route!");
    }
    console.log("    ✅ Client successfully blocked from driver status endpoint.");

    // Test C: Client tries to complete job (should fail with 403)
    console.log("  - Client trying to call POST /api/jobs/complete (Expected: 403 Forbidden)...");
    const clientCompleteRequest = new Request('http://localhost/api/jobs/complete', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${clientToken}`,
        'Content-Type': 'application/json',
        'x-forwarded-for': testIp
      },
      body: JSON.stringify({ job_id: jobId, driver_id: driverId, delivery_photo_url: 'https://proof.jpg' })
    });
    const clientCompleteRes = await completeRoute(clientCompleteRequest);
    const clientCompleteBody = await clientCompleteRes.json();
    console.log(`    Status: ${clientCompleteRes.status} | Body: ${JSON.stringify(clientCompleteBody)}`);
    if (clientCompleteRes.status !== 403 || !clientCompleteBody.error.includes('Accès interdit')) {
      throw new Error("Security check failed: Client was allowed to access driver-only complete route!");
    }
    console.log("    ✅ Client successfully blocked from driver completion endpoint.");

    // Test D: Driver tries to call payment-method update (should fail with 403)
    console.log("  - Driver trying to call POST /api/jobs/payment-method (Expected: 403 Forbidden)...");
    const driverPaymentRequest = new Request('http://localhost/api/jobs/payment-method', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${driverToken}`,
        'Content-Type': 'application/json',
        'x-forwarded-for': testIp
      },
      body: JSON.stringify({ job_id: jobId, client_id: clientId, payment_method: 'cash' })
    });
    const driverPaymentRes = await paymentMethodRoute(driverPaymentRequest);
    const driverPaymentBody = await driverPaymentRes.json();
    console.log(`    Status: ${driverPaymentRes.status} | Body: ${JSON.stringify(driverPaymentBody)}`);
    if (driverPaymentRes.status !== 403 || !driverPaymentBody.error.includes('Accès interdit')) {
      throw new Error("Security check failed: Driver was allowed to access client-only payment-method route!");
    }
    console.log("    ✅ Driver successfully blocked from client payment-method endpoint.");

    // --- FUNCTIONAL STATE TRANSITIONS VIA API ENDPOINTS ---
    console.log("\n[5] Client accepts bid via POST /api/jobs/accept (Expected: 200 OK & Paymee URL)...");
    const validAcceptRequest = new Request('http://localhost/api/jobs/accept', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${clientToken}`,
        'Content-Type': 'application/json',
        'x-forwarded-for': testIp
      },
      body: JSON.stringify({ job_id: jobId, bid_id: bidId, client_id: clientId })
    });
    
    process.env.PAYMEE_TOKEN = process.env.PAYMEE_TOKEN || 'dummy_token';
    const validAcceptRes = await acceptRoute(validAcceptRequest);
    const validAcceptBody = await validAcceptRes.json();
    console.log(`    Status: ${validAcceptRes.status} | Body: ${JSON.stringify(validAcceptBody)}`);
    
    if (validAcceptRes.status !== 200 || !validAcceptBody.success) {
      throw new Error("API call failed: Client could not accept bid through accept endpoint!");
    }
    console.log("    ✅ Client accepted bid through API route. Status is now payment_pending.");

    // Try illegal transitions
    console.log("\n[6] Testing illegal transitions via API endpoints (Expected: 500/400 validation failures)...");
    
    const illegalCompleteRequest = new Request('http://localhost/api/jobs/complete', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${driverToken}`,
        'Content-Type': 'application/json',
        'x-forwarded-for': testIp
      },
      body: JSON.stringify({ job_id: jobId, driver_id: driverId, delivery_photo_url: 'https://proof.jpg' })
    });
    const illegalCompleteRes = await completeRoute(illegalCompleteRequest);
    const illegalCompleteBody = await illegalCompleteRes.json();
    console.log(`    Complete Status: ${illegalCompleteRes.status} | Body: ${JSON.stringify(illegalCompleteBody)}`);
    if (illegalCompleteRes.status !== 500 || !illegalCompleteBody.error.includes('State transition')) {
      throw new Error("Security check failed: Illegal state transition went uncaught!");
    }
    console.log("    ✅ Illegal transition blocked correctly by bookingService guard.");

    // Simulate Payment Success in DB
    console.log("\n[7] Simulating payment success (Updating DB job status payment_pending -> matched)...");
    const { error: matchErr } = await adminSupabase.from('jobs').update({ status: 'matched' }).eq('id', jobId);
    if (matchErr) throw matchErr;
    console.log("✅ Job status updated to 'matched' in DB.");

    // Driver starts job (Transitions matched -> in_progress)
    console.log("\n[8] Driver starts job via POST /api/jobs/update-status (Expected: 200 OK)...");
    const validStatusRequest = new Request('http://localhost/api/jobs/update-status', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${driverToken}`,
        'Content-Type': 'application/json',
        'x-forwarded-for': testIp
      },
      body: JSON.stringify({ job_id: jobId, driver_id: driverId, status: 'in_progress' })
    });
    const validStatusRes = await updateStatusRoute(validStatusRequest);
    const validStatusBody = await validStatusRes.json();
    console.log(`    Status: ${validStatusRes.status} | Body: ${JSON.stringify(validStatusBody)}`);
    if (validStatusRes.status !== 200 || !validStatusBody.success) {
      throw new Error("API call failed: Driver could not update status to in_progress!");
    }
    console.log("    ✅ Driver successfully updated job status to in_progress.");

    // Driver completes job (Transitions in_progress -> completed)
    console.log("\n[9] Driver completes job via POST /api/jobs/complete (Expected: 200 OK)...");
    const validCompleteRequest = new Request('http://localhost/api/jobs/complete', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${driverToken}`,
        'Content-Type': 'application/json',
        'x-forwarded-for': testIp
      },
      body: JSON.stringify({ job_id: jobId, driver_id: driverId, delivery_photo_url: 'https://test-photo.com/delivery.jpg', delivery_photo_lat: 36.88, delivery_photo_lng: 10.32 })
    });
    const validCompleteRes = await completeRoute(validCompleteRequest);
    const validCompleteBody = await validCompleteRes.json();
    console.log(`    Status: ${validCompleteRes.status} | Body: ${JSON.stringify(validCompleteBody)}`);
    if (validCompleteRes.status !== 200 || !validCompleteBody.success) {
      throw new Error("API call failed: Driver could not complete job!");
    }
    console.log("    ✅ Driver successfully completed job through route.");

    // Verify Audit Logs Table
    console.log("\n[10] Verifying audit_logs entries in the database...");
    const { data: logs, error: logsErr } = await adminSupabase
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

    console.log("\n🎉 ALL STATE MACHINE, ROLE GUARDS, & AUDIT LOG VERIFICATIONS PASSED SUCCESSFULLY!");

  } catch (err: any) {
    console.error("\n❌ VERIFICATION FAILED:", err.message);
    process.exit(1);
  } finally {
    console.log("\n🧹 Cleaning up mock test database traces...");
    if (jobId) {
      await adminSupabase.from('wallet_transactions').delete().eq('job_id', jobId);
      await adminSupabase.from('loyalty_transactions').delete().eq('job_id', jobId);
      await adminSupabase.from('messages').delete().filter('conversation_id', 'in', 
        adminSupabase.from('conversations').select('id').eq('job_id', jobId)
      );
      await adminSupabase.from('conversations').delete().eq('job_id', jobId);
      await adminSupabase.from('audit_logs').delete().eq('entity_id', jobId);
      await adminSupabase.from('bids').delete().eq('job_id', jobId);
      await adminSupabase.from('jobs').delete().eq('id', jobId);
    }
    if (driverId) {
      await adminSupabase.from('drivers').delete().eq('id', driverId);
      await adminSupabase.from('users').delete().eq('id', driverId);
      await adminSupabase.auth.admin.deleteUser(driverId);
    }
    if (clientId) {
      await adminSupabase.from('users').delete().eq('id', clientId);
      await adminSupabase.auth.admin.deleteUser(clientId);
    }
    console.log("✅ Cleanup completed.");
  }
}

// Admin client to bypass RLS
const adminSupabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// User client to perform auth operations
const userSupabase = createClient(supabaseUrl, anonKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

runTests();
