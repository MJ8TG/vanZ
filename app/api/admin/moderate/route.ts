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
  } else {
    console.log('[SMS fallback]', to, body);
  }
}

export async function POST(req: Request) {
  const supabase = supabase;

  // Auth Guard
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: adminCheck } = await supabase.from('admin_users').select('role').eq('id', user.id).single();
  if (!adminCheck || adminCheck.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { action, userId, targetPhone, reason, days } = await req.json();

  try {
    if (action === 'warn') {
       await supabase.from('users').update({ account_status: 'warned' }).eq('id', userId);
       await supabase.from('notifications').insert({
          user_id: userId,
          type: 'warning',
          title: 'Avertissement',
          body: 'Votre comportement a été signalé par l\'administration.'
       });
       if (targetPhone) await sendSms(targetPhone, 'VanZ: Votre compte a reçu un avertissement.');
    } 
    else if (action === 'suspend') {
       const suspendTime = new Date();
       suspendTime.setDate(suspendTime.getDate() + (days || 7));
       
       await supabase.from('users').update({ 
         account_status: 'suspended',
         suspended_until: suspendTime.toISOString()
       }).eq('id', userId);

       if (targetPhone) await sendSms(targetPhone, `VanZ: Votre compte est suspendu pour ${days || 7} jours.`);
    }
    else if (action === 'ban') {
       await supabase.from('users').update({ 
         account_status: 'banned', 
         ban_reason: reason || 'Violation des CGU'
       }).eq('id', userId);

       await supabase.from('push_tokens').update({ is_active: false }).eq('user_id', userId);
       if (targetPhone) await sendSms(targetPhone, 'VanZ: Votre compte a été définitivement banni.');
    }
    else {
       throw new Error("Invalid action");
    }

    // Log the action
    await supabase.from('admin_actions').insert({
       admin_id: user.id,
       action: `moderate_${action}`,
       data: { target_user: userId, reason, days }
    });

    return NextResponse.json({ success: true });
  } catch(e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
