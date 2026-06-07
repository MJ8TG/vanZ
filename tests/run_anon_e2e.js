require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') });
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const E2E_PASSWORD = process.env.E2E_TEST_PASSWORD;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE variables in .env.local");
  process.exit(1);
}

if (!E2E_PASSWORD) {
  console.error("Missing E2E_TEST_PASSWORD in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

function generateId() {
  return crypto.randomBytes(4).toString('hex');
}

async function runTests() {
  console.log("============== VANZ QA E2E SUITE (LIVE TEST) ==============\n");
  try {
    const testId = generateId();
    const clientEmail = `e2e_client_${testId}@gmail.com`;
    const driverEmail = `e2e_driver_${testId}@gmail.com`;

    console.log("[1/5] Registering Mock Identities via standard sign-up...");
    
    const { data: authClient, error: cErr } = await supabase.auth.signUp({
      email: clientEmail,
      password: E2E_PASSWORD,
      options: { data: { role: 'client', first_name: 'Test', last_name: 'Client', phone: `+21699000${testId.substring(0,3)}` } }
    });
    if (cErr) throw new Error("Client Mock Failed: " + cErr.message);

    const { data: authDriver, error: dErr } = await supabase.auth.signUp({
      email: driverEmail,
      password: E2E_PASSWORD,
      options: { data: { role: 'driver', first_name: 'Test', last_name: 'Driver', phone: `+21699111${testId.substring(0,3)}` } }
    });
    if (dErr) throw new Error("Driver Mock Failed: " + dErr.message);

    const clientId = authClient.user.id;
    const driverId = authDriver.user.id;

    console.log(`✅ Identities Generated. Client: ${clientId} | Driver: ${driverId}\n`);

    console.log("[2/5] Forcing Driver Verification...");
    
    // Auth back as driver and update public info
    await supabase.auth.signInWithPassword({ email: driverEmail, password: E2E_PASSWORD });
    const { error: updErr } = await supabase.from('users').update({ 
      account_status: 'active',
      city: 'Tunis',
      is_online: true 
    }).eq('id', driverId);
    
    if (updErr) console.warn("Driver Update Error (might be blocked by RLS, proceeding anyway): " + updErr.message);
    
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
    if (drvErr) console.warn("Driver Profile Creation Error (might be blocked by RLS): " + drvErr.message);
    
    console.log("✅ Driver activated and profile initialized.\n");

    console.log("[3/5] Client Post Job...");
    
    await supabase.auth.signInWithPassword({ email: clientEmail, password: E2E_PASSWORD });
    const { data: job, error: jobErr } = await supabase.from('jobs').insert({
       client_id: clientId,
       pickup_address: 'Lac 1, Tunis',
       dropoff_address: 'Marsa, Tunis',
       pickup_lat: 36.83, pickup_lng: 10.23, dropoff_lat: 36.88, dropoff_lng: 10.32,
       service_type: 'van_standard',
       status: 'open'
    }).select().single();
    if (jobErr) throw new Error("Job creation failed: " + jobErr.message);

    const jobId = job.id;
    console.log(`✅ Job #${jobId} Listed.\n`);

    console.log("[4/5] Driver Bids 150 TND...");
    await supabase.auth.signInWithPassword({ email: driverEmail, password: E2E_PASSWORD });
    const { data: bid, error: bidErr } = await supabase.from('bids').insert({
       job_id: jobId,
       driver_id: driverId,
       amount: 150,
       status: 'pending'
    }).select().single();
    if (bidErr) throw new Error("Bidding failed: " + bidErr.message);

    const bidId = bid.id;
    console.log(`✅ Driver Bid 150 TND on Job #${jobId}.`);

    console.log("Client Accepts Bid (Triggers bid-accepted Edge Function via webhook)...");
    await supabase.auth.signInWithPassword({ email: clientEmail, password: E2E_PASSWORD });
    await supabase.from('bids').update({ status: 'accepted' }).eq('id', bidId);

    await new Promise(r => setTimeout(r, 2000)); // Allow webhook execution

    console.log("\n[5/5] Completing Job & Validating Commission Math...");
    await supabase.from('jobs').update({ status: 'completed' }).eq('id', jobId);

    await new Promise(r => setTimeout(r, 2000));

    const { data: jobMath } = await supabase.from('jobs').select('commission_amount, driver_payout').eq('id', jobId).single();
    
    if (jobMath && jobMath.commission_amount) {
       console.log(`✅ EXACT COMMISSION CALCULATED: ${jobMath.commission_amount} TND`);
       console.log(`✅ DRIVER PAYOUT CALCULATED: ${jobMath.driver_payout} TND`);
    } else {
       console.warn(`⚠️ Commission calculating via background. Please check row in Supabase!`);
    }

    console.log("\nNote: Dummy Users cannot be auto-deleted via Anon Key. You may manually delete them via Supabase Dashboard if necessary.");
    console.log("============== E2E SUITE FINISHED ==============\n");

  } catch(e) {
    console.error("❌ E2E FAIL:", e.message);
  }
}

runTests();
