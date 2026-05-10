import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const GOOGLE_MAPS_KEY = Deno.env.get("GOOGLE_MAPS_KEY");

serve(async (req: Request) => {
  try {
    const { driver_lat, driver_lng, dropoff_lat, dropoff_lng, job_id } = await req.json();

    if (!driver_lat || !driver_lng || !dropoff_lat || !dropoff_lng || !job_id) {
       return new Response(JSON.stringify({ error: "Missing parameters" }), { status: 200 }); // Catch errors as requested
    }

    if (!GOOGLE_MAPS_KEY) {
      console.warn("GOOGLE_MAPS_KEY is missing. ETA returned as 0 for local bypass.");
      return new Response(JSON.stringify({ eta_minutes: 0, distance_km: 0 }), { status: 200 });
    }

    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${driver_lat},${driver_lng}&destination=${dropoff_lat},${dropoff_lng}&key=${GOOGLE_MAPS_KEY}`;
    
    const mapsRes = await fetch(url);
    const mapsData = await mapsRes.json();

    if (mapsData.status !== "OK" || !mapsData.routes[0]) {
      throw new Error(`Google Maps API error: ${mapsData.status}`);
    }

    const leg = mapsData.routes[0].legs[0];
    const durationSec = leg.duration.value;
    const distanceMeters = leg.distance.value;

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Update job ETA stats
    await supabaseAdmin
      .from('jobs')
      .update({
        eta_seconds: durationSec,
        distance_remaining_meters: distanceMeters
      })
      .eq('id', job_id);

    return new Response(JSON.stringify({ 
      eta_minutes: Math.ceil(durationSec / 60), 
      distance_km: (distanceMeters / 1000).toFixed(2) 
    }), { status: 200, headers: { "Content-Type": "application/json" } });

  } catch (err: any) {
    console.error('[eta-calculator]', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 200 }); // Return 200 on error to prevent infinite retries
  }
});
