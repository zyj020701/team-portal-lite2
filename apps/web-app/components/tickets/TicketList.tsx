'use client';

import { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { useRouter } from '../../i18n/navigation';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { TicketWithRelations } from '@team-portal/types';
import { TicketRow } from './TicketRow';
import { TicketTableHeader } from './TicketTableHeader';
import { TicketFilterBar } from './TicketFilterBar';
import { useTicketStore } from '../../stores/ticket-store';

// Dynamic import BatchActionBar — only rendered when items are selected.
// This keeps the batch-action UI (Modal, select dropdowns) out of the initial chunk.
const BatchActionBar = dynamic(
  () => import('./BatchActionBar').then((mod) => ({ default: mod.BatchActionBar })),
  {
    ssr: false,
    loading: () => null,
  },
);

interface TicketListProps {
  tickets: TicketWithRelations[];
  isLoading?: boolean;
}

export function TicketList({ tickets, isLoading }: TicketListProps) {
  const t = useTranslations('tickets');
  const router = useRouter();
  const parentRef = useRef<HTMLDivElement>(null);
  const selectedIds = useTicketStore((s) => s.selectedIds);
  const toggleSelect = useTicketStore((s) => s.toggleSelection);
  const selectAll = useTicketStore((s) => s.selectAll);
  const clearSelection = useTicketStore((s) => s.clearSelection);
  const [focusedIndex, setFocusedIndex] = useState(0);

  const rowVirtualizer = useVirtualizer({
    count: tickets.length,
    getScrollElement: () => parentRef.current,
    estimateSize: useCallback(() => 64, []),
    overscan: 8,
  });

  const allSelected = useMemo(
    () => tickets.length > 0 && tickets.every((t) => selectedIds.includes(t.id)),
    [tickets, selectedIds],
  );

  const someSelected = useMemo(
    () => tickets.some((t) => selectedIds.includes(t.id)),
    [tickets, selectedIds],
  );

  const handleSelectAll = useCallback(() => {
    if (allSelected) {
      clearSelection();
    } else {
      selectAll(tickets.map((t) => t.id));
    }
  }, [allSelected, clearSelection, selectAll, tickets]);

  const handleToggleSelect = useCallback(
    (id: string) => {
      toggleSelect(id);
    },
    [toggleSelect],
  );

  // Keyboard navigation
  useEffect(() => {
    const container = parentRef.current;
    if (!container) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedIndex((i) => Math.min(i + 1, tickets.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === ' ' && focusedIndex >= 0) {
        e.preventDefault();
        const ticket = tickets[focusedIndex];
        if (ticket) toggleSelect(ticket.id);
      } else if (e.key === 'Enter' && focusedIndex >= 0) {
        const ticket = tickets[focusedIndex];
        if (ticket) {
          router.push(`/tickets/${ticket.id}`);
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [tickets, focusedIndex, toggleSelect]);

  if (isLoading) {
    return (
      <div className="flex-1 p-8">
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-neutral-100" />
          ))}
        </div>
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
        <svg
          className="mb-4 h-16 w-16 text-neutral-300"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
        <h3 className="text-lg font-medium text-neutral-900">{t('empty.title')}</h3>
        <p className="mt-1 text-sm text-neutral-500">{t('empty.desc')}</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <BatchActionBar />
      <TicketFilterBar />

      {/* Select-all row (desktop) */}
      <div className="hidden items-center gap-3 border-b border-neutral-200 bg-neutral-50 px-4 py-2 md:flex">
        <input
          type="checkbox"
          checked={allSelected}
          ref={(el) => {
            if (el) el.indeterminate = someSelected && !allSelected;
          }}
          onChange={handleSelectAll}
          className="h-4 w-4 rounded border-neutral-300 text-primary focus:ring-primary"
          aria-label={t('list.selectAll')}
        />
        <span className="text-xs text-neutral-500">
          {t('list.count', { count: tickets.length })}
        </span>
      </div>

      <TicketTableHeader />

      <div
        ref={parentRef}
        className="flex-1 overflow-auto"
        role="region"
        aria-label={t('list.ariaLabel')}
        tabIndex={0}
      >
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const ticket = tickets[virtualRow.index];
            if (!ticket) return null;
            return (
              <div
                key={ticket.id}
                data-index={virtualRow.index}
                ref={rowVirtualizer.measureElement}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <TicketRow
                  ticket={ticket}
                  isSelected={selectedIds.includes(ticket.id)}
                  isFocused={focusedIndex === virtualRow.index}
                  onToggleSelect={handleToggleSelect}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
