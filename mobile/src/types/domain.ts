export type UserRole = 'client' | 'driver';

export type JobStatus =
  | 'open'
  | 'payment_pending'
  | 'matched'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'expired';

export type ServiceType =
  | 'moving'
  | 'furniture'
  | 'parcel'
  | 'express'
  | 'office'
  | 'intercity';

export type LoadCapacity = 'moto' | 'van_s' | 'van_xl' | 'camion';

export interface PlaceSelection {
  description: string;
  lat: number;
  lng: number;
}

export interface MobileJob {
  id: string;
  client_id: string;
  service_type: ServiceType | string;
  pickup_address: string;
  pickup_lat: number | null;
  pickup_lng: number | null;
  dropoff_address: string;
  dropoff_lat: number | null;
  dropoff_lng: number | null;
  load_capacity?: LoadCapacity | string | null;
  scheduled_at?: string | null;
  time_slot?: string | null;
  description?: string | null;
  status: JobStatus | string;
  accepted_bid_id?: string | null;
  accepted_bid_amount?: number | null;
  driver_payout?: number | null;
  created_at?: string;
}
