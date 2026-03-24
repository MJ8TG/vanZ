// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendPushNotification } from "../_shared/push.ts";

const twilioSid = Deno.env.get("TWILIO_SID");
const twilioToken = Deno.env.get("TWILIO_AUTH_TOKEN");
const twilioFrom = Deno.env.get("TWILIO_PHONE_NUMBER");
const adminPhone = "+21651905711" || "+21600000000";

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

serve(async (req: Request) => {
  try {
    const payload = await req.json();

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // If payload is HTTP call
    if (payload.action === 'trigger_sos') {
      const { user_id, lat, lng, type } = payload;
      
      const { data: user } = await supabaseAdmin.from('users').select('first_name, last_name, phone').eq('id', user_id).single();
      const userName = user ? `${user.first_name} ${user.last_name}` : 'Utilisateur Inconnu';
      const userPhone = user?.phone || 'Pas de numéro';

      const mapsLink = lat && lng ? `\nhttps://maps.google.com/?q=${lat},${lng}` : '';
      const msg = `🚨 ALERTE SOS 🚨\nType: ${type}\nDe: ${userName} (${userPhone})${mapsLink}`;

      await sendSms(adminPhone, msg);
      
      // Look for Admin User ID if we want to Push to admin? 
      // The fastest way is to send an SMS for SOS. But if there is a known admin UUID, we could query it.
      // E.g. role='admin'
      const { data: admins } = await supabaseAdmin.from('users').select('id').eq('role', 'admin');
      if (admins) {
        for (const admin of admins) {
          await sendPushNotification(supabaseAdmin, admin.id, '🚨 ALERTE SOS', msg);
        }
      }

      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }

    // If payload is from DB webhook (System-Flag triggers, ex: 3 bad reviews)
    if (payload.record?.status === 'flagged') {
       const u = payload.record;
       const msg = `⚠️ COMPTE SIGNALÉ: ${u.first_name} ${u.last_name} (${u.phone}). Vérifiez le panel admin.`;
       await sendSms(adminPhone, msg);
       
       const { data: admins } = await supabaseAdmin.from('users').select('id').eq('role', 'admin');
       if (admins) {
         for (const admin of admins) {
           await sendPushNotification(supabaseAdmin, admin.id, '⚠️ COMPTE SIGNALÉ', msg);
         }
       }
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (err: any) {
    console.error('[sos-alert]', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 200 });
  }
});
