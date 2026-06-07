import { NextResponse } from 'next/server';
import { getAuthenticatedUser, getServiceClient } from '@/lib/api-auth';
import { bookingService } from '@/lib/services/bookingService';
import { rateLimit } from '@/lib/services/rateLimiter';
import { logger } from '@/lib/services/loggerService';

export async function POST(req: Request) {
  // 🔒 Auth Gate: verify caller is logged in
  const { user, error: authError } = await getAuthenticatedUser(req);
  if (authError) return authError;

  // 🛡️ Rate Limiting: Limit requests per user
  if (!rateLimit(`api-update-status-${user!.id}`, 10, 0.2)) {
    logger.warn('Rate limit exceeded for update status API', { userId: user!.id });
    return NextResponse.json({ error: 'Trop de requêtes. Veuillez réessayer plus tard.' }, { status: 429 });
  }

  try {
    const supabase = getServiceClient();
    const { job_id, driver_id, status } = await req.json();

    if (!job_id || !driver_id || !status) {
      return NextResponse.json({ error: 'Paramètres manquants: job_id, driver_id, status requis.' }, { status: 400 });
    }

    // 🔒 Authorization: caller must be the driver_id they claim
    if (user!.id !== driver_id) {
      logger.warn('Unauthorized attempt to update status of a job', { callerId: user!.id, claimedDriverId: driver_id });
      return NextResponse.json({ error: 'Vous ne pouvez mettre à jour que vos propres missions.' }, { status: 403 });
    }

    if (!['en_route', 'arrived', 'in_progress'].includes(status)) {
      return NextResponse.json({ error: 'Statut invalide.' }, { status: 400 });
    }

    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 
                      req.headers.get('x-real-ip') || 
                      undefined;

    // Update status via Service Layer
    const result = await bookingService.updateJobStatus(supabase, job_id, driver_id, status, ipAddress);

    return NextResponse.json({ success: true, status: result.dbStatus });
  } catch (err: any) {
    logger.error('Error updating status in API route', err, { userId: user!.id });
    return NextResponse.json({ error: err.message || 'Erreur interne.' }, { status: 500 });
  }
}

