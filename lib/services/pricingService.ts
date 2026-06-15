import { logger } from "./loggerService";

export interface PricingCalculation {
  totalAmount: number;
  commissionRate: number;
  commissionAmount: number;
  driverPayout: number;
}

/**
 * Service for pricing calculations, payouts, commissions, and formatting in Tunisian Dinar (TND).
 */
class PricingService {
  // Tiered commission: 15% for missions under 100 TND, 11% from 100 TND up.
  private RATE_UNDER_THRESHOLD = 0.15;
  private RATE_FROM_THRESHOLD = 0.11;
  private COMMISSION_THRESHOLD_TND = 100;

  /** Commission rate applied to a mission of the given total amount. */
  getCommissionRate(totalAmount: number): number {
    return Number(totalAmount) < this.COMMISSION_THRESHOLD_TND
      ? this.RATE_UNDER_THRESHOLD
      : this.RATE_FROM_THRESHOLD;
  }

  /**
   * Calculate commission and driver payout from the mission total.
   * Commission is a percentage of the total (Commission = Total * rate),
   * Driver payout = Total - Commission. Matches the complete_job_atomic RPC.
   * If `rate` is omitted, the tiered rate (see getCommissionRate) is applied.
   */
  calculateCommission(totalAmount: number, rate?: number): PricingCalculation {
    const total = Number(totalAmount);
    if (isNaN(total) || total <= 0) {
      throw new Error(`Invalid amount for pricing calculation: ${totalAmount}`);
    }

    const effectiveRate = rate ?? this.getCommissionRate(total);
    const commissionAmount = Math.round(total * effectiveRate * 100) / 100;
    const driverPayout = Math.round((total - commissionAmount) * 100) / 100;

    logger.info("Pricing calculation executed", {
      totalAmount: total,
      commissionRate: effectiveRate,
      commissionAmount,
      driverPayout,
    });

    return {
      totalAmount: total,
      commissionRate: effectiveRate,
      commissionAmount,
      driverPayout,
    };
  }

  /**
   * Formats a numeric price into Tunisian Dinar currency format (e.g. 150.000 TND or just 150 TND).
   */
  formatTND(amount: number): string {
    return `${amount.toFixed(0)} TND`;
  }
}

export const pricingService = new PricingService();
