import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: Request) {
  try {
    const supabase = getServiceClient();
    const { job_id, driver_id, amount, note, estimated_duration_minutes } = await req.json();

    if (!job_id || !driver_id || !amount) {
      return NextResponse.json({ error: 'Paramètres manquants.' }, { status: 400 });
    }

    if (amount <= 0) {
      return NextResponse.json({ error: 'Le montant doit être supérieur à 0 TND.' }, { status: 400 });
    }

    // 1. Verify job is still open
    const { data: job, error: jobErr } = await supabase
      .from('jobs')
      .select('status')
      .eq('id', job_id)
      .single();

    if (jobErr || !job) {
      return NextResponse.json({ error: 'Mission introuvable.' }, { status: 404 });
    }

    if (job.status !== 'open') {
      return NextResponse.json({ error: 'Cette mission n\'accepte plus d\'offres.' }, { status: 409 });
    }

    // 2. Check if driver already bid
    const { data: existingBid } = await supabase
      .from('bids')
      .select('id')
      .eq('job_id', job_id)
      .eq('driver_id', driver_id)
      .single();

    if (existingBid) {
      return NextResponse.json({ error: 'Vous avez déjà fait une offre pour cette mission.' }, { status: 409 });
    }

    // 3. Create the bid
    const { data: newBid, error: insertErr } = await supabase
      .from('bids')
      .insert({
        job_id,
        driver_id,
        amount,
        note: note || null,
        estimated_duration_minutes: estimated_duration_minutes || null,
        status: 'pending'
      })
      .select('id')
      .single();

    if (insertErr) throw insertErr;

    // 4. Create the pre_bid conversation so the client can chat if they want
    const { data: newConversation } = await supabase.from('conversations').insert({
      job_id,
      driver_id,
      client_id: (await supabase.from('jobs').select('client_id').eq('id', job_id).single()).data?.client_id,
      phase: 'pre_bid'
    }).select('id').single();

    // 5. Inject system message to notify client of new bid
    if (newConversation) {
      await supabase.from('messages').insert({
        conversation_id: newConversation.id,
        sender_type: 'system',
        type: 'system',
        content: `💡 Nouvelle offre reçue : ${amount} TND ! Vous pouvez discuter avec le chauffeur ici.`
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        bid_id: newBid.id
      }
    });

  } catch (err: any) {
    console.error('[/api/bids/create] Error:', err);
    return NextResponse.json({ error: err.message || 'Erreur interne.' }, { status: 500 });
  }
}
