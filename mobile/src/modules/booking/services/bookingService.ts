import { datasql } from '@/lib/supabase';
import type { MobileJob } from '@/types/domain';

export type ClientMissionJob = MobileJob & { bids?: Array<{ amount: number | string }> };

export class BookingService {
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
      .select('id, job_id, driver_id, amount, note, status, drivers(users(first_name, last_name, cached_rating), vehicle_type)')
      .eq('job_id', jobId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }
}
