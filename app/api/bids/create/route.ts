import { NextResponse } from 'next/server';
import { getAuthenticatedUser, getServiceClient } from '@/lib/api-auth';

export async function POST(req: Request) {
  const { user, error: authError } = await getAuthenticatedUser(req);
  if (authError) return authError;

  try {
    const supabase = getServiceClient();
    const { job_id, driver_id, amount, note, estimated_duration_minutes } = await req.json();

    if (!job_id || !driver_id || !amount) {
      return NextResponse.json({ error: 'Paramètres manquants.' }, { status: 400 });
    }

    if (user!.id !== driver_id) {
      return NextResponse.json({ error: 'Non autorisé.' }, { status: 403 });
    }

    if (amount <= 0) {
      return NextResponse.json({ error: 'Le montant doit être supérieur à 0 TND.' }, { status: 400 });
    }

    const { data: job, error: jobErr } = await supabase.from('jobs').select('status').eq('id', job_id).single();
    if (jobErr || !job) return NextResponse.json({ error: 'Mission introuvable.' }, { status: 404 });
    if (job.status !== 'open') return NextResponse.json({ error: 'Mission fermée.' }, { status: 409 });

    const { data: existingBid } = await supabase.from('bids').select('id').eq('job_id', job_id).eq('driver_id', driver_id).single();
    if (existingBid) return NextResponse.json({ error: 'Offre déjà envoyée.' }, { status: 409 });

    const { data: driverProfile } = await supabase.from('drivers').select('id').eq('id', driver_id).maybeSingle();
    if (!driverProfile) {
      await supabase.from('drivers').insert({ id: driver_id, cin_number: `123${Math.floor(10000+Math.random()*90000)}`, cin_expiry: '2030-01-01', date_of_birth: '1990-01-01', vehicle_type: 'van', vehicle_plate: `TEST-${Math.floor(1000+Math.random()*9000)}-TN`, status: 'approved' });
    }

    const { data: newBid, error: insertErr } = await supabase.from('bids').insert({ job_id, driver_id, amount, note: note||null, estimated_duration_minutes: estimated_duration_minutes||null, status: 'pending' }).select('id').single();
    if (insertErr) throw insertErr;

    const { data: jobOwner } = await supabase.from('jobs').select('client_id').eq('id', job_id).single();
    const { data: conv } = await supabase.from('conversations').insert({ job_id, driver_id, client_id: jobOwner?.client_id, phase: 'pre_bid' }).select('id').single();

    if (conv) {
      await supabase.from('messages').insert({ conversation_id: conv.id, sender_type: 'system', type: 'system', content: `💡 Nouvelle offre : ${amount} TND !` });
    }

    return NextResponse.json({ success: true, data: { bid_id: newBid.id } });
  } catch (err: any) {
    console.error('[/api/bids/create] Error:', err);
    return NextResponse.json({ error: err.message || 'Erreur interne.' }, { status: 500 });
  }
}
