import { NextResponse } from 'next/server';
import { getAuthenticatedUserWithRole, getServiceClient, getClientIp } from '@/lib/api-auth';
import { bookingService } from '@/lib/services/bookingService';
import { userService } from '@/lib/services/userService';
import { pricingService } from '@/lib/services/pricingService';
import { rateLimit } from '@/lib/services/rateLimiter';
import { logger } from '@/lib/services/loggerService';

export async function POST(req: Request) {
  // 🔒 Auth Gate: verify caller is logged in and is a client
  const { user, error: authError } = await getAuthenticatedUserWithRole(req, ['client']);
  if (authError) return authError;

  // 🛡️ Rate Limiting: Limit requests per user
  if (!rateLimit(`api-accept-${user!.id}`, 5, 0.1)) {
    logger.warn('Rate limit exceeded for bid acceptance API', { userId: user!.id });
    return NextResponse.json({ error: 'Trop de requêtes. Veuillez réessayer plus tard.' }, { status: 429 });
  }

  try {
    const supabase = getServiceClient();
    const { job_id, bid_id, client_id } = await req.json();

    if (!job_id || !bid_id || !client_id) {
      return NextResponse.json({ error: 'Paramètres manquants: job_id, bid_id, client_id requis.' }, { status: 400 });
    }

    // 🔒 Authorization: caller must be the client_id they claim
    if (user!.id !== client_id) {
      logger.warn('Unauthorized attempt to accept a bid', { callerId: user!.id, claimedClientId: client_id });
      return NextResponse.json({ error: 'Vous ne pouvez accepter que vos propres missions.' }, { status: 403 });
    }

    // Get user profile to check formatting and retrieve phone
    const userProfile = await userService.getUserProfile(supabase, client_id);
    if (!userProfile) {
      return NextResponse.json({ error: 'Profil client introuvable.' }, { status: 404 });
    }

    const ipAddress = getClientIp(req);

    // Perform database operations via Service Layer
    const result = await bookingService.acceptBid(supabase, job_id, bid_id, client_id, ipAddress);

    // 5. Create Paymee Payment for the commission amount
    const PAYMEE_TOKEN = process.env.PAYMEE_TOKEN;
    const PAYMEE_API = process.env.PAYMEE_API_URL || "https://sandbox.paymee.tn/api/v2/payments/create";
    const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const SUPABASE_FUNCTIONS_URL = `${SUPABASE_URL}/functions/v1`;

    logger.info('Creating Paymee payment request for accepted bid commission', {
      jobId: job_id,
      commission: result.commissionAmount,
    });

    const paymeeResponse = await fetch(PAYMEE_API, {
      method: 'POST',
      headers: { 'Authorization': `Token ${PAYMEE_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: result.commissionAmount,
        note: `VanZ Job #${job_id}`,
        first_name: userProfile?.first_name || 'Client',
        last_name: userProfile?.last_name || 'VanZ',
        phone: userProfile?.phone || '+21620000000',
        return_url: `${BASE_URL}/fr/mes-missions`,
        cancel_url: `${BASE_URL}/fr/mes-missions`,
        webhook_url: `${SUPABASE_FUNCTIONS_URL}/paymee-webhook?job_id=${job_id}`
      })
    });

    const paymeeData = await paymeeResponse.json();

    if (!paymeeData || !paymeeData.data || !paymeeData.data.payment_url) {
      throw new Error(`Erreur lors de la création du paiement: ${JSON.stringify(paymeeData)}`);
    }

    logger.info('Paymee payment request created successfully', {
      jobId: job_id,
      paymentUrl: paymeeData.data.payment_url,
    });

    return NextResponse.json({
      success: true,
      data: {
        job_id,
        payment_url: paymeeData.data.payment_url,
        payment_pending: true,
        commission: result.commissionAmount
      }
    });

  } catch (err: any) {
    logger.error('Error accepting bid in API route', err, { userId: user!.id });
    return NextResponse.json({ error: err.message || 'Erreur interne.' }, { status: 500 });
  }
}

