import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req: Request) => {
  try {
    const { code, jobAmount, userId } = await req.json();

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Atomic RPC: all validation + usage increment happens in a single
    // SQL transaction with FOR UPDATE lock. No race conditions possible.
    const { data, error } = await supabaseAdmin.rpc('try_use_promo', {
      p_code: code,
      p_user_id: userId,
      p_job_amount: jobAmount
    });

    if (error) throw error;

    const result = data?.[0];
    if (!result?.success) {
      return new Response(
        JSON.stringify({ error: result?.error_msg ?? 'Erreur inconnue' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ ok: true, discount: result.discount }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
