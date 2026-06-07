import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { datasql } from '@/lib/supabase';

export function useRealtimeSync(userId: string | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;

    // Listen to changes in jobs table
    const jobChannel = datasql
      .channel('mobile-jobs-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'jobs' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['missions', userId] });
          queryClient.invalidateQueries({ queryKey: ['trips', userId] });
          queryClient.invalidateQueries({ queryKey: ['job-details'] });
        }
      )
      .subscribe();

    // Listen to changes in bids table
    const bidChannel = datasql
      .channel('mobile-bids-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bids' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['missions', userId] });
          queryClient.invalidateQueries({ queryKey: ['trips', userId] });
          queryClient.invalidateQueries({ queryKey: ['job-details'] });
        }
      )
      .subscribe();

    return () => {
      datasql.removeChannel(jobChannel);
      datasql.removeChannel(bidChannel);
    };
  }, [userId, queryClient]);
}
