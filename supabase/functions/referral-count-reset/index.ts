// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Scheduled Cron to reset counts unconditionally natively on 1st of month
serve(async () => {
  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // 1. UPDATE users SET referral_count_month = 0
    const { error: resetError } = await supabaseAdmin
      .from('users')
      .update({ referral_count_month: 0 })
      .gt('referral_count_month', 0); // Only update non-zeros effectively

    if (resetError) {
      throw resetError;
    }

    // 2. Clear old pending relative referrals (30 days threshold)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    await supabaseAdmin
      .from('referrals')
      .update({ status: 'voided' })
      .eq('status', 'pending')
      .lt('created_at', thirtyDaysAgo);

    return new Response(JSON.stringify({ ok: true, message: "Reset constraints applied" }), { status: 200 });
  } catch (err: any) {
    console.error('[referral-count-reset]', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 200 });
  }
});
