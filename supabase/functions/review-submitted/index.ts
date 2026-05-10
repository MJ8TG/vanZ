import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { verifyWebhookSecret } from "../_shared/auth.ts";

serve(async (req: Request) => {
  if (!verifyWebhookSecret(req)) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const payload = await req.json();
    const { record } = payload;
    
    // Only proceed on reviews INSERT
    if (!record || !record.reviewee_id) {
       return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const revieweeId = record.reviewee_id;

    // 1. Re-calculate and cache the global driver rating view purely to user table
    const { data: ratingData } = await supabaseAdmin
      .from('driver_ratings')
      .select('rating, total_reviews')
      .eq('driver_id', revieweeId)
      .single();

    if (ratingData) {
      await supabaseAdmin.from('users')
        .update({
          cached_rating: ratingData.rating,
          total_reviews: ratingData.total_reviews
        })
        .eq('id', revieweeId);
    }

    // 2. Check 3x consecutive Auto-Flag logic
    // We strictly check client-to-driver reviews
    if (record.reviewer_type === 'client') {
       const { data: lastThree } = await supabaseAdmin
        .from('reviews')
        .select('stars')
        .eq('reviewee_id', revieweeId)
        .eq('reviewer_type', 'client')
        .order('created_at', { ascending: false })
        .limit(3);

       if (lastThree && lastThree.length === 3 && lastThree.every(r => r.stars < 3.5)) {
           // Auto-flag the driver globally
           await supabaseAdmin.from('users')
             .update({ account_status: 'flagged' })
             .eq('id', revieweeId);
             
            // Rapidly notify administrators via SOS wrapper
            await supabaseAdmin.functions.invoke('sos-alert', {
              body: { 
                  action: 'trigger_sos',
                  job_id: record.job_id || 'system',
                  user_id: revieweeId,
                  user_type: 'system_flag',
                  lat: 0, lng: 0,
                  type: 'low_rating', 
                  driver_id: revieweeId,
                  message: `Chauffeur ${revieweeId} — 3 avis consécutifs sous 3.5 étoiles` 
              },
              headers: { 'x-edge-secret': Deno.env.get('EDGE_WEBHOOK_SECRET') ?? '' }
            });
       }
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (err: any) {
    console.error('[review-submitted]', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 200 });
  }
});
