import { useQuery } from '@tanstack/react-query';
import { qk } from '@/lib/queryKeys';
import { DriverService } from '../services/driverService';

export function useTrips(driverId: string | undefined, tab: 'active' | 'history') {
  const activeStatuses = ['matched', 'in_progress'];
  const historyStatuses = ['completed', 'cancelled'];
  const statuses = tab === 'active' ? activeStatuses : historyStatuses;

  return useQuery({
    queryKey: qk.trips(driverId, tab),
    queryFn: () => DriverService.fetchDriverTrips(driverId!, statuses),
    enabled: !!driverId,
  });
}
