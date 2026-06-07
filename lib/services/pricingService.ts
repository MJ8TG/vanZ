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
  private DEFAULT_COMMISSION_RATE = 0.12; // 12% standard commission

  /**
   * Calculate commission and driver payout based on total bid amount.
   * Total = Payout + Commission
   * Where Commission = Payout * rate.
   * Therefore, Payout = Total / (1 + rate)
   */
  calculateCommission(totalAmount: number, rate = this.DEFAULT_COMMISSION_RATE): PricingCalculation {
    const total = Number(totalAmount);
    if (isNaN(total) || total <= 0) {
      throw new Error(`Invalid amount for pricing calculation: ${totalAmount}`);
    }

    const driverPayout = Math.round(total / (1 + rate));
    const commissionAmount = total - driverPayout;

    logger.info("Pricing calculation executed", {
      totalAmount: total,
      commissionRate: rate,
      commissionAmount,
      driverPayout,
    });

    return {
      totalAmount: total,
      commissionRate: rate,
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
