import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { datasql } from '@/lib/supabase';
import { qk } from '@/lib/queryKeys';

export function useRealtimeSync(userId: string | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;

    // A job or bid change can affect either side's lists and any open detail view.
    const invalidate = () => {
      queryClient.invalidateQueries({ queryKey: qk.missions(userId) });
      queryClient.invalidateQueries({ queryKey: qk.trips(userId) });
      queryClient.invalidateQueries({ queryKey: qk.jobDetails() });
    };

    const jobChannel = datasql
      .channel('mobile-jobs-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'jobs' }, invalidate)
      .subscribe();

    const bidChannel = datasql
      .channel('mobile-bids-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bids' }, invalidate)
      .subscribe();

    return () => {
      datasql.removeChannel(jobChannel);
      datasql.removeChannel(bidChannel);
    };
  }, [userId, queryClient]);
}
