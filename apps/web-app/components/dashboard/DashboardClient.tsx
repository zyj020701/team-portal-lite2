'use client';

import { memo, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { Card } from '@team-portal/ui';
import { useDashboard } from '../../hooks/use-dashboard';
import { StatCard } from './StatCard';

const ChartSkeleton = ({ className }: { className?: string }) => (
  <Card className={`animate-pulse p-5 ${className ?? ''}`}>
    <div className="h-4 w-32 rounded bg-neutral-200" />
    <div className="mt-6 flex h-64 items-end gap-2">
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <div
          key={i}
          className="flex-1 rounded-t bg-neutral-200"
          style={{ height: `${30 + Math.random() * 60}%` }}
        />
      ))}
    </div>
  </Card>
);

const TrendChart = dynamic(() => import('./TrendChart').then((m) => ({ default: m.TrendChart })), {
  ssr: false,
  loading: () => <ChartSkeleton />,
});
const StatusPieChart = dynamic(
  () => import('./StatusPieChart').then((m) => ({ default: m.StatusPieChart })),
  { ssr: false, loading: () => <ChartSkeleton /> },
);
const TopAssigneesBarChart = dynamic(
  () => import('./TopAssigneesBarChart').then((m) => ({ default: m.TopAssigneesBarChart })),
  { ssr: false, loading: () => <ChartSkeleton className="h-72" /> },
);

interface DashboardClientProps {
  locale: string;
}

function formatMinutes(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  return `${hours}h ${minutes}m`;
}

function DashboardClientImpl({ locale }: DashboardClientProps) {
  const t = useTranslations('dashboard');
  const { data, isLoading, isError, isFetching, refetch } = useDashboard(locale);
  const handleRefresh = useCallback(() => {
    void refetch();
  }, [refetch]);
  const stats = data?.stats;
  const trend = useMemo(() => data?.trend ?? [], [data?.trend]);
  const distribution = useMemo(() => data?.distribution ?? [], [data?.distribution]);
  const topAssignees = useMemo(() => data?.topAssignees ?? [], [data?.topAssignees]);

  if (isLoading && !data) {
    return (
      <div className="space-y-6" role="status" aria-label={t('loading')}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Card key={i} className="h-32 animate-pulse p-5">
              <div className="h-4 w-24 rounded bg-neutral-200" />
              <div className="mt-4 h-8 w-16 rounded bg-neutral-200" />
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card className="h-80 animate-pulse p-5" />
          <Card className="h-80 animate-pulse p-5" />
        </div>
      </div>
    );
  }
  if (isError && !data) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-4 rounded-lg border border-neutral-200 bg-white p-12 text-center"
        role="alert"
      >
        <p className="text-lg font-medium text-neutral-800">{t('error')}</p>
        <button
          type="button"
          onClick={handleRefresh}
          className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
        >
          {t('retry')}
        </button>
      </div>
    );
  }
  if (!data || (!stats && trend.length === 0)) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-4 rounded-lg border border-neutral-200 bg-white p-12 text-center"
        role="status"
      >
        <svg
          className="h-16 w-16 text-neutral-300"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
        <p className="text-lg font-medium text-neutral-800">{t('noData')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neutral-900">{t('title')}</h1>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={isFetching}
          className="inline-flex items-center gap-2 rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-800 transition-colors hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 disabled:opacity-50"
          aria-label={t('refresh')}
        >
          <svg
            className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          {isFetching ? t('refreshing') : t('refresh')}
        </button>
      </div>
      {stats && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label={t('stats.newToday')}
            value={stats.newToday}
            change={stats.newTodayChange}
            icon={
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            }
            ariaLabel={t('card.newAria', {
              count: stats.newToday,
              percent: Math.abs(stats.newTodayChange),
            })}
          />
          <StatCard
            label={t('stats.pending')}
            value={stats.pending}
            change={stats.pendingChange}
            positiveIsGood={false}
            href="/tickets?status=pending"
            icon={
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            }
            ariaLabel={t('card.pendingAria', {
              count: stats.pending,
              percent: Math.abs(stats.pendingChange),
            })}
          />
          <StatCard
            label={t('stats.resolved')}
            value={stats.resolved}
            change={stats.resolvedChange}
            icon={
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            }
            ariaLabel={t('card.resolvedAria', {
              count: stats.resolved,
              percent: Math.abs(stats.resolvedChange),
            })}
          />
          <StatCard
            label={t('stats.avgResponse')}
            value={stats.avgResponseMinutes}
            change={stats.avgResponseChange}
            positiveIsGood={false}
            formatValue={formatMinutes}
            icon={
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            }
            ariaLabel={t('card.avgAria', { value: formatMinutes(stats.avgResponseMinutes) })}
          />
        </div>
      )}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <TrendChart data={trend} ariaLabel={t('ariaLabelTrend')} />
        <StatusPieChart data={distribution} ariaLabel={t('ariaLabelPie')} />
      </div>
      <TopAssigneesBarChart data={topAssignees} ariaLabel={t('ariaLabelBar')} />
    </div>
  );
}

export const DashboardClient = memo(DashboardClientImpl);
