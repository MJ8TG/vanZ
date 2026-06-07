import { useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';
import { datasql } from '@/lib/supabase';

interface BroadcasterOptions {
  driverId: string | null;
  isActive: boolean; // is active tracking enabled (e.g. driver online + in_progress job)
  jobId?: string | null; // active job ID
}

export function useLocationBroadcaster({ driverId, isActive, jobId }: BroadcasterOptions) {
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const channelRef = useRef<any>(null);
  const watchSubscriptionRef = useRef<any>(null);
  const lastDbUpdateRef = useRef<number>(0);
  const lastHistoryUpdateRef = useRef<number>(0);

  useEffect(() => {
    if (!driverId || !isActive) {
      // Clean up if deactivated
      if (watchSubscriptionRef.current) {
        watchSubscriptionRef.current.remove();
        watchSubscriptionRef.current = null;
      }
      if (channelRef.current) {
        datasql.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      return;
    }

    // 1. Subscribe to Supabase Realtime broadcast channel
    const channel = datasql.channel(`tracking:${driverId}`, {
      config: { broadcast: { self: true } }
    });
    
    channel.subscribe((status) => {
      if (status !== 'SUBSCRIBED') {
        console.error("Failed to subscribe to mobile tracking channel:", status);
      }
    });
    channelRef.current = channel;

    // 2. Start Expo Location GPS tracking
    let isSubscribed = true;
    
    async function startTracking() {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setPermissionError('Location permission denied');
          return;
        }

        setPermissionError(null);

        const subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 5000, // Every 5 seconds
            distanceInterval: 10, // Every 10 meters
          },
          (location) => {
            if (!isSubscribed) return;

            const { latitude, longitude, heading, speed } = location.coords;

            // Broadcast high frequency location update via WebSockets
            if (channelRef.current) {
              channelRef.current.send({
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
            }

            const now = Date.now();

            // Persist to Drivers table (low frequency - every 2 minutes)
            if (now - lastDbUpdateRef.current > 2 * 60 * 1000) {
              lastDbUpdateRef.current = now;
              datasql.from('drivers')
                .update({ 
                  current_lat: latitude, 
                  current_lng: longitude, 
                  last_location_update: new Date().toISOString() 
                })
                .eq('id', driverId)
                .then(({ error }) => {
                  if (error) console.error("Error saving drivers DB coords:", error);
                });
            }

            // Persist to location history if on an active job (every 30 seconds)
            if (jobId && now - lastHistoryUpdateRef.current > 30 * 1000) {
              lastHistoryUpdateRef.current = now;
              datasql.from('driver_location_history')
                .insert({
                  driver_id: driverId,
                  job_id: jobId,
                  lat: latitude,
                  lng: longitude,
                  heading: heading || null,
                  speed: speed || null,
                })
                .then(({ error }) => {
                  if (error) console.error("Error inserting location history:", error);
                });
            }
          }
        );

        if (isSubscribed) {
          watchSubscriptionRef.current = subscription;
        } else {
          subscription.remove();
        }
      } catch (err: any) {
        console.error("Location Broadcaster GPS error:", err);
        setPermissionError(err.message || 'GPS initialization failed');
      }
    }

    startTracking();

    return () => {
      isSubscribed = false;
      if (watchSubscriptionRef.current) {
        watchSubscriptionRef.current.remove();
        watchSubscriptionRef.current = null;
      }
      if (channelRef.current) {
        datasql.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [driverId, isActive, jobId]);

  return { permissionError };
}
