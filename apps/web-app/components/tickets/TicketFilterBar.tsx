'use client';

import { useMemo } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import type { TicketStatus, TicketPriority } from '@team-portal/types';
import { useUsers } from '../../hooks/use-tickets';
import { useTicketFilters } from '../../hooks/use-ticket-filters';

const STATUS_VALUES: readonly TicketStatus[] = [
  'pending',
  'in_progress',
  'resolved',
  'closed',
] as const;

const PRIORITY_VALUES: readonly TicketPriority[] = ['urgent', 'high', 'medium', 'low'] as const;

export function TicketFilterBar() {
  const t = useTranslations('tickets');
  const tDetail = useTranslations('detail');
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { data: users } = useUsers();

  const updateUrl = useMemo(
    () => (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      }
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [searchParams, router, pathname],
  );

  const {
    status,
    priority,
    assigneeId,
    localKeyword,
    handleStatusChange,
    handlePriorityChange,
    handleAssigneeChange,
    handleKeywordChange,
    handleKeywordSubmit,
  } = useTicketFilters({ searchParams, updateUrl });

  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-neutral-200 bg-white p-4">
      {/* Status multi-select */}
      <div className="flex items-center gap-1">
        <span className="text-sm text-neutral-500">{t('filter.placeholderStatus')}:</span>
        {STATUS_VALUES.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => handleStatusChange(value)}
            aria-pressed={status.includes(value)}
            className={`rounded-md px-2 py-1 text-xs font-medium transition-colors ${
              status.includes(value)
                ? 'bg-primary-600 text-white'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            {tDetail(`status.${value}`)}
          </button>
        ))}
      </div>

      {/* Priority multi-select */}
      <div className="flex items-center gap-1">
        <span className="text-sm text-neutral-500">{t('filter.placeholderPriority')}:</span>
        {PRIORITY_VALUES.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => handlePriorityChange(value)}
            aria-pressed={priority.includes(value)}
            className={`rounded-md px-2 py-1 text-xs font-medium transition-colors ${
              priority.includes(value)
                ? 'bg-primary-600 text-white'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            {tDetail(`priority.${value}`)}
          </button>
        ))}
      </div>

      {/* Assignee select */}
      <select
        value={assigneeId ?? ''}
        onChange={(e) => handleAssigneeChange(e.target.value)}
        className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm text-neutral-700 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        aria-label={t('filter.placeholderAssignee')}
      >
        <option value="">{t('filter.allAssignees')}</option>
        {users?.map((u) => (
          <option key={u.id} value={u.id}>
            {u.name}
          </option>
        ))}
      </select>

      {/* Keyword search */}
      <input
        type="text"
        value={localKeyword}
        onChange={(e) => handleKeywordChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleKeywordSubmit(localKeyword);
        }}
        placeholder={t('filter.searchPlaceholder')}
        className="min-w-[240px] flex-1 rounded-md border border-neutral-300 px-3 py-1.5 text-sm text-neutral-700 placeholder:text-neutral-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        aria-label={t('filter.searchAriaLabel')}
      />
    </div>
  );
}
