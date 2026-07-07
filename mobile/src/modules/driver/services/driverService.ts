import { datasql } from '@/lib/supabase';
import type { MobileJob } from '@/types/domain';

/** The driver's onboarding/verification row in `drivers` (null if never applied). */
export interface DriverApplication {
  status: 'pending' | 'approved' | 'rejected' | null;
  rejection_reason: string | null;
  cin_number: string | null;
  cin_expiry: string | null;
  vehicle_type: string | null;
  vehicle_brand: string | null;
  vehicle_model: string | null;
  vehicle_year: number | null;
  vehicle_color: string | null;
  vehicle_plate: string | null;
  vehicle_capacity: number | null;
  cin_front_url: string | null;
  cin_back_url: string | null;
  vehicle_photo_url: string | null;
  doc_carte_grise: string | null;
  doc_assurance: string | null;
  doc_permis: string | null;
  doc_visite_technique: string | null;
}

const DRIVER_APPLICATION_COLUMNS =
  'status, rejection_reason, cin_number, cin_expiry, vehicle_type, vehicle_brand, vehicle_model, vehicle_year, vehicle_color, vehicle_plate, vehicle_capacity, cin_front_url, cin_back_url, vehicle_photo_url, doc_carte_grise, doc_assurance, doc_permis, doc_visite_technique';

export interface DriverStats {
  weekEarnings: number;
  todayEarnings: number;
  weekTrips: number;
  rating: number | null;
}

export class DriverService {
  /** Weekly/today earnings, weekly completed-trip count, and cached rating for the dashboard header. */
  static async fetchDriverStats(userId: string): Promise<DriverStats> {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

    const [{ data: txs }, { count: tripsCount }, { data: user }] = await Promise.all([
      datasql.from('wallet_transactions').select('amount, type, created_at').eq('user_id', userId).eq('type', 'earning').gte('created_at', weekAgo),
      datasql
        .from('jobs')
        .select('id, bids!inner(driver_id, status)', { count: 'exact', head: true })
        .eq('status', 'completed')
        .eq('bids.driver_id', userId)
        .eq('bids.status', 'accepted')
        .gte('updated_at', weekAgo),
      datasql.from('users').select('cached_rating').eq('id', userId).single(),
    ]);

    const week = (txs || []).reduce((sum, tx: any) => sum + Number(tx.amount), 0);
    const today = (txs || [])
      .filter((tx: any) => tx.created_at >= todayStart)
      .reduce((sum, tx: any) => sum + Number(tx.amount), 0);

    return {
      weekEarnings: week,
      todayEarnings: today,
      weekTrips: tripsCount || 0,
      rating: user?.cached_rating ? Number(user.cached_rating) : null,
    };
  }

  /** Fetches the driver's verification/application row, or null if they haven't applied. */
  static async fetchDriverApplication(driverId: string): Promise<DriverApplication | null> {
    const { data, error } = await datasql
      .from('drivers')
      .select(DRIVER_APPLICATION_COLUMNS)
      .eq('id', driverId)
      .maybeSingle();
    if (error) throw error;
    return (data as DriverApplication) ?? null;
  }


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
