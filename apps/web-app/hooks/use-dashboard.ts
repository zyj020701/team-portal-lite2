'use client';

import { useQuery } from '@tanstack/react-query';
import type { DashboardData } from '@team-portal/types';
import { fetchDashboardData } from '../lib/dashboard-api';
import { dashboardKeys } from '../lib/query-keys';

export { dashboardKeys } from '../lib/query-keys';

/**
 * TanStack Query hook for dashboard data.
 * queryKey: ['dashboard', 'stats', locale]
 * Auto-refreshes every 30s, keeps previous data during refetch.
 */
export function useDashboard(locale: string) {
  return useQuery<DashboardData, Error>({
    queryKey: dashboardKeys.stats(locale),
    queryFn: () => fetchDashboardData(locale),
    refetchInterval: 30000,
    placeholderData: (previousData: DashboardData | undefined) => previousData,
    staleTime: 60000,
    retry: 2,
  });
}
