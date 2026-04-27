// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000 // Earth radius in meters
  const φ1 = lat1 * Math.PI / 180
  const φ2 = lat2 * Math.PI / 180
  const Δφ = (lat2 - lat1) * Math.PI / 180
  const Δλ = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(Δφ/2)**2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2)**2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
}

serve(async (req: Request) => {
  try {
    const payload = await req.json();
    const { record } = payload;
    
    if (!record || !record.lat || !record.lng) {
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const vanLat = record.lat;
    const vanLng = record.lng;
    const jobId = record.job_id;

    if (!jobId) return new Response(JSON.stringify({ ok: true }), { status: 200 });

    const { data: job } = await supabaseAdmin
      .from('jobs')
      .select('status, pickup_lat, pickup_lng, dropoff_lat, dropoff_lng, client_id, accepted_bid_id')
      .eq('id', jobId)
      .single();

    if (!job) return new Response(JSON.stringify({ ok: true }), { status: 200 });

    const { data: conv } = await supabaseAdmin
      .from('conversations')
      .select('id')
      .eq('job_id', jobId)
      .eq('driver_id', record.driver_id)
      .single();

    const conversationId = conv?.id;

    async function injectSystemMessage(convId: string, content: string) {
      if (!convId) return;
      await supabaseAdmin.from('messages').insert({
        conversation_id: convId,
        sender_id: null,
        sender_type: 'system',
        type: 'system',
        content
      });
    }

    // Check pickup arrival
    if (job.status === 'confirmed' && job.pickup_lat && job.pickup_lng) {
      const distPickup = haversineDistance(vanLat, vanLng, job.pickup_lat, job.pickup_lng);
      if (distPickup < 50) {
         await supabaseAdmin.from('jobs').update({ status: 'arrived_pickup' }).eq('id', jobId);
         await injectSystemMessage(conversationId, 'Le chauffeur est arrivé au point de départ !');
         // Real Push Notification stub (usually APNS/FCM via a third party service or Edge function wrapper)
         console.log(`[PUSH] To Client ${job.client_id}: Le chauffeur est arrivé !`);
      }
    }

    // Check dropoff arrival  
    if (job.status === 'in_progress' && job.dropoff_lat && job.dropoff_lng) {
      const distDropoff = haversineDistance(vanLat, vanLng, job.dropoff_lat, job.dropoff_lng);
      if (distDropoff < 50) {
         // Awaiting Driver to upload Delivery Photo before completion
         await supabaseAdmin.from('jobs').update({ status: 'arrived_dropoff' }).eq('id', jobId);
         await injectSystemMessage(conversationId, 'Le chauffeur est sur place. En attente de la confirmation matérielle (photo).');
         console.log(`[AWAIT_PROOF] Job ${jobId}`);
      }
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (err: any) {
    console.error('[geofence-arrival]', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 200 });
  }
});
