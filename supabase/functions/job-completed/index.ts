// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req: Request) => {
  try {
    const payload = await req.json();
    const { record } = payload;
    
    // Webhook executes solely on INSERT or UPDATE when status transitions to 'completed'
    if (!record || record.status !== 'completed') {
      return new Response(JSON.stringify({ ok: true, ignored: true }), { status: 200 });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const jobId = record.id;

    // 1. Guard against double execution
    const { data: job } = await supabaseAdmin
      .from('jobs')
      .select('commission_amount, payment_status, payment_method, driver_id, commission_rate, accepted_bid_id, bids(amount)')
      .eq('id', jobId)
      .single();

    if (!job || job.commission_amount !== null) {
      console.log(`[job-completed] Already processed or missing for ${jobId}`);
      return new Response(JSON.stringify({ ok: true, msg: 'Already processed' }), { status: 200 });
    }

    const acceptedAmount = job.bids?.amount || 0;
    const rate = job.commission_rate || 0.15;
    const commission = Math.round(acceptedAmount * rate);
    const driverPayout = acceptedAmount - commission;

    // 2. Track commission strictly mapped entirely natively
    await supabaseAdmin.from('jobs').update({
      commission_amount: commission,
      driver_payout: driverPayout
    }).eq('id', jobId);

    // 3. Cash jobs vs Online jobs logic
    if (job.payment_method === 'cash') {
       // Driver owes VanZ the commission. Deduct from credit (creating debt).
       await supabaseAdmin.rpc('increment_credit_balance', { user_id: job.driver_id, amount: -commission });
       
       // Explicit pending commission tracking
       const { data: dData } = await supabaseAdmin.from('users').select('pending_commission_debt').eq('id', job.driver_id).single();
       await supabaseAdmin.from('users')
         .update({ pending_commission_debt: (dData?.pending_commission_debt || 0) + commission })
         .eq('id', job.driver_id);
         
    } else {
       // Online Payment: add the pure payout directly!
       await supabaseAdmin.rpc('increment_credit_balance', { user_id: job.driver_id, amount: driverPayout });
    }

    // 4. Force rigidly bound PDF Receipt generation trigger seamlessly linked here!
    await supabaseAdmin.functions.invoke('receipt-generator', {
      body: { job_id: jobId }
    });

    return new Response(JSON.stringify({ ok: true, commission, driverPayout }), { status: 200 });
  } catch (err: any) {
    console.error('[job-completed]', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 200 }); // Prevent recursive failing
  }
});
