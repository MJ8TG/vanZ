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
    const { job_id, driver_id, delivery_photo_url, delivery_photo_lat, delivery_photo_lng } = await req.json();

    if (!job_id || !driver_id) {
      return NextResponse.json({ error: 'Paramètres manquants: job_id, driver_id requis.' }, { status: 400 });
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

    // 2. Update job → completed with delivery proof
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

    // 5. Credit driver wallet (driver_payout)
    if (job.driver_payout) {
      await supabase.from('wallet_transactions').insert({
        user_id: driver_id,
        amount: job.driver_payout,
        type: 'credit',
        job_id,
        note: `Paiement mission — ${job.driver_payout} TND (après commission)`
      });

      // Update driver credit balance
      const { data: driverUser } = await supabase
        .from('users')
        .select('credit_balance')
        .eq('id', driver_id)
        .single();

      if (driverUser) {
        await supabase
          .from('users')
          .update({ credit_balance: (driverUser.credit_balance || 0) + job.driver_payout })
          .eq('id', driver_id);
      }
    }

    // 6. Award loyalty points to client (1 point per 10 TND spent)
    if (job.accepted_bid_amount) {
      const loyaltyPoints = Math.floor(job.accepted_bid_amount / 10);
      if (loyaltyPoints > 0) {
        await supabase.from('loyalty_transactions').insert({
          user_id: job.client_id,
          points: loyaltyPoints,
          type: 'earned',
          job_id
        });

        const { data: clientUser } = await supabase
          .from('users')
          .select('loyalty_points')
          .eq('id', job.client_id)
          .single();

        if (clientUser) {
          await supabase
            .from('users')
            .update({ loyalty_points: (clientUser.loyalty_points || 0) + loyaltyPoints })
            .eq('id', job.client_id);
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        job_id,
        status: 'completed',
        driver_payout: job.driver_payout,
        commission: job.commission_amount
      }
    });

  } catch (err: unknown) {
    console.error('[/api/jobs/complete] Error:', err);
    return NextResponse.json({ error: (err as Error).message || 'Erreur interne.' }, { status: 500 });
  }
}
