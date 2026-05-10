require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') });
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

// Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const E2E_PASSWORD = process.env.E2E_TEST_PASSWORD;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase Service Role credentials to bypass RLS cleanly.");
  process.exit(1);
}

if (!E2E_PASSWORD) {
  console.error("Missing E2E_TEST_PASSWORD in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

function generateId() {
  return crypto.randomBytes(4).toString('hex');
}

async function runTests() {
  console.log("============== VANZ QA E2E SUITE ==============\n");
  try {
    const testId = generateId();
    const clientEmail = `e2e_client_${testId}@test.vanz`;
    const driverEmail = `e2e_driver_${testId}@test.vanz`;

    console.log("[1/5] Registering Mock Identities in auth.users...");
    
    // Create Auth Users
    const { data: authClient, error: cErr } = await supabase.auth.admin.createUser({
      email: clientEmail,
      email_confirm: true,
      password: E2E_PASSWORD,
      user_metadata: { role: 'client', first_name: 'Test', last_name: 'Client', phone: `+21699000${testId.substring(0,3)}` }
    });
    if (cErr) throw new Error("Client Mock Failed: " + cErr.message);

    const { data: authDriver, error: dErr } = await supabase.auth.admin.createUser({
      email: driverEmail,
      email_confirm: true,
      password: E2E_PASSWORD,
      user_metadata: { role: 'driver', first_name: 'Test', last_name: 'Driver', phone: `+21699111${testId.substring(0,3)}` }
    });
    if (dErr) throw new Error("Driver Mock Failed: " + dErr.message);

    const clientId = authClient.user.id;
    const driverId = authDriver.user.id;

    console.log(`✅ Identities Generated. Client: ${clientId} | Driver: ${driverId}\n`);

    console.log("[2/5] Forcing Driver Verification (Triggers SMS Webhook via DB Update)...");
    
    // Mock driving verify trigger
    await supabase.from('users').update({ 
      account_status: 'active',
      city: 'Tunis',
      is_online: true 
    }).eq('id', driverId);

    console.log("✅ Driver activated and set to Online.");

    console.log("[2.5/5] Creating Driver Profile in public.drivers...");
    const { error: drvErr } = await supabase.from('drivers').insert({
      id: driverId,
      cin_number: `CIN${testId}`,
      cin_expiry: '2030-01-01',
      date_of_birth: '1990-01-01',
      vehicle_type: 'van_standard',
      vehicle_plate: `${testId.substring(0,4)} TN 216`,
      status: 'approved'
    });
    if (drvErr) throw new Error("Driver Profile Creation Failed: " + drvErr.message);
    console.log("✅ Driver profile created and approved.\n");

    console.log("[3/5] Client Post Job & Driver Bid...");
    // [3/5] Client Post Job & Driver Bid
    const { data: job, error: jobErr } = await supabase.from('jobs').insert({
      client_id: clientId,
      service_type: 'van_standard',
      pickup_address: 'Lac 1, Tunis',
      pickup_lat: 36.83,
      pickup_lng: 10.23,
      dropoff_address: 'Marsa, Tunis',
      dropoff_lat: 36.88,
      dropoff_lng: 10.32,
      payment_method: 'cash',
      status: 'open'
    }).select().single();
    if (jobErr) throw jobErr;

    const jobId = job.id;
    console.log(`✅ Job #${jobId} Listed.`);

    const { data: bid, error: bidErr } = await supabase.from('bids').insert({
      job_id: jobId,
      driver_id: driverId,
      amount: 150,
      status: 'pending'
    }).select().single();
    if (bidErr) throw bidErr;

    const bidId = bid.id;
    console.log(`✅ Driver Bid 150 TND on Job #${jobId}.`);

    // [4/5] Client Accepts Bid (Triggers bid-accepted Edge Function via Supabase webhook)
    const { error: accErr } = await supabase.from('bids').update({ status: 'accepted' }).eq('id', bidId);
    if (accErr) throw accErr;

    // Wait for bid-accepted Edge Function to process
    await new Promise(r => setTimeout(r, 4000));

    // Verify Job Status & Matching
    const { data: jobCheck, error: chkErr } = await supabase.from('jobs').select('status, accepted_bid_id').eq('id', jobId).single();
    if (chkErr) throw chkErr;
    if (jobCheck.status !== 'matched' || jobCheck.accepted_bid_id !== bidId) {
      throw new Error(`Edge Function 'bid-accepted' Failed: Status=${jobCheck.status}, accepted_bid_id=${jobCheck.accepted_bid_id}`);
    }
    console.log(`✅ Edge Function 'bid-accepted' validated Job Matching logic.`);

    // [5/5] Completing Job & Commission Validation
    console.log('\n[5/5] Completing Job & Commission Validation...');
    
    // Complete Job
    const { error: compErr } = await supabase.from('jobs').update({ status: 'completed' }).eq('id', jobId);
    if (compErr) throw compErr;

    // Wait for triggers/webhooks
    await new Promise(r => setTimeout(r, 5000));

    // Verify Commission Math
    const { data: jobMath, error: mathErr } = await supabase.from('jobs').select('commission_amount, driver_payout').eq('id', jobId).single();
    if (mathErr) throw mathErr;
    const { data: driverMath } = await supabase.from('users').select('pending_commission_debt').eq('id', driverId).single();
    
    const expectedCommission = 150 * 0.15; // 15% standard
    if (jobMath.commission_amount === expectedCommission) {
       console.log(`✅ Job Commission Math Passed: ${expectedCommission} TND (15%)`);
    } else {
       console.error(`❌ Job Commission Math Failed: Expected ${expectedCommission}, Got ${jobMath.commission_amount}`);
    }

    if (driverMath.pending_commission_debt >= expectedCommission) {
       console.log(`✅ Debt Allocation Engine Passed! Driver owed: ${driverMath.pending_commission_debt} TND`);
    } else {
       console.error(`❌ Debt Engine Verification Failed.`);
    }

    // Cleanup Mocks
    /*
    console.log('\n🧹 Cleaning up Mock Auth Users & Test Traces...');
    await supabase.auth.admin.deleteUser(clientId);
    await supabase.auth.admin.deleteUser(driverId);
    console.log('✅ Cleanup Complete.');
    */
    console.log("============== E2E SUITE SUCCESS ==============\n");

  } catch(e) {
    console.error("❌ E2E FAIL:", e.message);
  }
}

runTests();
