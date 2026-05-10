import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendPushNotification } from "../_shared/push.ts";

const twilioSid = Deno.env.get("TWILIO_SID");
const twilioToken = Deno.env.get("TWILIO_AUTH_TOKEN");
const twilioFrom = Deno.env.get("TWILIO_PHONE_NUMBER");
const adminPhone = Deno.env.get("ADMIN_PHONE") ?? "+21600000000";

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
    const { type, record, old_record, notify_admin } = payload;
    
    // Explicit manual triggering logic (for Withdrawal UI hooks)
    if (type === 'withdrawal_success') {
       await sendSms(payload.phone, `Virement de ${payload.amount} TND envoyé sur votre compte.`);
       return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }

    // Default Webhook flow (Triggers on users/drivers table)
    if (!record) return new Response(JSON.stringify({ ok: true }), { status: 200 });

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const userId = record.id;
    const { data: user } = await supabaseAdmin.from('users').select('*').eq('id', userId).single();
    if (!user || !user.phone) return new Response(JSON.stringify({ ok: true }), { status: 200 });
    const fullName = `${user.first_name} ${user.last_name}`;

    if (type === 'dispute_opened' && notify_admin) {
      await sendSms(adminPhone, payload.message || `Nouveau litige ouvert`);
    } else if (type === 'INSERT' && record?.status === 'pending') {
      await sendSms(adminPhone, `Nouveau chauffeur en attente: ${fullName} (${user.city}) — /admin/chauffeurs`);
    } else if (type === 'UPDATE') {
      const oldStatus = old_record?.status;
      const newStatus = record?.status;

      if (oldStatus === 'pending' && newStatus === 'approved') {
        await sendSms(user.phone, `Félicitations ! Votre compte VanZ est activé. Connectez-vous sur vanz.tn !`);
        await sendPushNotification(supabaseAdmin, userId, 'Compte Activé !', 'Votre compte VanZ est activé.');
      } else if (oldStatus === 'pending' && newStatus === 'rejected') {
        const rejectionMsg = `Votre dossier VanZ a été rejeté. Raison: ${record.rejection_reason || "Non spécifiée"}. Resoumettre: vanz.tn/resoumettre`;
        await sendSms(user.phone, rejectionMsg);
        await sendPushNotification(supabaseAdmin, userId, 'Dossier Rejeté', rejectionMsg);
      }
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (err: any) {
    console.error('[driver-status-change]', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 200 });
  }
});
