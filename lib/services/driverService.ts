import { SupabaseClient } from "@supabase/supabase-js";
import { logger } from "./loggerService";

class DriverService {
  /**
   * Fetches driver profile and verification details.
   */
  async getDriverDetails(supabase: SupabaseClient, driverId: string) {
    logger.info("Fetching driver details", { driverId });
    const { data, error } = await supabase
      .from("drivers")
      .select("*, users(*)")
      .eq("id", driverId)
      .single();

    if (error) {
      logger.error("Failed to fetch driver details", error, { driverId });
      throw error;
    }

    return data;
  }

  /**
   * Updates driver document verification status (e.g. approved, rejected).
   */
  async updateDriverStatus(
    supabase: SupabaseClient,
    driverId: string,
    status: "approved" | "pending" | "rejected",
    approverId?: string,
    reason?: string
  ) {
    logger.info("Updating driver verification status", { driverId, status });
    const updatePayload: Record<string, any> = { status };
    if (status === "approved" && approverId) {
      updatePayload.approved_at = new Date().toISOString();
      updatePayload.approved_by = approverId;
    } else if (status === "rejected" && reason) {
      updatePayload.rejection_reason = reason;
    }

    const { data, error } = await supabase
      .from("drivers")
      .update(updatePayload)
      .eq("id", driverId)
      .select()
      .single();

    if (error) {
      logger.error("Failed to update driver status", error, { driverId, status });
      throw error;
    }

    return data;
  }

  /**
   * Broadcasts/updates a driver's GPS location.
   */
  async updateDriverLocation(
    supabase: SupabaseClient,
    driverId: string,
    lat: number,
    lng: number
  ) {
    const { error } = await supabase
      .from("drivers")
      .update({
        current_lat: lat,
        current_lng: lng,
        last_location_update: new Date().toISOString(),
      })
      .eq("id", driverId);

    if (error) {
      logger.error("Failed to update driver location in DB", error, { driverId, lat, lng });
      throw error;
    }

    logger.info("Driver location updated in DB", { driverId, lat, lng });
  }

  /**
   * Inserts driver location update history (for active jobs).
   */
  async insertLocationHistory(
    supabase: SupabaseClient,
    driverId: string,
    jobId: string,
    lat: number,
    lng: number,
    heading?: number | null,
    speed?: number | null
  ) {
    const { error } = await supabase.from("driver_location_history").insert({
      driver_id: driverId,
      job_id: jobId,
      lat,
      lng,
      heading: heading || null,
      speed: speed || null,
    });

    if (error) {
      logger.error("Failed to insert driver location history", error, { driverId, jobId, lat, lng });
      throw error;
    }
  }
}

export const driverService = new DriverService();
