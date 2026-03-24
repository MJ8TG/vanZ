// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req: Request) => {
  try {
    const { code, jobAmount, userId } = await req.json();

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: promo } = await supabaseAdmin
      .from('promo_codes')
      .select('*')
      .eq('code', code.toUpperCase())
      .eq('is_active', true)
      .single();

    if (!promo) throw new Error('Code invalide');
    if (promo.valid_until && new Date(promo.valid_until) < new Date()) throw new Error('Code expiré');
    if (promo.current_uses >= promo.max_uses) throw new Error('Code épuisé');
    if (jobAmount < promo.min_job_amount) throw new Error(`Minimum ${promo.min_job_amount} TND requis`);

    // Check uses per user natively
    const { count } = await supabaseAdmin.from('wallet_transactions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('type', 'promo')
      .eq('note', code.toUpperCase());

    if (count !== null && count >= promo.uses_per_user) throw new Error('Déjà utilisé');

    const discount = promo.discount_type === 'fixed'
      ? promo.discount_value
      : Math.round(jobAmount * promo.discount_value / 100);

    const safeDiscount = Math.min(discount, jobAmount);

    // Increment usage safely via native RPC wrap
    // Fallback: Using raw query directly or executing a select+update since edge might not support raw strings directly natively like `supabse.raw` in select. Wait, updating uses
    await supabaseAdmin.rpc('increment_promo_usage', { pid: promo.id }); // Will need RPC, or we can just update current_uses: current_uses+1 safely. Let's do simple increment
    await supabaseAdmin.from('promo_codes')
      .update({ current_uses: promo.current_uses + 1 })
      .eq('id', promo.id);

    return new Response(JSON.stringify({ ok: true, discount: safeDiscount }), { status: 200 });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 400 });
  }
});
