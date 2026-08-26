'use client';

import { memo, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from 'recharts';
import type { AssigneeRank } from '@team-portal/types';
import { Card } from '@team-portal/ui';

interface TopAssigneesBarChartProps {
  data: AssigneeRank[];
  ariaLabel: string;
}

/**
 * Top 5 assignees by ticket count.
 * Value labels are shown on each bar so color is not the sole distinguisher.
 */
function TopAssigneesBarChartImpl({ data, ariaLabel }: TopAssigneesBarChartProps) {
  const t = useTranslations('dashboard');

  const chartData = useMemo(
    () => data.slice(0, 5).map((d) => ({ name: d.assigneeName, count: d.count })),
    [data],
  );

  return (
    <Card className="p-5" aria-label={ariaLabel}>
      <h2 className="mb-4 text-lg font-semibold text-neutral-900">{t('topAssignees')}</h2>
      <div className="h-72 w-full" role="img" aria-label={ariaLabel}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 40, bottom: 5, left: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-neutral-200)" />
            <XAxis type="number" tick={{ fontSize: 12, fill: 'var(--color-neutral-500)' }} />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 12, fill: 'var(--color-neutral-500)' }}
              width={80}
            />
            <Tooltip
              formatter={(value) => [String(value ?? ''), t('ticketCount')]}
              contentStyle={{
                borderRadius: 'var(--radius-medium)',
                border: '1px solid var(--color-neutral-200)',
              }}
            />
            <Bar dataKey="count" fill="var(--color-primary-500)" radius={[0, 4, 4, 0]}>
              <LabelList
                dataKey="count"
                position="right"
                fill="var(--color-neutral-700)"
                fontSize={12}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

export const TopAssigneesBarChart = memo(TopAssigneesBarChartImpl);
