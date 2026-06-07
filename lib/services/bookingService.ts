import { SupabaseClient } from "@supabase/supabase-js";
import { logger } from "./loggerService";
import { pricingService } from "./pricingService";

export type JobStatus = 'open' | 'payment_pending' | 'matched' | 'in_progress' | 'completed' | 'cancelled' | 'expired';

export const JOB_STATUS_TRANSITIONS: Record<JobStatus, JobStatus[]> = {
  open: ['payment_pending', 'cancelled', 'expired'],
  payment_pending: ['matched', 'open', 'cancelled'],
  matched: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
  expired: [],
};

export interface CreateJobInput {
  client_id: string;
  service_type: string;
  pickup_address: string;
  pickup_lat?: number;
  pickup_lng?: number;
  dropoff_address: string;
  dropoff_lat?: number;
  dropoff_lng?: number;
  description?: string;
  load_capacity?: string;
  scheduled_at?: string;
  payment_method?: string;
}

class BookingService {
  /**
   * Validate if a status transition is permitted.
   */
  validateStatusTransition(currentStatus: JobStatus, targetStatus: JobStatus) {
    const allowedTransitions = JOB_STATUS_TRANSITIONS[currentStatus];
    if (!allowedTransitions || !allowedTransitions.includes(targetStatus)) {
      throw new Error(`State transition from "${currentStatus}" to "${targetStatus}" is invalid.`);
    }
  }

  /**
   * Helper to write records to the audit_logs table.
   */
  async recordAuditLog(
    supabase: SupabaseClient,
    entityType: 'job' | 'bid' | 'user',
    entityId: string,
    actorId: string | null,
    action: string,
    previousState: string | null,
    newState: string | null,
    payload: Record<string, any> = {},
    ipAddress?: string
  ) {
    try {
      const { error } = await supabase.from('audit_logs').insert({
        entity_type: entityType,
        entity_id: entityId,
        actor_id: actorId,
        action,
        previous_state: previousState,
        new_state: newState,
        payload,
        ip_address: ipAddress || null,
      });

      if (error) {
        logger.error("Failed to write audit log to database", error, { entityId, action });
      } else {
        logger.info("Audit log recorded", { entityId, action, previousState, newState });
      }
    } catch (err) {
      logger.error("Exception in recordAuditLog", err);
    }
  }

  /**
   * Fetches job by ID.
   */
  async getJob(supabase: SupabaseClient, jobId: string) {
    const { data, error } = await supabase
      .from("jobs")
      .select("*")
      .eq("id", jobId)
      .single();

    if (error) {
      logger.error("Failed to fetch job", error, { jobId });
      throw error;
    }

    return data;
  }

  /**
   * Fetches active/history jobs for a client.
   */
  async getClientJobs(supabase: SupabaseClient, clientId: string, statuses: string[]) {
    const { data, error } = await supabase
      .from("jobs")
      .select("*, bids(amount, status, driver_id)")
      .eq("client_id", clientId)
      .in("status", statuses)
      .order("created_at", { ascending: false });

    if (error) {
      logger.error("Failed to fetch client jobs", error, { clientId, statuses });
      throw error;
    }

    return data;
  }

  /**
   * Fetches active/history trips for a driver.
   */
  async getDriverTrips(supabase: SupabaseClient, driverId: string, statuses: string[]) {
    const { data, error } = await supabase
      .from("jobs")
      .select("*, bids!inner(*)")
      .eq("bids.driver_id", driverId)
      .eq("bids.status", "accepted")
      .in("status", statuses)
      .order("created_at", { ascending: false });

    if (error) {
      logger.error("Failed to fetch driver trips", error, { driverId, statuses });
      throw error;
    }

    return data;
  }

  /**
   * Create a new job.
   */
  async createJob(supabase: SupabaseClient, input: CreateJobInput, ipAddress?: string) {
    logger.info("Creating new job", { client_id: input.client_id });
    const { data, error } = await supabase
      .from("jobs")
      .insert({
        ...input,
        status: "open",
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      logger.error("Failed to create job", error, { client_id: input.client_id });
      throw error;
    }

    await this.recordAuditLog(
      supabase,
      'job',
      data.id,
      input.client_id,
      'job_created',
      null,
      'open',
      { service_type: input.service_type },
      ipAddress
    );

    return data;
  }

  /**
   * Update job status for driver milestones (en route, arrived, in_progress).
   * Verifies that the caller is indeed the assigned driver.
   */
  async updateJobStatus(
    supabase: SupabaseClient,
    jobId: string,
    driverId: string,
    status: "en_route" | "arrived" | "in_progress",
    ipAddress?: string
  ) {
    logger.info("Updating job status milestone", { jobId, driverId, status });

    // 1. Verify job exists and driver is assigned
    const job = await this.getJob(supabase, jobId);
    if (!job) {
      throw new Error("Mission introuvable.");
    }

    if (job.accepted_bid_id) {
      const { data: bid } = await supabase
        .from("bids")
        .select("driver_id")
        .eq("id", job.accepted_bid_id)
        .single();

      if (bid && bid.driver_id !== driverId) {
        throw new Error("Vous n'êtes pas le chauffeur assigné à cette mission.");
      }
    }

    // 2. State machine validation
    const dbStatus = status === "arrived" ? "in_progress" : status;
    this.validateStatusTransition(job.status as JobStatus, dbStatus as JobStatus);

    // 3. Perform the update
    const { error: updateErr } = await supabase
      .from("jobs")
      .update({
        status: dbStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", jobId);

    if (updateErr) {
      logger.error("Failed to update job status in DB", updateErr, { jobId, status });
      throw updateErr;
    }

    // 4. Record transition audit log
    await this.recordAuditLog(
      supabase,
      'job',
      jobId,
      driverId,
      'status_transition',
      job.status,
      dbStatus,
      { milestone_reported: status },
      ipAddress
    );

    // 5. Inject system logs message into conversations
    const { data: conversation } = await supabase
      .from("conversations")
      .select("id")
      .eq("job_id", jobId)
      .eq("driver_id", driverId)
      .single();

    if (conversation) {
      let messageContent = "";
      if (status === "en_route") {
        messageContent = "🚚 Le chauffeur est en route vers le point de départ !";
      } else if (status === "arrived") {
        messageContent = "📍 Le chauffeur est arrivé sur place !";
      } else if (status === "in_progress") {
        messageContent = "⚡ La course a commencé ! Le colis est en chemin.";
      }

      await supabase.from("messages").insert({
        conversation_id: conversation.id,
        sender_type: "system",
        type: "system",
        content: messageContent,
      });
    }

    return { success: true, dbStatus };
  }

  /**
   * Accepts a bid. Moves job to `payment_pending`.
   */
  async acceptBid(
    supabase: SupabaseClient,
    jobId: string,
    bidId: string,
    clientId: string,
    ipAddress?: string
  ) {
    logger.info("Accepting bid", { jobId, bidId, clientId });

    // 1. Fetch bid
    const { data: bid, error: bidErr } = await supabase
      .from("bids")
      .select("id, job_id, driver_id, amount, status")
      .eq("id", bidId)
      .eq("job_id", jobId)
      .single();

    if (bidErr || !bid) {
      throw new Error("Offre introuvable.");
    }

    if (bid.status !== "pending") {
      throw new Error(`Cette offre est déjà ${bid.status}.`);
    }

    // 2. Verify job ownership and status
    const job = await this.getJob(supabase, jobId);
    if (!job) {
      throw new Error("Mission introuvable.");
    }

    if (job.client_id !== clientId) {
      throw new Error("Vous n'êtes pas le propriétaire de cette mission.");
    }

    // State machine check
    this.validateStatusTransition(job.status as JobStatus, 'payment_pending');

    // 3. Calculate payouts (12% commission rate)
    const { commissionRate, commissionAmount, driverPayout } =
      pricingService.calculateCommission(bid.amount, 0.12);

    // 4. Update job atomically
    const { error: jobUpdateErr } = await supabase
      .from("jobs")
      .update({
        status: "payment_pending",
        accepted_bid_id: bidId,
        accepted_bid_amount: bid.amount,
        commission_rate: commissionRate,
        commission_amount: commissionAmount,
        driver_payout: driverPayout,
        updated_at: new Date().toISOString(),
      })
      .eq("id", jobId);

    if (jobUpdateErr) {
      logger.error("Failed to update job for accepted bid", jobUpdateErr, { jobId, bidId });
      throw jobUpdateErr;
    }

    // 5. Record transition audit log
    await this.recordAuditLog(
      supabase,
      'job',
      jobId,
      clientId,
      'status_transition',
      job.status,
      'payment_pending',
      { bid_id: bidId, amount: bid.amount, driver_id: bid.driver_id },
      ipAddress
    );

    return {
      bidAmount: bid.amount,
      commissionAmount,
      driverPayout,
    };
  }

  /**
   * Completes a job. Updates status to `completed`, archives chat, credits driver wallet, and awards loyalty points.
   */
  async completeJob(
    supabase: SupabaseClient,
    jobId: string,
    driverId: string,
    deliveryPhotoUrl: string,
    lat?: number,
    lng?: number,
    ipAddress?: string
  ) {
    logger.info("Completing job", { jobId, driverId, deliveryPhotoUrl });

    // 1. Fetch job & verify assignment
    const job = await this.getJob(supabase, jobId);
    if (!job) {
      throw new Error("Mission introuvable.");
    }

    if (job.accepted_bid_id) {
      const { data: bid } = await supabase
        .from("bids")
        .select("driver_id")
        .eq("id", job.accepted_bid_id)
        .single();

      if (bid && bid.driver_id !== driverId) {
        throw new Error("Vous n'êtes pas le chauffeur assigné à cette mission.");
      }
    }

    // State machine transition validation
    this.validateStatusTransition(job.status as JobStatus, 'completed');

    // 2. Commission calculation (using atomic database RPC helper)
    const { data: completionResult, error: rpcErr } = await supabase.rpc("complete_job_atomic", {
      p_job_id: jobId,
      p_amount: job.accepted_bid_amount || 0,
      p_rate: 0.15, // matches RPC schema setup
    });

    if (rpcErr) {
      logger.error("Failed complete_job_atomic RPC execution", rpcErr, { jobId });
      throw rpcErr;
    }

    const isFirstCompletion = completionResult && completionResult.length > 0;
    const driverPayout = isFirstCompletion ? completionResult[0].payout : job.driver_payout;
    const commissionAmount = isFirstCompletion ? completionResult[0].commission : job.commission_amount;

    // 3. Transition job status to completed with proof
    const { error: updateErr } = await supabase
      .from("jobs")
      .update({
        status: "completed",
        delivery_photo_url: deliveryPhotoUrl,
        delivery_photo_lat: lat || null,
        delivery_photo_lng: lng || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", jobId);

    if (updateErr) {
      logger.error("Failed to transition job status to completed", updateErr, { jobId });
      throw updateErr;
    }

    // 4. Record transition audit log
    await this.recordAuditLog(
      supabase,
      'job',
      jobId,
      driverId,
      'status_transition',
      job.status,
      'completed',
      { delivery_photo_url: deliveryPhotoUrl, lat, lng },
      ipAddress
    );

    // 5. Archive conversation chat
    const { data: conversation } = await supabase
      .from("conversations")
      .update({ phase: "archived" })
      .eq("job_id", jobId)
      .eq("driver_id", driverId)
      .select("id")
      .single();

    if (conversation) {
      await supabase.from("messages").insert({
        conversation_id: conversation.id,
        sender_type: "system",
        type: "system",
        content: `🎉 Mission terminée ! Le chauffeur a déposé la preuve de livraison. Montant total: ${job.accepted_bid_amount} TND.`,
      });
    }

    // 6. Credit driver wallet atomically (only on the first completion to prevent double credits)
    if (isFirstCompletion && driverPayout) {
      await supabase.from("wallet_transactions").insert({
        user_id: driverId,
        amount: driverPayout,
        type: "credit",
        job_id: jobId,
        note: `Paiement mission — ${driverPayout} TND (après commission)`,
      });

      await supabase.rpc("increment_credit_balance", {
        p_user_id: driverId,
        p_amount: driverPayout,
      });
    }

    // 7. Award loyalty points atomically
    if (isFirstCompletion && job.accepted_bid_amount) {
      const loyaltyPoints = Math.floor(job.accepted_bid_amount / 10);
      if (loyaltyPoints > 0) {
        await supabase.from("loyalty_transactions").insert({
          user_id: job.client_id,
          points: loyaltyPoints,
          type: "earned",
          job_id: jobId,
        });

        await supabase.rpc("increment_loyalty_points", {
          p_user_id: job.client_id,
          p_points: loyaltyPoints,
        });
      }
    }

    return {
      success: true,
      driverPayout,
      commissionAmount,
    };
  }
}

export const bookingService = new BookingService();

