import { useQuery } from '@tanstack/react-query';
import { qk } from '@/lib/queryKeys';
import { BookingService } from '../services/bookingService';

export function useJobDetails(jobId: string | undefined) {
  return useQuery({
    queryKey: qk.jobDetails(jobId),
    queryFn: async () => {
      const [job, bids] = await Promise.all([
        BookingService.fetchJobDetails(jobId!),
        BookingService.fetchJobBids(jobId!),
      ]);
      return { job, bids };
    },
    enabled: !!jobId,
  });
}
