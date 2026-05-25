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

    // 3. Calculate 12% commission
    const commissionRate = 0.12;
    const driverPayout = Math.round(bid.amount / 1.12);
    const commissionAmount = bid.amount - driverPayout;

    // Fetch user profile for Paymee payload
    const { data: userProfile } = await supabase
      .from('users')
      .select('first_name, last_name, phone')
      .eq('id', client_id)
      .single();

    // 4. ATOMIC: Update job → payment_pending
    const { error: jobUpdateErr } = await supabase
      .from('jobs')
      .update({
        status: 'payment_pending',
        accepted_bid_id: bid_id,
        accepted_bid_amount: bid.amount,
        commission_rate: commissionRate,
        commission_amount: commissionAmount,
        driver_payout: driverPayout,
        updated_at: new Date().toISOString()
      })
      .eq('id', job_id);

    if (jobUpdateErr) throw jobUpdateErr;

    // 5. Create Paymee Payment for the commission amount
    const PAYMEE_TOKEN = process.env.PAYMEE_TOKEN;
    const PAYMEE_API = process.env.PAYMEE_API_URL || "https://sandbox.paymee.tn/api/v2/payments/create";
    const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const SUPABASE_FUNCTIONS_URL = `${SUPABASE_URL}/functions/v1`;

    const paymeeResponse = await fetch(PAYMEE_API, {
      method: 'POST',
      headers: { 'Authorization': `Token ${PAYMEE_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: commissionAmount,
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

    // Do NOT accept the bid or change conversation phase here. 
    // The webhook will do that upon successful payment.

    return NextResponse.json({
      success: true,
      data: {
        job_id,
        payment_url: paymeeData.data.payment_url,
        payment_pending: true,
        commission: commissionAmount
      }
    });

  } catch (err: any) {
    console.error('[/api/jobs/accept] Error:', err);
    return NextResponse.json({ error: err.message || 'Erreur interne.' }, { status: 500 });
  }
}
