'use client';

import { useEffect } from 'react';
import { datasql as supabase } from '@/lib/datasql';

interface DriverBroadcasterProps {
  driverId: string;
  activeJobId: string;
}

export function DriverBroadcaster({ driverId, activeJobId }: DriverBroadcasterProps) {
  useEffect(() => {
    let watchId: number;

    const startBroadcasting = async () => {
      // Set driver online explicitly when broadcaster mounts
      await supabase.from('users')
        .update({ is_online: true, last_online_at: new Date().toISOString() })
        .eq('id', driverId);

      if (!('geolocation' in navigator)) {
        console.error("Geolocation is not supported by this browser.");
        return;
      }

      // Start precision watch
      watchId = navigator.geolocation.watchPosition(
        async (pos) => {
          await supabase.from('driver_locations').upsert({
            driver_id: driverId,
            job_id: activeJobId,
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            heading: pos.coords.heading ?? 0,
            speed: pos.coords.speed ?? 0,
            accuracy: pos.coords.accuracy,
            updated_at: new Date().toISOString()
          }, { onConflict: 'driver_id' });
        },
        (error) => console.error("Broadcast error:", error),
        { enableHighAccuracy: true, maximumAge: 3000 }
      );
    };

    startBroadcasting();

    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
      supabase.from('users').update({ is_online: false }).eq('id', driverId);
    };
  }, [driverId, activeJobId]);

  return null; // Silent broadcaster
}
