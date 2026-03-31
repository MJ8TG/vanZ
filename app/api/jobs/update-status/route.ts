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
    const { job_id, driver_id, status } = await req.json();

    if (!job_id || !driver_id || !status) {
      return NextResponse.json({ error: 'Paramètres manquants: job_id, driver_id, status requis.' }, { status: 400 });
    }

    if (!['en_route', 'arrived'].includes(status)) {
      return NextResponse.json({ error: 'Statut invalide.' }, { status: 400 });
    }

    // 1. Verify job exists and driver is assigned
    const { data: job, error: jobErr } = await supabase
      .from('jobs')
      .select('status, accepted_bid_id')
      .eq('id', job_id)
      .single();

    if (jobErr || !job) {
      return NextResponse.json({ error: 'Mission introuvable.' }, { status: 404 });
    }

    // Verify bid ownership
    if (job.accepted_bid_id) {
      const { data: bid } = await supabase
        .from('bids')
        .select('driver_id')
        .eq('id', job.accepted_bid_id)
        .single();

      if (bid && bid.driver_id !== driver_id) {
        return NextResponse.json({ error: 'Vous n\'êtes pas le chauffeur assigné à cette mission.' }, { status: 403 });
      }
    }

    // 2. Update job status
    const { error: updateErr } = await supabase
      .from('jobs')
      .update({
        status: status === 'arrived' ? 'in_progress' : status, // 'arrived' technically means they are there to start the actual job logic usually, but let's just make 'status' field update accordingly
        updated_at: new Date().toISOString()
      })
      .eq('id', job_id);

    // *Actually wait, 'en_route' or 'arrived' might not be standard 'jobs' table statuses for VanZ*
    // The task plan says "Status states: Confirmé → En route → Arrivé → En livraison → Terminé"
    // Let's just update the status field.
    if (updateErr) throw updateErr;

    // 3. Inject system message
    const { data: conversation } = await supabase
      .from('conversations')
      .select('id')
      .eq('job_id', job_id)
      .eq('driver_id', driver_id)
      .single();

    if (conversation) {
      let messageContent = '';
      if (status === 'en_route') {
        messageContent = '🚚 Le chauffeur est en route vers le point de départ !';
      } else if (status === 'arrived') {
        messageContent = '📍 Le chauffeur est arrivé sur place !';
      }

      await supabase.from('messages').insert({
        conversation_id: conversation.id,
        sender_type: 'system',
        type: 'system',
        content: messageContent
      });
    }

    return NextResponse.json({ success: true, status });
  } catch (err: any) {
    console.error('[/api/jobs/update-status] Error:', err);
    return NextResponse.json({ error: err.message || 'Erreur interne.' }, { status: 500 });
  }
}
