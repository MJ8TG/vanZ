import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { verifyWebhookSecret } from "../_shared/auth.ts";

// Hourly Cron to expire stale requests
serve(async (req: Request) => {
  if (!verifyWebhookSecret(req)) {
    return new Response('Unauthorized', { status: 401 });
  }
  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Calculate exactly 48 hours ago
    const hours48Ago = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    // Calculate 24 hours ago (threshold past scheduled_at)
    const scheduledExpiryThreshold = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    // 1. Find all eligible jobs to expire:
    // - status is 'open'
    // - AND: (scheduled_at is null AND created_at < 48 hours ago) OR (scheduled_at is not null AND scheduled_at < 24 hours ago)
    const { data: expiredJobs, error: fetchError } = await supabaseAdmin
      .from('jobs')
      .select('id')
      .eq('status', 'open')
      .or(`and(scheduled_at.is.null,created_at.lt.${hours48Ago}),and(scheduled_at.not.is.null,scheduled_at.lt.${scheduledExpiryThreshold})`);

    if (fetchError || !expiredJobs || expiredJobs.length === 0) {
      return new Response(JSON.stringify({ success: true, count: 0 }), { headers: { "Content-Type": "application/json" } });
    }

    const jobIds = expiredJobs.map((j: { id: string }) => j.id);

    // 2. Update jobs to expired
    await supabaseAdmin
      .from('jobs')
      .update({ status: 'expired' })
      .in('id', jobIds);

    // 3. Update pending bids for those jobs to expired
    await supabaseAdmin
      .from('bids')
      .update({ status: 'expired' })
      .in('job_id', jobIds)
      .eq('status', 'pending');

    return new Response(JSON.stringify({ success: true, count: jobIds.length }), { headers: { "Content-Type": "application/json" } });
  } catch (error: any) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
