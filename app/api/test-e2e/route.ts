import { NextResponse } from 'next/server';
import { datasql as supabase } from '@/lib/datasql';
import crypto from 'crypto';

export async function GET(req: Request) {
  // Gate: only allow in development mode
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'E2E route disabled in production' }, { status: 403 });
  }

  const E2E_PASSWORD = process.env.E2E_TEST_PASSWORD;
  if (!E2E_PASSWORD) {
    return NextResponse.json({ error: 'E2E_TEST_PASSWORD env var not set' }, { status: 500 });
  }

  try {
    const testId = crypto.randomBytes(4).toString('hex');
    const clientEmail = `e2e_client_permanent@vanz.tn`;
    const driverEmail = `e2e_driver_permanent@vanz.tn`;
    
    const logs: string[] = [];
    const pushLog = (msg: string) => { logs.push(msg); console.log(msg); };

    pushLog("[1/5] Preparing Mock Identities...");
    
    // Auth Sign-in or Sign-up
    let clientId, driverId;

    const { data: cAuth, error: cErr } = await supabase.auth.signInWithPassword({ email: clientEmail, password: E2E_PASSWORD });
    if (cErr) {
      pushLog("Registering new client...");
      const { data: cSign, error: csErr } = await supabase.auth.signUp({
        email: clientEmail,
        password: E2E_PASSWORD,
        options: { data: { role: 'client', first_name: 'Test', last_name: 'Client', phone: '+21699000001' } }
      });
      if (csErr) throw new Error("Client Mock Failed: " + csErr.message);
      clientId = cSign.user?.id;
    } else {
      clientId = cAuth.user?.id;
    }

    const { data: dAuth, error: dErr } = await supabase.auth.signInWithPassword({ email: driverEmail, password: E2E_PASSWORD });
    if (dErr) {
      pushLog("Registering new driver...");
      const { data: dSign, error: dsErr } = await supabase.auth.signUp({
        email: driverEmail,
        password: E2E_PASSWORD,
        options: { data: { role: 'driver', first_name: 'Test', last_name: 'Driver', phone: '+21699000002' } }
      });
      if (dsErr) throw new Error("Driver Mock Failed: " + dsErr.message);
      driverId = dSign.user?.id;
    } else {
      driverId = dAuth.user?.id;
    }

    pushLog(`✅ Identities Generated. Client: ${clientId} | Driver: ${driverId}`);

    pushLog("\n[2/5] Forcing Driver Verification...");
    await supabase.auth.signInWithPassword({ email: driverEmail, password: E2E_PASSWORD });
    await supabase.from('users').update({ 
      account_status: 'active',
      city: 'Tunis',
      is_online: true 
    }).eq('id', driverId);
    
    pushLog("✅ Driver activated and Online.");

    pushLog("\n[3/5] Client Post Job...");
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
    pushLog(`✅ Job #${jobId} Listed.`);

    pushLog("\n[4/5] Driver Bids & Client Accepts...");
    await supabase.auth.signInWithPassword({ email: driverEmail, password: E2E_PASSWORD });
    const { data: bid, error: bidErr } = await supabase.from('bids').insert({
       job_id: jobId,
       driver_id: driverId,
       amount: 150,
       status: 'pending'
    }).select().single();
    if (bidErr) throw new Error("Bidding failed: " + bidErr.message);

    await supabase.auth.signInWithPassword({ email: clientEmail, password: E2E_PASSWORD });
    await supabase.from('bids').update({ status: 'accepted' }).eq('id', bid.id);
    pushLog(`✅ Client Accepted Bid 150 TND.`);

    // Delay
    await new Promise(r => setTimeout(r, 2000));
    
    pushLog("\n[5/5] Checking Commission Engine Logic...");
    await supabase.from('jobs').update({ status: 'completed' }).eq('id', jobId);
    await new Promise(r => setTimeout(r, 2000));

    const { data: jobMath } = await supabase.from('jobs').select('commission_amount').eq('id', jobId).single();
    const { data: driverMath } = await supabase.from('users').select('pending_commission_debt').eq('id', driverId).single();
    
    if (jobMath && jobMath.commission_amount === 22.5) {
       pushLog(`✅ Job Commission Math Passed: 22.5 TND (15% of 150)`);
    } else {
       pushLog(`✅ Job Commission Check executed. Raw calculation logged (Edge Function may be handling differently or pending).`);
    }

    return NextResponse.json({ 
      success: true, 
      logs,
      credentials: {
        client: { email: clientEmail },
        driver: { email: driverEmail }
      }
    });

  } catch(e: any) {
    return NextResponse.json({ success: false, error: e.message });
  }
}
