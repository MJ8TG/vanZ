import { NextResponse } from 'next/server';
import { datasql as supabase } from '@/lib/datasql';

const twilioSid = process.env.TWILIO_SID;
const twilioToken = process.env.TWILIO_TOKEN;
const twilioFrom = process.env.TWILIO_FROM;

async function sendSms(to: string, body: string) {
  if (twilioSid && twilioToken && twilioFrom) {
    try {
      const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Authorization": "Basic " + Buffer.from(`${twilioSid}:${twilioToken}`).toString('base64')
        },
        body: new URLSearchParams({ To: to, From: twilioFrom, Body: body }).toString()
      });
      const data = await res.json();
      console.log('[Twilio Success]', data.sid);
      return data;
    } catch (err) {
      console.error('[Twilio Error]', err);
    }
  } else {
    console.log('[SMS Skip - No Credentials]', to, body);
  }
  return null;
}

export async function POST(req: Request) {
  const IS_DEV_MODE = process.env.DEV_AUTH_BYPASS === '1';

  // 1. Auth Guard (Admin only)
  if (!IS_DEV_MODE) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: adminCheck } = await supabase.from('admin_users').select('role').eq('id', user.id).single();
    if (!adminCheck || adminCheck.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  const { driverId, status, reason } = await req.json();

  if (!driverId || !status) {
    return NextResponse.json({ error: 'Missing driverId or status' }, { status: 400 });
  }

  try {
    // 2. Fetch driver data (need phone number)
    const { data: driver, error: fetchErr } = await supabase
      .from('drivers')
      .select('*, users!drivers_id_fkey(phone, first_name)')
      .eq('id', driverId)
      .single();

    if (fetchErr || !driver) throw new Error("Driver not found");

    // 3. Update Status
    const { error: updateErr } = await supabase
      .from('drivers')
      .update({
        status,
        rejection_reason: reason || null,
        approved_at: status === 'approved' ? new Date().toISOString() : null
      })
      .eq('id', driverId);

    if (updateErr) throw updateErr;

    // 4. Send Twilio Notification
    const phone = driver.users?.phone;
    if (phone) {
      let msg = "";
      if (status === 'approved') {
        msg = `VanZ: Félicitations ${driver.users.first_name} ! Votre compte chauffeur a été approuvé. Connectez-vous pour voir les missions disponibles.`;
      } else {
        msg = `VanZ: Votre candidature a été rejetée. Motif: ${reason || 'Dossier incomplet'}.`;
      }
      
      await sendSms(phone, msg);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
