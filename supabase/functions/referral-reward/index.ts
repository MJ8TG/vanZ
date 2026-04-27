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
    const payload = await req.json();
    const { record, old_record } = payload;
    
    if (record.status !== 'completed' || old_record?.status === 'completed') {
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const driverId = record.driver_id;
    const referrerData = await supabaseAdmin.from('referrals').select('referrer_id').eq('referred_id', driverId).eq('status', 'pending').single();
    
    if (!referrerData.data) {
       return new Response(JSON.stringify({ ok: true, msg: 'No pending referral found' }), { status: 200 });
    }

    const referrerId = referrerData.data.referrer_id;

    // Check completed jobs 
    const { count } = await supabaseAdmin.from('jobs').select('*', { count: 'exact', head: true }).eq('driver_id', driverId).eq('status', 'completed');
    if (count !== null && count > 1) {
       return new Response(JSON.stringify({ ok: true, msg: 'Not first job' }), { status: 200 });
    }

    // Process logic
    await supabaseAdmin.rpc('process_referral_reward', { referrer: referrerId, referred: driverId, amount: 10 });
    
    const { data: user } = await supabaseAdmin.from('users').select('phone').eq('id', referrerId).single();
    if (user?.phone) {
       const msg = "Bonus de parrainage: 10 TND ajoutés à votre portefeuille !";
       await sendSms(user.phone, msg);
       await sendPushNotification(supabaseAdmin, referrerId, "Bonus Parrainage !", msg);
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (err: any) {
    console.error('[referral-reward]', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 200 });
  }
});
