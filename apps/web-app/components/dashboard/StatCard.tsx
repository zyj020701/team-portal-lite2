'use client';

import { memo } from 'react';
import { useTranslations } from 'next-intl';
import { Card } from '@team-portal/ui';
import { cn } from '../../lib/cn';
import { useCountUp } from '../../hooks/use-count-up';
import { Link } from '../../i18n/navigation';

export interface StatCardProps {
  label: string;
  value: number;
  change: number;
  /** When positive change is "good" (green). Set false for metrics where up is bad. */
  positiveIsGood?: boolean;
  /** Format the displayed value, e.g. minutes → "2h 18m" */
  formatValue?: (n: number) => string;
  /** Drill-down link */
  href?: string;
  icon: React.ReactNode;
  ariaLabel: string;
}

function StatCardImpl({
  label,
  value,
  change,
  positiveIsGood = true,
  formatValue,
  href,
  icon,
  ariaLabel,
}: StatCardProps) {
  const t = useTranslations('dashboard');
  const animated = useCountUp(value);
  const isUp = change >= 0;
  const isGood = positiveIsGood ? isUp : !isUp;
  const arrow = isUp ? '↑' : '↓';
  const changeColor = isGood ? 'text-success-700' : 'text-error-700';

  const displayValue = formatValue ? formatValue(animated) : animated.toLocaleString();

  const content = (
    <Card
      className={cn(
        'p-5 transition-shadow hover:shadow-md',
        href && 'cursor-pointer focus-visible:ring-2 focus-visible:ring-primary-500',
      )}
      aria-label={ariaLabel}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm text-neutral-500">{label}</p>
          <p className="text-3xl font-bold tabular-nums text-neutral-900">{displayValue}</p>
          <p className={cn('flex items-center gap-1 text-sm font-medium', changeColor)}>
            <span aria-hidden="true">{arrow}</span>
            <span>{Math.abs(change)}%</span>
            <span className="text-neutral-500">{t('vsLastPeriod')}</span>
          </p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
          {icon}
        </div>
      </div>
    </Card>
  );

  if (href) {
    return (
      <Link href={href} className="block focus:outline-none">
        {content}
      </Link>
    );
  }

  return content;
}

export const StatCard = memo(StatCardImpl);
