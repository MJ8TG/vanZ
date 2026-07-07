import { datasql } from '@/lib/supabase';

export interface ReferralStats {
  code: string | null;
  invited: number;
  rewarded: number;
}

export class ReferralService {
  static async fetchReferral(userId: string): Promise<ReferralStats> {
    const [{ data: profile }, { count: invitedCount }, { count: rewardedCount }] = await Promise.all([
      datasql.from('users').select('referral_code').eq('id', userId).single(),
      datasql.from('referrals').select('id', { count: 'exact', head: true }).eq('referrer_id', userId),
      datasql.from('referrals').select('id', { count: 'exact', head: true }).eq('referrer_id', userId).eq('status', 'rewarded'),
    ]);
    return {
      code: profile?.referral_code ?? null,
      invited: invitedCount ?? 0,
      rewarded: rewardedCount ?? 0,
    };
  }
}
