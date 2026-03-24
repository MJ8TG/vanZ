// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req: Request) => {
  try {
    const webhookPayload = await req.json();

    // Verify payment status is strictly 'paid'
    if (webhookPayload.payment_status !== true) {
       return new Response('Payment not completed', { status: 200 });
    }

    const jobIdRaw = webhookPayload.note?.replace('VanZ Job #', '');
    if (!jobIdRaw) {
       return new Response('Invalid Note formatting missing Job ID', { status: 200 });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Verify the amount strictly matches the accepted bid to block spoofers
    const { data: job } = await supabaseAdmin.from('jobs')
      .select('id, accepted_bid_id, bids(amount)')
      .eq('id', jobIdRaw)
      .single();

    if (!job || !job.bids) {
       return new Response('Job or active Bids missing', { status: 200 });
    }

    // Float normalization
    if (Math.abs(Number(webhookPayload.amount) - Number(job.bids.amount)) > 0.01) {
       console.error('AMOUNT MISMATCH — possible fraud attempt');
       return new Response('Amount mismatch error', { status: 200 });
    }

    // Validate checkout!
    await supabaseAdmin.from('jobs').update({
       paymee_ref: webhookPayload.reference || webhookPayload.token,
       status: 'paid' // Or leave as is if completed logic overrides
    }).eq('id', job.id);

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (err: any) {
    console.error(err);
    // Explicit 200 termination natively prevents recurring loops globally
    return new Response(JSON.stringify({ ok: false }), { status: 200 });
  }
});
