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
    const { job_id, client_id, payment_method } = await req.json();

    if (!job_id || !client_id || !payment_method) {
      return NextResponse.json({ error: 'Paramètres manquants: job_id, client_id, payment_method requis.' }, { status: 400 });
    }

    if (!['cash', 'online'].includes(payment_method)) {
      return NextResponse.json({ error: 'Méthode de paiement invalide.' }, { status: 400 });
    }

    // 1. Verify job ownership
    const { data: job, error: jobErr } = await supabase
      .from('jobs')
      .select('client_id, payment_method, id')
      .eq('id', job_id)
      .single();

    if (jobErr || !job) {
      return NextResponse.json({ error: 'Mission introuvable.' }, { status: 404 });
    }

    if (job.client_id !== client_id) {
      return NextResponse.json({ error: 'Vous n\'êtes pas autorisé.' }, { status: 403 });
    }

    // 2. Update the job's payment method
    const { error: updateErr } = await supabase
      .from('jobs')
      .update({
        payment_method,
        updated_at: new Date().toISOString()
      })
      .eq('id', job_id);

    if (updateErr) throw updateErr;

    // 3. Inject system message into the active conversation
    const { data: activeConversation } = await supabase
      .from('conversations')
      .select('id')
      .eq('job_id', job_id)
      .eq('phase', 'post_acceptance') // Must be in post_acceptance to set payment method
      .single();

    if (activeConversation) {
      const modeText = payment_method === 'cash' ? 'Espèces' : 'En Ligne';
      await supabase.from('messages').insert({
        conversation_id: activeConversation.id,
        sender_type: 'system',
        type: 'system',
        content: `💳 Mode de paiement convenu : ${modeText}.`
      });
    }

    return NextResponse.json({ success: true, payment_method });

  } catch (err: any) {
    console.error('[/api/jobs/payment-method] Error:', err);
    return NextResponse.json({ error: err.message || 'Erreur interne.' }, { status: 500 });
  }
}
