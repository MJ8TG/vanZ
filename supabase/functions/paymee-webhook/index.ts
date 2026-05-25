import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

async function md5(str: string): Promise<string> {
  const data = new TextEncoder().encode(str);
  const hashBuffer = await crypto.subtle.digest("MD5", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0')).join('');
}

serve(async (req: Request) => {
  try {
    const webhookPayload = await req.json();
    const VENDOR_TOKEN = Deno.env.get("PAYMEE_VENDOR_TOKEN") ?? "";

    // 1. Verify signature
    const expected = await md5(
      `${webhookPayload.token}${webhookPayload.amount}${webhookPayload.payment_status ? "1" : "0"}${VENDOR_TOKEN}`
    );
    if (webhookPayload.check_sum?.toLowerCase() !== expected.toLowerCase()) {
      console.error('[paymee-webhook] Invalid check_sum');
      return new Response('Invalid signature', { status: 401 });
    }

    // Verify payment status is strictly 'paid'
    if (webhookPayload.payment_status !== true) {
       return new Response('Payment not completed', { status: 200 });
    }

    const url = new URL(req.url);
    const jobIdRaw = url.searchParams.get('job_id') || webhookPayload.note?.replace('VanZ Job #', '');
    if (!jobIdRaw) {
       return new Response('Missing Job ID', { status: 200 });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Verify the amount strictly matches the commission amount to block spoofers
    const { data: job } = await supabaseAdmin.from('jobs')
      .select('id, accepted_bid_id, commission_amount, driver_payout')
      .eq('id', jobIdRaw)
      .single();

    if (!job || job.commission_amount == null || !job.accepted_bid_id) {
       return new Response('Job or commission amount missing', { status: 200 });
    }

    // Float normalization
    if (Math.abs(Number(webhookPayload.amount) - Number(job.commission_amount)) > 0.01) {
       console.error('AMOUNT MISMATCH — possible fraud attempt');
       return new Response('Amount mismatch error', { status: 200 });
    }

    // 1. ATOMIC: Update job → matched
    await supabaseAdmin.from('jobs').update({
       paymee_ref: webhookPayload.reference || webhookPayload.token,
       status: 'matched'
    }).eq('id', job.id);

    // 2. ATOMIC: Accept this bid
    await supabaseAdmin
      .from('bids')
      .update({ status: 'accepted' })
      .eq('id', job.accepted_bid_id);

    // 3. ATOMIC: Reject all other bids for this job
    await supabaseAdmin
      .from('bids')
      .update({ status: 'rejected' })
      .eq('job_id', job.id)
      .neq('id', job.accepted_bid_id)
      .eq('status', 'pending');

    // 4. ATOMIC: Transition conversation phase → post_acceptance
    const { data: acceptedBid } = await supabaseAdmin
      .from('bids')
      .select('driver_id, amount')
      .eq('id', job.accepted_bid_id)
      .single();

    if (acceptedBid) {
      const { data: conversation } = await supabaseAdmin
        .from('conversations')
        .update({ phase: 'post_acceptance' })
        .eq('job_id', job.id)
        .eq('driver_id', acceptedBid.driver_id)
        .select('id')
        .single();

      if (conversation) {
        await supabaseAdmin.from('messages').insert({
          conversation_id: conversation.id,
          sender_type: 'system',
          type: 'system',
          content: `✅ Paiement de commission réussi ! Offre de ${acceptedBid.amount} TND acceptée. Reste à payer au chauffeur : ${job.driver_payout} TND ! Vous pouvez maintenant échanger des photos, messages vocaux et coordonnées. Bonne course !`
        });
      }

      // 5. Archive conversations with rejected drivers
      await supabaseAdmin
        .from('conversations')
        .update({ phase: 'archived' })
        .eq('job_id', job.id)
        .neq('driver_id', acceptedBid.driver_id);
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (err: any) {
    console.error(err);
    // Explicit 200 termination natively prevents recurring loops globally
    return new Response(JSON.stringify({ ok: false }), { status: 200 });
  }
});
