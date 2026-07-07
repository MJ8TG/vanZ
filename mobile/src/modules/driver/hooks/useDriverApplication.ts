import { useQuery } from '@tanstack/react-query';
import { qk } from '@/lib/queryKeys';
import { DriverService } from '../services/driverService';

/**
 * The current user's driver application/verification row (status, docs, vehicle).
 * Shared by the become-driver demande, driver profile (verified badge) and the
 * vehicle screen so they don't each re-query `drivers`.
 */
export function useDriverApplication(userId: string | undefined) {
  return useQuery({
    queryKey: qk.driverStatus(userId),
    queryFn: () => DriverService.fetchDriverApplication(userId!),
    enabled: !!userId,
  });
}
