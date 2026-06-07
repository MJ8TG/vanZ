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
  if (!rateLimit(`api-complete-${user!.id}`, 5, 0.1)) {
    logger.warn('Rate limit exceeded for complete job API', { userId: user!.id });
    return NextResponse.json({ error: 'Trop de requêtes. Veuillez réessayer plus tard.' }, { status: 429 });
  }

  try {
    const supabase = getServiceClient();
    const { job_id, driver_id, delivery_photo_url, delivery_photo_lat, delivery_photo_lng } = await req.json();

    if (!job_id || !driver_id) {
      return NextResponse.json({ error: 'Paramètres manquants: job_id, driver_id requis.' }, { status: 400 });
    }

    // 🔒 Authorization: caller must be the driver_id they claim
    if (user!.id !== driver_id) {
      logger.warn('Unauthorized attempt to complete a job', { callerId: user!.id, claimedDriverId: driver_id });
      return NextResponse.json({ error: 'Vous ne pouvez clôturer que vos propres missions.' }, { status: 403 });
    }

    if (!delivery_photo_url) {
      return NextResponse.json({ error: 'La preuve photo est obligatoire pour clôturer la course.' }, { status: 400 });
    }

    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 
                      req.headers.get('x-real-ip') || 
                      undefined;

    // Process completion via Service Layer
    const result = await bookingService.completeJob(
      supabase,
      job_id,
      driver_id,
      delivery_photo_url,
      delivery_photo_lat,
      delivery_photo_lng,
      ipAddress
    );

    return NextResponse.json({
      success: true,
      data: {
        job_id,
        status: 'completed',
        driver_payout: result.driverPayout,
        commission: result.commissionAmount
      }
    });

  } catch (err: any) {
    logger.error('Error completing job in API route', err, { userId: user!.id });
    return NextResponse.json({ error: err.message || 'Erreur interne.' }, { status: 500 });
  }
}
