import { NextResponse } from 'next/server';
import { getAuthenticatedUserWithRole, getServiceClient, getClientIp } from '@/lib/api-auth';
import { rateLimit } from '@/lib/services/rateLimiter';
import { logger } from '@/lib/services/loggerService';

/**
 * Approves a driver withdrawal.
 *
 * The balance check, the ledger row, the debit, the status change and the audit
 * entry all happen inside approve_withdrawal (031) so they cannot half-apply.
 * The previous client-side flow read the balance in the browser, subtracted in
 * JavaScript, wrote it back, and checked no errors — see that migration for the
 * full list of what could go wrong.
 */
export async function POST(req: Request) {
  const { user, error: authError } = await getAuthenticatedUserWithRole(req, ['admin']);
  if (authError) return authError;

  if (!rateLimit(`api-withdrawal-approve-${user!.id}`, 10, 0.1)) {
    logger.warn('Rate limit exceeded for withdrawal approval', { userId: user!.id });
    return NextResponse.json({ error: 'Trop de requêtes. Veuillez réessayer plus tard.' }, { status: 429 });
  }

  try {
    const supabase = getServiceClient();
    const { withdrawal_id } = await req.json() as { withdrawal_id?: string };

    if (!withdrawal_id) {
      return NextResponse.json({ error: 'Paramètre manquant: withdrawal_id requis.' }, { status: 400 });
    }

    const { data, error } = await supabase.rpc('approve_withdrawal', {
      p_withdrawal_id: withdrawal_id,
      p_admin_id: user!.id,
    });

    if (error) {
      logger.error('Withdrawal approval failed', error, {
        withdrawalId: withdrawal_id, adminId: user!.id, ip: getClientIp(req),
      });
      // The function raises for "already processed" and "insufficient balance",
      // both of which are the operator's problem to see, not a server fault.
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const result = Array.isArray(data) ? data[0] : data;
    logger.info('Withdrawal approved', { withdrawalId: withdrawal_id, adminId: user!.id, result });

    return NextResponse.json({ success: true, data: result });

  } catch (err: any) {
    logger.error('Error approving withdrawal', err, { userId: user!.id });
    return NextResponse.json({ error: err.message || 'Erreur interne.' }, { status: 500 });
  }
}
