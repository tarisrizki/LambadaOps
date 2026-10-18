'use client';

import { QueryClient, QueryClientProvider, QueryCache } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';
import { removeTokenCookie, removeCsrfToken } from '@/lib/cookies';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({
          onError: (error: Error | unknown) => {
            if (error && typeof error === 'object' && ('status' in error || 'message' in error)) {
              const err = error as Record<string, unknown>;
              if (err.status === 401 || (typeof err.message === 'string' && err.message.includes('401'))) {
                // Clear auth cookies (FE-005) instead of localStorage
                removeTokenCookie();
                removeCsrfToken();
                window.location.href = '/login';
              }
            }
          },
        }),
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
