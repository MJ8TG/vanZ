import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { useState } from 'react';

export default function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            gcTime: 5 * 60 * 1000, // 5 minutes (replaced cacheTime in v5)
            // Bound the backoff so a failing request surfaces an error state
            // in a few seconds instead of retrying deep into a long backoff.
            retry: 2,
            retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 4000),
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
