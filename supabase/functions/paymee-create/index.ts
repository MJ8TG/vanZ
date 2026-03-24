// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const PAYMEE_TOKEN = Deno.env.get("PAYMEE_TOKEN");

serve(async (req: Request) => {
  try {
    const { job_id } = await req.json();

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: job, error } = await supabaseAdmin
      .from('jobs')
      .select('id, client_id, accepted_bid_id, bids(amount), users!jobs_client_id_fkey(first_name, last_name, phone)')
      .eq('id', job_id)
      .single();

    if (error || !job) throw new Error("Job invalide.");

    const client = job.users;
    const amount = job.bids?.amount;

    if (!amount) throw new Error("Aucun montant disponible.");

    const BASE_URL = process.env.BASE_URL ?? "https://vanz.tn";
    const SUPABASE_FUNCTIONS_URL = Deno.env.get("SUPABASE_URL") + "/functions/v1";

    const paymeeResponse = await fetch('https://sandbox.paymee.tn/api/v2/payments/create', { // USING SANDBOX URL For dev
      method: 'POST',
      headers: { 'Authorization': `Token ${PAYMEE_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: amount,
        note: `VanZ Job #${job.id}`,
        first_name: client?.first_name || 'Client',
        last_name: client?.last_name || 'VanZ',
        phone: client?.phone || '+21620000000',
        return_url: `${BASE_URL}/jobs/${job.id}/payment-success`,
        cancel_url: `${BASE_URL}/jobs/${job.id}/payment-cancel`,
        webhook_url: `${SUPABASE_FUNCTIONS_URL}/paymee-webhook`
      })
    });

    const body = await paymeeResponse.json();

    if (!body || !body.data || !body.data.payment_url) {
      throw new Error(`Erreur gateway: ${JSON.stringify(body)}`);
    }

    return new Response(JSON.stringify({ url: body.data.payment_url }), {
      headers: { "Content-Type": "application/json" },
      status: 200
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 400 });
  }
});
