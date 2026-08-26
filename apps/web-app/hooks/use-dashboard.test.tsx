import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useDashboard } from './use-dashboard';
import type { DashboardData } from '@team-portal/types';

vi.mock('../lib/dashboard-api', () => ({
  fetchDashboardData: vi.fn(),
}));

import { fetchDashboardData } from '../lib/dashboard-api';

const mockDashboardData: DashboardData = {
  stats: {
    newToday: 100,
    pending: 10,
    resolved: 50,
    avgResponseMinutes: 30,
    newTodayChange: 5,
    pendingChange: -1,
    resolvedChange: 3,
    avgResponseChange: -2,
  },
  trend: [],
  distribution: [],
  topAssignees: [],
};

function createWrapper(): {
  wrapper: (props: { children: ReactNode }) => JSX.Element;
  queryClient: QueryClient;
} {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return {
    queryClient,
    wrapper: ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  };
}

describe('useDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches dashboard data for the given locale', async () => {
    vi.mocked(fetchDashboardData).mockResolvedValue(mockDashboardData);
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useDashboard('en'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(fetchDashboardData).toHaveBeenCalledWith('en');
    expect(result.current.data).toEqual(mockDashboardData);
  });

  it('uses a locale-aware query key so switching locales refetches', async () => {
    vi.mocked(fetchDashboardData).mockResolvedValue(mockDashboardData);
    const { wrapper, queryClient } = createWrapper();

    const { result, rerender } = renderHook(
      ({ locale }: { locale: string }) => useDashboard(locale),
      { wrapper, initialProps: { locale: 'en' } },
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    rerender({ locale: 'zh' });
    await waitFor(() => expect(fetchDashboardData).toHaveBeenCalledWith('zh'));
    // Both keys should have been observed.
    const cachedEn = queryClient.getQueryData(['dashboard', 'stats', 'en']);
    expect(cachedEn).toBeDefined();
  });

  it('exposes loading state before the fetch resolves', async () => {
    let resolveFetch: (value: DashboardData) => void = () => {};
    vi.mocked(fetchDashboardData).mockReturnValue(
      new Promise<DashboardData>((resolve) => {
        resolveFetch = resolve;
      }),
    );
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useDashboard('en'), { wrapper });
    expect(result.current.isLoading).toBe(true);

    resolveFetch(mockDashboardData);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});
