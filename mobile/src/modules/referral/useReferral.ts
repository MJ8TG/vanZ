import { useQuery } from '@tanstack/react-query';
import { qk } from '@/lib/queryKeys';
import { ReferralService } from './referralService';

/** The user's referral code and invited/rewarded counts. */
export function useReferral(userId: string | undefined) {
  return useQuery({
    queryKey: qk.referral(userId),
    queryFn: () => ReferralService.fetchReferral(userId!),
    enabled: !!userId,
  });
}
