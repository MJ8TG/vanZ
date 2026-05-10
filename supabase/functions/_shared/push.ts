import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Shared Push Notification Helper natively accessible to all Deno hooks
export async function sendPushNotification(supabaseAdmin: any, userId: string, title: string, body: string, data: any = {}) {
  try {
    const { data: tokens } = await supabaseAdmin.from('push_tokens')
      .select('token')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (!tokens || tokens.length === 0) return;

    const messages = tokens.map((t: any) => ({
      to: t.token,
      title,
      body,
      data,
      sound: 'default',
      badge: 1
    }));

    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(messages)
    });

    // 3. Fallback tracking: INSERT to notifications table
    await supabaseAdmin.from('notifications').insert({
      user_id: userId,
      type: 'push',
      title,
      body,
      data
    });

  } catch (err) {
    console.error('[PUSH_ERR]', err);
  }
}
