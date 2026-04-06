import { useEffect, useRef } from 'react';
import { datasql as supabase } from '@/lib/datasql';

interface TrackingOptions {
  driverId: string | null;
  isActive: boolean; // should it be actively tracking right now?
  jobId?: string | null; // if tracking for a specific active job
}

export function useDriverTracking({ driverId, isActive, jobId }: TrackingOptions) {
  const channelRef = useRef<any>(null);
  const lastDbUpdateRef = useRef<number>(0);

  useEffect(() => {
    if (!driverId || !isActive) return;

    // Initialize Realtime Channel
    const channel = supabase.channel(`tracking:${driverId}`, {
       config: { broadcast: { self: true } }
    });
    
    channel.subscribe((status) => {
      if (status !== 'SUBSCRIBED') {
        console.error("Failed to subscribe to tracking channel:", status);
      }
    });

    channelRef.current = channel;

    // Start GPS Watch
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, heading, speed } = position.coords;
        
        // 1. Broadcast to Supabase Realtime (High Frequency - every few seconds)
        // This won't hit the database and is purely for live React clients
        channel.send({
          type: 'broadcast',
          event: 'location_update',
          payload: { 
            lat: latitude, 
            lng: longitude, 
            heading: heading || 0,
            speed: speed || 0,
            job_id: jobId
          }
        });

        // 2. Persist to Postgres (Low Frequency - every 3 minutes)
        // Used for the PostGIS Radius job discovery
        const now = Date.now();
        if (now - lastDbUpdateRef.current > 3 * 60 * 1000) {
           lastDbUpdateRef.current = now;
           supabase.from('drivers')
             .update({ 
               current_lat: latitude, 
               current_lng: longitude, 
               last_location_update: new Date().toISOString() 
             })
             .eq('id', driverId)
             .then(({ error }) => {
                if(error) console.error("Error saving DB coords:", error);
             });
        }
      },
      (error) => {
        console.error("GPS Watch Error:", error);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 10000,
        timeout: 10000
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [driverId, isActive, jobId]);

  return null;
}
