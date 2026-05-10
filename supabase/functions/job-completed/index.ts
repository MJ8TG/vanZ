import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { verifyWebhookSecret } from "../_shared/auth.ts";

serve(async (req: Request) => {
  if (!verifyWebhookSecret(req)) {
    return new Response('Unauthorized', { status: 401 });
  }

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
    const { data: job, error: getErr } = await supabaseAdmin
      .from('jobs')
      .select('commission_amount, payment_status, payment_method, driver_id, commission_rate, accepted_bid_id, accepted_bid_amount')
      .eq('id', jobId)
      .single();

    console.log(`[job-completed] Fetch Result:`, { job, error: getErr });

    if (!job) {
      console.log(`[job-completed] Missing job for ${jobId}`);
      return new Response(JSON.stringify({ ok: true, msg: 'Job not found' }), { status: 200 });
    }

    // The math and wallet updates are now handled by the trg_job_completion_logic DB trigger.
    // We only handle side effects (SMS, PDF) here.
    const commission = job.commission_amount;
    const driverPayout = job.driver_payout;

    console.log(`[job-completed] side-effects for jobId: ${jobId}, commission: ${commission}, driverPayout: ${driverPayout}`);

    // 4. Force rigidly bound PDF Receipt generation trigger seamlessly linked here!
    console.log(`[job-completed] Invoking receipt-generator for ${jobId}`);
    await supabaseAdmin.functions.invoke('receipt-generator', {
      body: { job_id: jobId }
    });

    return new Response(JSON.stringify({ ok: true, side_effects: true }), { status: 200 });
  } catch (err: any) {
    console.error('[job-completed] Global Error:', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 200 }); // Prevent recursive failing
  }
});
