import { SupabaseClient } from "@supabase/supabase-js";
import { logger } from "./loggerService";

/**
 * Service to manage users, validation, and authentication rules.
 */
class UserService {
  /**
   * Validate a Tunisian phone number format (+216 XX XXX XXX or similar spacing/no-spacing variations).
   * Valid prefixes in Tunisia: 2, 3, 4, 5, 9.
   * Total length of national part: 8 digits.
   */
  validateTunisianPhone(phone: string): boolean {
    const cleaned = phone.replace(/\s+/g, ""); // strip spaces
    
    // Pattern matches +216 followed by 8 digits starting with 2, 3, 4, 5, or 9
    const regex = /^\+216[23459]\d{7}$/;
    const isValid = regex.test(cleaned);

    if (!isValid) {
      logger.warn("Tunisian phone number validation failed", { input: phone });
    }

    return isValid;
  }

  /**
   * Fetches user profile by ID.
   */
  async getUserProfile(supabase: SupabaseClient, userId: string) {
    logger.info("Fetching user profile", { userId });
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      logger.error("Failed to fetch user profile", error, { userId });
      throw error;
    }

    return data;
  }

  /**
   * Updates user role or account status.
   */
  async updateAccountStatus(
    supabase: SupabaseClient,
    userId: string,
    status: "active" | "suspended" | "banned",
    reason?: string
  ) {
    logger.info("Updating user account status", { userId, status });
    const updatePayload: Record<string, any> = { account_status: status };
    if (reason) updatePayload.ban_reason = reason;

    const { data, error } = await supabase
      .from("users")
      .update(updatePayload)
      .eq("id", userId)
      .select()
      .single();

    if (error) {
      logger.error("Failed to update user account status", error, { userId, status });
      throw error;
    }

    return data;
  }
}

export const userService = new UserService();
