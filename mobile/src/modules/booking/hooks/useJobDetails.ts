import { useQuery } from '@tanstack/react-query';
import { BookingService } from '../services/bookingService';

export function useJobDetails(jobId: string | undefined) {
  return useQuery({
    queryKey: ['job-details', jobId],
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
