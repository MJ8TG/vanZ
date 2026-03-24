import { NextResponse } from 'next/server';
import { datasql as supabase } from '@/lib/datasql';

const twilioSid = process.env.TWILIO_SID;
const twilioToken = process.env.TWILIO_TOKEN;
const twilioFrom = process.env.TWILIO_FROM;

async function sendSms(to: string, body: string) {
  if (twilioSid && twilioToken && twilioFrom) {
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": "Basic " + Buffer.from(`${twilioSid}:${twilioToken}`).toString('base64')
      },
      body: new URLSearchParams({ To: to, From: twilioFrom, Body: body }).toString()
    });
    return res.json();
  }
}

async function sendPush(supabase: any, user_id: string, title: string, body: string) {
  // Push logic matches Edge Function logic locally!
  const { data: tokens } = await supabase.from('push_tokens').select('token').eq('user_id', user_id).eq('is_active', true);
  if (!tokens || tokens.length === 0) return;

  await supabase.from('notifications').insert({ user_id, type: 'promo', title, body });

  const messages = tokens.map((t: any) => ({
    to: t.token,
    sound: 'default',
    title,
    body
  }));

  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify(messages)
  });
}

export async function POST(req: Request) {
  const supabase = supabase;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: adminCheck } = await supabase.from('admin_users').select('role').eq('id', user.id).single();
  if (!adminCheck || adminCheck.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { audience, channel, title, body } = await req.json();

  let query = supabase.from('users').select('id, phone');

  switch (audience) {
    case 'all_users': break;
    case 'all_drivers': query = query.eq('role', 'driver').eq('account_status', 'active'); break;
    case 'all_clients': query = query.eq('role', 'client'); break;
    case 'city_tunis': query = query.ilike('city', '%tunis%'); break;
    case 'city_sfax': query = query.ilike('city', '%sfax%'); break;
    case 'city_sousse': query = query.ilike('city', '%sousse%'); break;
    case 'online_drivers': query = query.eq('role', 'driver').eq('is_online', true); break;
    default: throw new Error('Unknown audience');
  }

  const { data: matchingUsers } = await query;
  if (!matchingUsers) return NextResponse.json({ success: true, count: 0 });

  let sent = 0;
  for (const u of matchingUsers) {
     if ((channel === 'sms' || channel === 'both') && u.phone) {
        await sendSms(u.phone, body);
     }
     if (channel === 'push' || channel === 'both') {
        await sendPush(supabase, u.id, title || 'Nouvelle Notification', body);
     }
     sent++;
  }

  await supabase.from('admin_actions').insert({
    admin_id: user.id,
    action: 'bulk_notification',
    data: { audience, channel, body, title, sent_count: sent }
  });

  return NextResponse.json({ success: true, count: sent });
}
