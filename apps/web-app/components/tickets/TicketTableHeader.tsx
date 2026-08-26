'use client';

import { useCallback } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useTicketStore } from '../../stores/ticket-store';
import { cn } from '@team-portal/utils';

type SortField = 'createdAt' | 'priority';

interface SortableHeaderProps {
  field: SortField;
  children: React.ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

function SortIcon({ active, direction }: { active: boolean; direction: 'asc' | 'desc' }) {
  return (
    <span className="ml-1 inline-flex flex-col leading-none">
      <svg
        className={cn(
          'h-2.5 w-2.5',
          active && direction === 'asc' ? 'text-primary' : 'text-neutral-300',
        )}
        viewBox="0 0 10 6"
        fill="currentColor"
      >
        <path d="M5 0L10 6H0z" />
      </svg>
      <svg
        className={cn(
          'h-2.5 w-2.5',
          active && direction === 'desc' ? 'text-primary' : 'text-neutral-300',
        )}
        viewBox="0 0 10 6"
        fill="currentColor"
      >
        <path d="M5 6L0 0h10z" />
      </svg>
    </span>
  );
}

function SortableHeader({
  field,
  children,
  width,
  align = 'left',
  className,
}: SortableHeaderProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const sort = useTicketStore((s) => s.sort);
  const toggleSort = useTicketStore((s) => s.toggleSort);
  const isActive = sort.field === field;

  const handleClick = useCallback(() => {
    const nextDirection = sort.field === field && sort.direction === 'desc' ? 'asc' : 'desc';
    toggleSort(field);

    const params = new URLSearchParams(searchParams.toString());
    params.set('sortField', field);
    params.set('sortDir', nextDirection);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [field, sort.field, sort.direction, toggleSort, searchParams, router, pathname]);

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        'inline-flex items-center text-xs font-semibold uppercase tracking-wider text-neutral-500 hover:text-neutral-700',
        align === 'center' && 'justify-center',
        align === 'right' && 'justify-end',
        className,
      )}
      style={{ width }}
      aria-label={
        isActive
          ? `${children as string} (${sort.direction === 'asc' ? 'ascending' : 'descending'})`
          : (children as string)
      }
    >
      {children}
      <SortIcon active={isActive} direction={sort.direction} />
    </button>
  );
}

export function TicketTableHeader() {
  const t = useTranslations('tickets.columns');

  return (
    <div className="hidden items-center gap-3 border-b border-neutral-200 bg-neutral-50 px-4 py-2.5 md:flex">
      <div className="w-4 flex-shrink-0" />
      <div className="w-24 flex-shrink-0 text-xs font-semibold uppercase tracking-wider text-neutral-500">
        {t('id')}
      </div>
      <div className="min-w-0 flex-1 text-xs font-semibold uppercase tracking-wider text-neutral-500">
        {t('title')}
      </div>
      <div className="hidden w-32 flex-shrink-0 text-xs font-semibold uppercase tracking-wider text-neutral-500 2xl:block">
        {t('customer')}
      </div>
      <SortableHeader field="priority" width="4rem" className="w-16 flex-shrink-0">
        {t('priority')}
      </SortableHeader>
      <div className="w-20 flex-shrink-0 text-xs font-semibold uppercase tracking-wider text-neutral-500">
        {t('status')}
      </div>
      <div className="hidden w-20 flex-shrink-0 text-xs font-semibold uppercase tracking-wider text-neutral-500 lg:block">
        {t('assignee')}
      </div>
      <SortableHeader field="createdAt" width="9rem" className="hidden w-36 flex-shrink-0 lg:flex">
        {t('createdAt')}
      </SortableHeader>
    </div>
  );
}
