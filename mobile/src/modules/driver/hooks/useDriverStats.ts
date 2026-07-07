import { useQuery } from '@tanstack/react-query';
import { qk } from '@/lib/queryKeys';
import { DriverService } from '../services/driverService';

/** Driver dashboard header stats (earnings, weekly trips, rating). */
export function useDriverStats(userId: string | undefined) {
  return useQuery({
    queryKey: qk.driverStats(userId),
    queryFn: () => DriverService.fetchDriverStats(userId!),
    enabled: !!userId,
  });
}
