import { datasql } from '@/lib/supabase';
import type { MobileJob } from '@/types/domain';

export class DriverService {
  /**
   * Fetches trips (jobs with accepted bid belonging to driver).
   */
  static async fetchDriverTrips(driverId: string, statuses: string[]): Promise<MobileJob[]> {
    const { data, error } = await datasql
      .from('jobs')
      .select('*, bids!inner(*)')
      .eq('bids.driver_id', driverId)
      .eq('bids.status', 'accepted')
      .in('status', statuses)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as MobileJob[];
  }

  /**
   * Updates driver's online/offline status in the database.
   */
  static async updateOnlineStatus(driverId: string, online: boolean): Promise<void> {
    const { error } = await datasql
      .from('users')
      .update({
        is_online: online,
        last_online_at: new Date().toISOString(),
      })
      .eq('id', driverId);

    if (error) throw error;
  }
}
