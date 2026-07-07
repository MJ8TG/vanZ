import { datasql } from '@/lib/supabase';
import type { MobileJob } from '@/types/domain';

export type ClientMissionJob = MobileJob & { bids?: Array<{ amount: number | string }> };

export type SavedAddress = { id: string; label: string; address: string; lat: number; lng: number };

export class BookingService {
  /** Client home extras: up to 3 saved addresses + up to 6 favorite drivers (raw). */
  static async fetchClientHome(userId: string): Promise<{ savedAddresses: SavedAddress[]; favRaw: any[] }> {
    const [{ data: addrs }, { data: favs }] = await Promise.all([
      datasql.from('saved_addresses').select('id, label, address, lat, lng').eq('user_id', userId).limit(3),
      datasql
        .from('favorite_drivers')
        .select('driver_id, drivers(vehicle_type, users!drivers_id_fkey(first_name, last_name, cached_rating))')
        .eq('client_id', userId)
        .limit(6),
    ]);
    return { savedAddresses: (addrs ?? []) as SavedAddress[], favRaw: (favs ?? []) as any[] };
  }

  /**
   * Fetches client missions by user ID and statuses.
   */
  static async fetchClientMissions(userId: string, statuses: string[]): Promise<ClientMissionJob[]> {
    const { data, error } = await datasql
      .from('jobs')
      .select('*, bids(amount)')
      .eq('client_id', userId)
      .in('status', statuses)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return (data || []) as ClientMissionJob[];
  }

  /**
   * Fetches a single job details.
   */
  static async fetchJobDetails(jobId: string): Promise<MobileJob> {
    const { data, error } = await datasql
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (error) throw error;
    return data as MobileJob;
  }

  /**
   * Fetches bids for a specific job.
   */
  static async fetchJobBids(jobId: string) {
    const { data, error } = await datasql
      .from('bids')
      // `drivers` has two FKs to `users` (id + approved_by), so the embed must
      // disambiguate via drivers_id_fkey — otherwise PostgREST errors (PGRST201)
      // and the whole bids fetch fails (blank bids screen).
      .select('id, job_id, driver_id, amount, note, status, estimated_duration_minutes, drivers(users!drivers_id_fkey(first_name, last_name, cached_rating, total_reviews), vehicle_type)')
      .eq('job_id', jobId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }
}
