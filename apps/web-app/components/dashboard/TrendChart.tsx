'use client';

import { memo, useMemo, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { TrendPoint } from '@team-portal/types';
import { Card } from '@team-portal/ui';
import { useRouter } from '../../i18n/navigation';

interface TrendChartProps {
  data: TrendPoint[];
  ariaLabel: string;
}

/**
 * Near 7-day ticket trend: dual-line (created vs resolved).
 * Clicking a data point drills down to /tickets?date=YYYY-MM-DD.
 * Different stroke styles ensure color is not the sole distinguisher.
 */
function TrendChartImpl({ data, ariaLabel }: TrendChartProps) {
  const t = useTranslations('dashboard');
  const router = useRouter();

  const chartData = useMemo(() => data, [data]);

  const handleChartClick = useCallback(
    (entry: unknown) => {
      const state = entry as { activePayload?: Array<{ payload?: TrendPoint }> } | null;
      const point = state?.activePayload?.[0]?.payload;
      if (point?.date) {
        router.push(`/tickets?date=${point.date}`);
      }
    },
    [router],
  );

  return (
    <Card className="p-5" aria-label={ariaLabel}>
      <h2 className="mb-4 text-lg font-semibold text-neutral-900">{t('trend')}</h2>
      <div className="h-72 w-full" role="img" aria-label={ariaLabel}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
            onClick={handleChartClick}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-neutral-200)" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12, fill: 'var(--color-neutral-500)' }}
              tickFormatter={(v: string) => v.slice(5)}
            />
            <YAxis tick={{ fontSize: 12, fill: 'var(--color-neutral-500)' }} />
            <Tooltip
              formatter={(value, name) => {
                const label = name === 'created' ? t('newTickets') : t('resolvedTickets');
                return [String(value ?? ''), label];
              }}
              contentStyle={{
                borderRadius: 'var(--radius-medium)',
                border: '1px solid var(--color-neutral-200)',
              }}
            />
            <Legend
              formatter={(value: string) =>
                value === 'created' ? t('newTickets') : t('resolvedTickets')
              }
            />
            <Line
              type="monotone"
              dataKey="created"
              stroke="var(--color-primary-600)"
              strokeWidth={2}
              dot={{ r: 4, fill: 'var(--color-primary-600)' }}
              activeDot={{ r: 6, style: { cursor: 'pointer' } }}
            />
            <Line
              type="monotone"
              dataKey="resolved"
              stroke="var(--color-success-600)"
              strokeWidth={2}
              strokeDasharray="6 3"
              dot={{ r: 4, fill: 'var(--color-success-600)' }}
              activeDot={{ r: 6, style: { cursor: 'pointer' } }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-2 text-center text-xs text-neutral-500">{t('clickToDrillDown')}</p>
    </Card>
  );
}

export const TrendChart = memo(TrendChartImpl);
