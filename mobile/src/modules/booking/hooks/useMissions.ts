import { useQuery } from '@tanstack/react-query';
import { BookingService } from '../services/bookingService';

export function useMissions(userId: string | undefined, tab: 'active' | 'history') {
  const activeStatuses = ['open', 'payment_pending', 'matched', 'in_progress'];
  const historyStatuses = ['completed', 'cancelled', 'expired'];
  const statuses = tab === 'active' ? activeStatuses : historyStatuses;

  return useQuery({
    queryKey: ['missions', userId, tab],
    queryFn: () => BookingService.fetchClientMissions(userId!, statuses),
    enabled: !!userId,
  });
}
