import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendPushNotification } from "../_shared/push.ts";
import { verifyWebhookSecret } from "../_shared/auth.ts";

serve(async (req: Request) => {
  if (!verifyWebhookSecret(req)) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const payload = await req.json();
    const { type, record } = payload;

    if (type !== 'INSERT' || !record || record.status !== 'open') {
      return new Response(JSON.stringify({ ok: true, message: 'Ignored payload' }), { status: 200 });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // 1. Fetch all approved drivers
    const { data: approvedDrivers, error: driverErr } = await supabaseAdmin
      .from('drivers')
      .select('id')
      .eq('status', 'approved');

    if (driverErr) throw driverErr;
    if (!approvedDrivers || approvedDrivers.length === 0) {
      return new Response(JSON.stringify({ ok: true, message: 'No approved drivers' }), { status: 200 });
    }

    const driverUserIds = approvedDrivers.map((d: any) => d.id);

    // 2. Fetch active push tokens for these drivers
    const { data: activeTokens, error: tokenErr } = await supabaseAdmin
      .from('push_tokens')
      .select('token, user_id')
      .in('user_id', driverUserIds)
      .eq('is_active', true);

    if (tokenErr) throw tokenErr;
    if (!activeTokens || activeTokens.length === 0) {
      return new Response(JSON.stringify({ ok: true, message: 'No active push tokens found' }), { status: 200 });
    }

    // 3. Format message details
    const serviceTypeLabels: Record<string, string> = {
      moving: 'Déménagement',
      furniture: 'Transport Meuble',
      parcel: 'Livraison Colis',
      express: 'Express',
      office: 'Bureaux',
      intercity: 'Inter-villes'
    };

    const serviceLabel = serviceTypeLabels[record.service_type] ?? 'Transport';
    const title = 'Nouvelle mission disponible 📦';
    const body = `${serviceLabel} de ${record.pickup_address || 'Départ'} à ${record.dropoff_address || 'Destination'}`;
    const notificationData = { job_id: record.id };

    // 4. Send notifications
    const tokensList = activeTokens.map((t: any) => ({
      to: t.token,
      title,
      body,
      data: notificationData,
      sound: 'default',
      badge: 1
    }));

    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tokensList)
    });

    // 5. Insert backup notifications in db
    const dbNotifications = activeTokens.map((t: any) => ({
      user_id: t.user_id,
      type: 'push',
      title,
      body,
      data: notificationData
    }));

    await supabaseAdmin.from('notifications').insert(dbNotifications);

    return new Response(JSON.stringify({ ok: true, notifiedCount: activeTokens.length }), { status: 200 });

  } catch (err: any) {
    console.error('[NEW_JOB_ALERT_ERR]', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 200 });
  }
});
