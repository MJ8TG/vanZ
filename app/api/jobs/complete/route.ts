import { NextResponse } from 'next/server';
import { getAuthenticatedUser, getServiceClient } from '@/lib/api-auth';

export async function POST(req: Request) {
  // 🔒 Auth Gate: verify caller is logged in
  const { user, error: authError } = await getAuthenticatedUser(req);
  if (authError) return authError;

  try {
    const supabase = getServiceClient();
    const { job_id, driver_id, delivery_photo_url, delivery_photo_lat, delivery_photo_lng } = await req.json();

    if (!job_id || !driver_id) {
      return NextResponse.json({ error: 'Paramètres manquants: job_id, driver_id requis.' }, { status: 400 });
    }

    // 🔒 Authorization: caller must be the driver_id they claim
    if (user!.id !== driver_id) {
      return NextResponse.json({ error: 'Vous ne pouvez clôturer que vos propres missions.' }, { status: 403 });
    }

    if (!delivery_photo_url) {
      return NextResponse.json({ error: 'La preuve photo est obligatoire pour clôturer la course.' }, { status: 400 });
    }

    // 1. Verify job exists and is in_progress, and this driver is the accepted one
    const { data: job, error: jobErr } = await supabase
      .from('jobs')
      .select('id, status, accepted_bid_id, client_id, accepted_bid_amount, commission_amount, driver_payout')
      .eq('id', job_id)
      .single();

    if (jobErr || !job) {
      return NextResponse.json({ error: 'Mission introuvable.' }, { status: 404 });
    }

    if (job.status !== 'in_progress' && job.status !== 'matched') {
      return NextResponse.json({ error: `Impossible de terminer une mission avec le statut "${job.status}".` }, { status: 409 });
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

    // 2. Atomic commission calculation (idempotent — prevents double-credit)
    const { data: completionResult, error: rpcErr } = await supabase.rpc('complete_job_atomic', {
      p_job_id: job_id,
      p_amount: job.accepted_bid_amount || 0,
      p_rate: 0.15
    });

    if (rpcErr) throw rpcErr;

    // If empty result, commission was already calculated — still complete the job
    const isFirstCompletion = completionResult && completionResult.length > 0;
    const driverPayout = isFirstCompletion ? completionResult[0].payout : job.driver_payout;
    const commissionAmount = isFirstCompletion ? completionResult[0].commission : job.commission_amount;

    // 3. Update job → completed with delivery proof
    const { error: updateErr } = await supabase
      .from('jobs')
      .update({
        status: 'completed',
        delivery_photo_url,
        delivery_photo_lat: delivery_photo_lat || null,
        delivery_photo_lng: delivery_photo_lng || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', job_id);

    if (updateErr) throw updateErr;

    // 3. Archive the conversation
    const { data: conversation } = await supabase
      .from('conversations')
      .update({ phase: 'archived' })
      .eq('job_id', job_id)
      .eq('driver_id', driver_id)
      .select('id')
      .single();

    // 4. Insert completion system message
    if (conversation) {
      await supabase.from('messages').insert({
        conversation_id: conversation.id,
        sender_type: 'system',
        type: 'system',
        content: `🎉 Mission terminée ! Le chauffeur a déposé la preuve de livraison. Montant total: ${job.accepted_bid_amount} TND.`
      });
    }

    // 5. Credit driver wallet (atomic — only on first completion)
    if (isFirstCompletion && driverPayout) {
      await supabase.from('wallet_transactions').insert({
        user_id: driver_id,
        amount: driverPayout,
        type: 'credit',
        job_id,
        note: `Paiement mission — ${driverPayout} TND (après commission)`
      });

      // Atomic increment — no read-then-write race
      await supabase.rpc('increment_credit_balance', {
        p_user_id: driver_id,
        p_amount: driverPayout
      });
    }

    // 6. Award loyalty points to client (atomic — only on first completion)
    if (isFirstCompletion && job.accepted_bid_amount) {
      const loyaltyPoints = Math.floor(job.accepted_bid_amount / 10);
      if (loyaltyPoints > 0) {
        await supabase.from('loyalty_transactions').insert({
          user_id: job.client_id,
          points: loyaltyPoints,
          type: 'earned',
          job_id
        });

        // Atomic increment — no read-then-write race
        await supabase.rpc('increment_loyalty_points', {
          p_user_id: job.client_id,
          p_points: loyaltyPoints
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        job_id,
        status: 'completed',
        driver_payout: driverPayout,
        commission: commissionAmount
      }
    });

  } catch (err: unknown) {
    console.error('[/api/jobs/complete] Error:', err);
    return NextResponse.json({ error: (err as Error).message || 'Erreur interne.' }, { status: 500 });
  }
}
