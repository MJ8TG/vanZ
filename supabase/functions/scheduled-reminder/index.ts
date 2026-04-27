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

import { verifyWebhookSecret } from "../_shared/auth.ts";

serve(async (req: Request) => {
  if (!verifyWebhookSecret(req)) {
    return new Response('Unauthorized', { status: 401 });
  }
  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Find jobs starting in exactly 3 hours
    const threeHrsFromNow = new Date(Date.now() + 3 * 60 * 60 * 1000);
    const startRange = new Date(threeHrsFromNow.getTime() - 30 * 60 * 1000).toISOString();
    const endRange = new Date(threeHrsFromNow.getTime() + 30 * 60 * 1000).toISOString();

    const { data: upcomingJobs } = await supabaseAdmin
      .from('jobs')
      .select('id, pickup_time, client_id, accepted_bid_id, users!jobs_client_id_fkey(phone), drivers:accepted_bid_id(users!drivers_id_fkey(phone))')
      .eq('status', 'matched')
      .gte('pickup_time', startRange)
      .lte('pickup_time', endRange);

    if (upcomingJobs) {
      for (const job of upcomingJobs) {
         if (job.users?.phone) {
            const msg = `Rappel: Votre VanZ est réservé pour ${new Date(job.pickup_time).toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})}.`;
            await sendSms(job.users.phone, msg);
            await sendPushNotification(supabaseAdmin, job.client_id, "Rappel Réservation", msg);
         }
         
         const driverPhone = job.drivers?.users?.phone;
         if (driverPhone) {
            const msg = `Rappel: Vous avez une course prévue dans 3h. Consultez l'application pour les détails.`;
            await sendSms(driverPhone, msg);
            await sendPushNotification(supabaseAdmin, job.accepted_bid_id, "Rappel Réservation", msg);
         }
      }
    }

    // Review Prompting -> exactly 10 min after completion
    const completedJobs = await supabaseAdmin
      .from('jobs')
      .select('*')
      .eq('status', 'completed')
      .is('review_prompted_at', null)
      .lt('updated_at', new Date(Date.now() - 10 * 60 * 1000).toISOString());

    if (completedJobs.data) {
      for (const job of completedJobs.data) {
        await sendPushNotification(supabaseAdmin, job.client_id, 'Notez votre chauffeur !', 'Job terminé — donnez votre avis.');
        await sendPushNotification(supabaseAdmin, job.driver_id, 'Notez ce client !', 'Comment s\'est passé ce job ?');
        
        await supabaseAdmin.from('jobs').update({ review_prompted_at: new Date().toISOString() }).eq('id', job.id);
      }
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (err: any) {
    console.error('[scheduled-reminder]', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 200 });
  }
});
