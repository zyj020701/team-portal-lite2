'use client';

import { memo, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { StatusDistributionItem } from '@team-portal/types';
import { Card } from '@team-portal/ui';

interface StatusPieChartProps {
  data: StatusDistributionItem[];
  ariaLabel: string;
}

const COLORS: Record<string, string> = {
  pending: 'var(--color-warning-500)',
  in_progress: 'var(--color-primary-500)',
  resolved: 'var(--color-success-500)',
  closed: 'var(--color-neutral-400)',
};

/**
 * Ticket status distribution pie chart.
 * Each slice shows a percentage label so color is not the sole distinguisher.
 */
function StatusPieChartImpl({ data, ariaLabel }: StatusPieChartProps) {
  const t = useTranslations('dashboard');

  const chartData = useMemo(() => data, [data]);
  const total = useMemo(() => data.reduce((sum, d) => sum + d.count, 0), [data]);

  return (
    <Card className="p-5" aria-label={ariaLabel}>
      <h2 className="mb-4 text-lg font-semibold text-neutral-900">{t('distribution')}</h2>
      <div className="h-72 w-full" role="img" aria-label={ariaLabel}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="count"
              nameKey="status"
              cx="50%"
              cy="50%"
              outerRadius={90}
              label={
                ((props: Record<string, unknown>) => {
                  const status = props.status as StatusDistributionItem['status'] | undefined;
                  const count = (props.count as number) ?? 0;
                  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                  return status ? `${t(`status.${status}`)} ${pct}%` : '';
                }) as never
              }
              labelLine={false}
            >
              {chartData.map((entry) => (
                <Cell
                  key={entry.status}
                  fill={COLORS[entry.status] ?? 'var(--color-neutral-400)'}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name) => [String(value ?? ''), t(`status.${String(name)}`)]}
              contentStyle={{
                borderRadius: 'var(--radius-medium)',
                border: '1px solid var(--color-neutral-200)',
              }}
            />
            <Legend formatter={(value: string) => t(`status.${value}`)} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

export const StatusPieChart = memo(StatusPieChartImpl);
