import { NextResponse } from 'next/server';
import { getAuthenticatedUser, getServiceClient } from '@/lib/api-auth';

export async function POST(req: Request) {
  // 🔒 Auth Gate: verify caller is logged in
  const { user, error: authError } = await getAuthenticatedUser(req);
  if (authError) return authError;

  try {
    const supabase = getServiceClient();
    const { job_id, bid_id, client_id } = await req.json();

    if (!job_id || !bid_id || !client_id) {
      return NextResponse.json({ error: 'Paramètres manquants: job_id, bid_id, client_id requis.' }, { status: 400 });
    }

    // 🔒 Authorization: caller must be the client_id they claim
    if (user!.id !== client_id) {
      return NextResponse.json({ error: 'Vous ne pouvez accepter que vos propres missions.' }, { status: 403 });
    }

    // 1. Fetch the bid and verify it belongs to this job
    const { data: bid, error: bidErr } = await supabase
      .from('bids')
      .select('id, job_id, driver_id, amount, status')
      .eq('id', bid_id)
      .eq('job_id', job_id)
      .single();

    if (bidErr || !bid) {
      return NextResponse.json({ error: 'Offre introuvable.' }, { status: 404 });
    }

    if (bid.status !== 'pending') {
      return NextResponse.json({ error: `Cette offre est déjà ${bid.status}.` }, { status: 409 });
    }

    // 2. Verify the job belongs to this client and is still open
    const { data: job, error: jobErr } = await supabase
      .from('jobs')
      .select('id, client_id, status, commission_rate')
      .eq('id', job_id)
      .single();

    if (jobErr || !job) {
      return NextResponse.json({ error: 'Mission introuvable.' }, { status: 404 });
    }

    if (job.client_id !== client_id) {
      return NextResponse.json({ error: 'Vous n\'êtes pas le propriétaire de cette mission.' }, { status: 403 });
    }

    if (job.status !== 'open') {
      return NextResponse.json({ error: `Cette mission est déjà ${job.status}.` }, { status: 409 });
    }

    // 3. Calculate commission (TND — Rule #1)
    const commissionRate = job.commission_rate || 0.15;
    const commissionAmount = Math.round(bid.amount * commissionRate * 100) / 100;
    const driverPayout = Math.round((bid.amount - commissionAmount) * 100) / 100;

    // 4. ATOMIC: Update job → matched
    const { error: jobUpdateErr } = await supabase
      .from('jobs')
      .update({
        status: 'matched',
        accepted_bid_id: bid_id,
        accepted_bid_amount: bid.amount,
        commission_amount: commissionAmount,
        driver_payout: driverPayout,
        updated_at: new Date().toISOString()
      })
      .eq('id', job_id);

    if (jobUpdateErr) throw jobUpdateErr;

    // 5. ATOMIC: Accept this bid
    const { error: bidAcceptErr } = await supabase
      .from('bids')
      .update({ status: 'accepted' })
      .eq('id', bid_id);

    if (bidAcceptErr) throw bidAcceptErr;

    // 6. ATOMIC: Reject all other bids for this job
    await supabase
      .from('bids')
      .update({ status: 'rejected' })
      .eq('job_id', job_id)
      .neq('id', bid_id)
      .eq('status', 'pending');

    // 7. ATOMIC: Transition conversation phase → post_acceptance
    const { data: conversation } = await supabase
      .from('conversations')
      .update({ phase: 'post_acceptance' })
      .eq('job_id', job_id)
      .eq('driver_id', bid.driver_id)
      .select('id')
      .single();

    // 8. If conversation exists, inject a system message
    if (conversation) {
      await supabase.from('messages').insert({
        conversation_id: conversation.id,
        sender_type: 'system',
        type: 'system',
        content: `✅ Offre acceptée — ${bid.amount} TND ! Vous pouvez maintenant échanger des photos, messages vocaux et coordonnées. Bonne course !`
      });
    }

    // 9. Archive conversations with rejected drivers
    await supabase
      .from('conversations')
      .update({ phase: 'archived' })
      .eq('job_id', job_id)
      .neq('driver_id', bid.driver_id);

    return NextResponse.json({
      success: true,
      data: {
        job_id,
        accepted_bid_id: bid_id,
        driver_id: bid.driver_id,
        amount: bid.amount,
        commission: commissionAmount,
        driver_payout: driverPayout,
        conversation_id: conversation?.id,
        phase: 'post_acceptance'
      }
    });

  } catch (err: any) {
    console.error('[/api/jobs/accept] Error:', err);
    return NextResponse.json({ error: err.message || 'Erreur interne.' }, { status: 500 });
  }
}
