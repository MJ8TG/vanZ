import { NextResponse } from 'next/server';
import { getAuthenticatedUserWithRole, getServiceClient, getClientIp } from '@/lib/api-auth';
import { rateLimit } from '@/lib/services/rateLimiter';
import { logger } from '@/lib/services/loggerService';
import { bookingService } from '@/lib/services/bookingService';

type AdjustAction = 'refund_client' | 'deduct_driver';

export async function POST(req: Request) {
  // 🔒 Auth Gate: admins only
  const { user, error: authError } = await getAuthenticatedUserWithRole(req, ['admin']);
  if (authError) return authError;

  if (!rateLimit(`api-dispute-adjust-${user!.id}`, 10, 0.1)) {
    logger.warn('Rate limit exceeded for dispute adjustment API', { userId: user!.id });
    return NextResponse.json({ error: 'Trop de requêtes. Veuillez réessayer plus tard.' }, { status: 429 });
  }

  try {
    const supabase = getServiceClient();
    const { job_id, action, amount } = await req.json() as {
      job_id?: string; action?: AdjustAction; amount?: number;
    };

    if (!job_id || !action) {
      return NextResponse.json({ error: 'Paramètres manquants: job_id, action requis.' }, { status: 400 });
    }

    if (action !== 'refund_client' && action !== 'deduct_driver') {
      return NextResponse.json({ error: 'Action invalide.' }, { status: 400 });
    }

    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return NextResponse.json({ error: 'Montant invalide.' }, { status: 400 });
    }

    const { data: job, error: jobErr } = await supabase
      .from('jobs')
      .select('id, client_id, accepted_bid_id')
      .eq('id', job_id)
      .single();

    if (jobErr || !job) {
      return NextResponse.json({ error: 'Mission introuvable.' }, { status: 404 });
    }

    // Resolve the target. accepted_bid_id references bids, not users — the
    // driver id has to be read off the bid.
    let targetUserId: string;
    let signedAmount: number;
    let txType: string;
    let note: string;

    if (action === 'refund_client') {
      targetUserId = job.client_id;
      signedAmount = Math.abs(numericAmount);
      txType = 'refund';
      note = `Remboursement litige — mission ${job_id}`;
    } else {
      if (!job.accepted_bid_id) {
        return NextResponse.json({ error: 'Aucun chauffeur assigné à cette mission.' }, { status: 400 });
      }

      const { data: bid, error: bidErr } = await supabase
        .from('bids')
        .select('driver_id')
        .eq('id', job.accepted_bid_id)
        .single();

      if (bidErr || !bid?.driver_id) {
        return NextResponse.json({ error: 'Chauffeur introuvable pour cette mission.' }, { status: 404 });
      }

      targetUserId = bid.driver_id;
      signedAmount = -Math.abs(numericAmount);
      txType = 'penalty';
      note = `Pénalité litige — mission ${job_id}`;
    }

    // Ledger row and balance update happen in one transaction.
    const { data: newBalance, error: rpcErr } = await supabase.rpc('apply_wallet_adjustment', {
      p_user_id: targetUserId,
      p_amount: signedAmount,
      p_type: txType,
      p_job_id: job_id,
      p_note: note,
    });

    if (rpcErr) {
      logger.error('Wallet adjustment failed', rpcErr, { jobId: job_id, action, targetUserId });
      return NextResponse.json({ error: "L'ajustement du solde a échoué. Aucune modification n'a été appliquée." }, { status: 500 });
    }

    await bookingService.recordAuditLog(
      supabase,
      'job',
      job_id,
      user!.id,
      `dispute_${action}`,
      null,
      null,
      { amount: signedAmount, target_user_id: targetUserId, new_balance: newBalance },
      getClientIp(req)
    );

    return NextResponse.json({
      success: true,
      data: { target_user_id: targetUserId, amount: signedAmount, new_balance: newBalance },
    });

  } catch (err: any) {
    logger.error('Error applying dispute adjustment', err, { userId: user!.id });
    return NextResponse.json({ error: err.message || 'Erreur interne.' }, { status: 500 });
  }
}
