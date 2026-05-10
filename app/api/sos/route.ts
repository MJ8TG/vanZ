import { NextResponse } from 'next/server';
import { datasql as supabase } from '@/lib/datasql';
import { createClient } from '@supabase/supabase-js';

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: Request) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { job_id, lat, lng } = await req.json();

  const supabaseAdmin = getServiceClient();
  await supabaseAdmin.functions.invoke('sos-alert', {
    body: {
      action: 'trigger_sos',
      user_id: user.id,
      lat,
      lng,
      type: 'client_sos',
    },
    headers: { 'x-edge-secret': process.env.EDGE_WEBHOOK_SECRET ?? '' },
  });

  return NextResponse.json({ ok: true });
}
