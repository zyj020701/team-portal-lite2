'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';

interface QueryProviderProps {
  children: ReactNode;
}

/**
 * Global QueryClient provider with sensible defaults.
 *
 * Default options:
 * - `staleTime: 60_000` — data is considered fresh for 60 seconds
 * - `gcTime: 5 * 60_000` — unused cache retained for 5 minutes
 * - `retry: 2` — retry failed queries twice
 * - `refetchOnWindowFocus: false` — no automatic refetch on focus
 */
export function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            gcTime: 5 * 60_000,
            retry: 2,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
