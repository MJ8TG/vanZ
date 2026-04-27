// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendPushNotification } from "../_shared/push.ts";

const twilioSid = Deno.env.get("TWILIO_SID");
const twilioToken = Deno.env.get("TWILIO_AUTH_TOKEN");
const twilioFrom = Deno.env.get("TWILIO_PHONE_NUMBER");

async function sendSms(to: string, body: string) {
  if (twilioSid && twilioToken && twilioFrom) {
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": "Basic " + btoa(`${twilioSid}:${twilioToken}`)
      },
      body: new URLSearchParams({ To: to, From: twilioFrom, Body: body }).toString()
    });
    return res.json();
  } else {
    console.log('[SMS fallback]', to, body);
  }
}

async function injectSystemMessage(supabase: any, conversationId: string, content: string) {
  await supabase.from('messages').insert({
    conversation_id: conversationId,
    sender_id: null,
    sender_type: 'system',
    type: 'system',
    content
  });
}

serve(async (req: Request) => {
  try {
    const payload = await req.json();
    const { record, old_record } = payload;
    
    // Only proceed if status CHANGED to accepted
    if (record.status !== 'accepted' || old_record?.status === 'accepted') {
       return new Response(JSON.stringify({ ok: true, ignored: true }), { status: 200 });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const jobId = record.job_id;
    const acceptedDriverId = record.driver_id;

    // 1. UPDATE all other bids on the same job_id -> status = 'rejected'
    await supabaseAdmin
      .from('bids')
      .update({ status: 'rejected' })
      .eq('job_id', jobId)
      .neq('id', record.id);

    // 2. UPDATE job -> status = 'confirmed', accepted_bid_id = bid.id
    const { data: job } = await supabaseAdmin
      .from('jobs')
      .update({ 
        status: 'confirmed', 
        accepted_bid_id: record.id,
        accepted_bid_amount: record.amount
      })
      .eq('id', jobId)
      .select('client_id, users!jobs_client_id_fkey(phone)')
      .single();

    // 3. UPDATE conversation for that driver -> phase = 'post_acceptance'
    const { data: conv } = await supabaseAdmin
      .from('conversations')
      .update({ phase: 'post_acceptance' })
      .eq('job_id', jobId)
      .eq('driver_id', acceptedDriverId)
      .select('id')
      .single();

    if (conv) {
      await injectSystemMessage(supabaseAdmin, conv.id, 'Offre acceptée — le job est confirmé !');
    }

    // 4. Archive OTHER conversations
    await supabaseAdmin
      .from('conversations')
      .update({ phase: 'archived' })
      .eq('job_id', jobId)
      .neq('driver_id', acceptedDriverId);

    // 5. Send dual SMS + PUSH to accepted driver
    const { data: driverUser } = await supabaseAdmin.from('users').select('phone, id').eq('id', acceptedDriverId).single();
    if (driverUser?.phone) {
      await sendSms(driverUser.phone, `Votre offre de ${record.amount} TND a été acceptée ! Job confirmé.`);
      await sendPushNotification(supabaseAdmin, driverUser.id, 'Offre Acceptée !', `Votre offre de ${record.amount} TND a été acceptée.`);
    }

    // 6. Send dual SMS + PUSH to rejected drivers
    const { data: rejectedBids } = await supabaseAdmin.from('bids').select('driver_id, drivers!inner(users(id, phone))').eq('job_id', jobId).eq('status', 'rejected');
    if (rejectedBids) {
      for (const b of rejectedBids) {
        const u = b.drivers?.users;
        if (u?.phone) {
          await sendSms(u.phone, `Votre offre n'a pas été retenue pour ce job.`);
          await sendPushNotification(supabaseAdmin, u.id, 'Offre non retenue', 'Votre offre n\'a pas été retenue pour ce job.');
        }
      }
    }

    // 7. Send SMS + PUSH to client
    if (job?.users?.phone) {
       await sendSms(job.users.phone, `Vous avez confirmé un chauffeur. Contactez-le pour les détails.`);
       await sendPushNotification(supabaseAdmin, job.client_id, 'Chauffeur Confirmé', 'Vous avez confirmé un chauffeur. Rejoignez le chat pour les détails.');
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (err: any) {
    console.error('[bid-accepted]', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 200 });
  }
});
