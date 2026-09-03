'use client';

import { memo } from 'react';
import { useTranslations, useFormatter } from 'next-intl';
import { useRouter } from '../../i18n/navigation';
import type { TicketWithRelations, TicketStatus, TicketPriority } from '@team-portal/types';
import { cn } from '@team-portal/utils';

// Status/priority chips pair a solid light tint (-100 background) with a
// dark shade (-800 text). Using a solid background (instead of a translucent
// `bg-{color}/15`) avoids double-tint colour shifts when a row is selected or
// hovered, and the -800 text clears the WCAG AA 4.5:1 contrast floor on every
// chip. Measured computed-style contrast on the tickets list page: info
// #1e40af on #dbeafe = 7.15:1, warning #92400e on #fef3c7 = 6.37:1, error
// #991b1b on #fee2e2 = 6.80:1, success #166534 on #dcfce7 = 6.49:1, neutral
// #4b5563 on #e5e7eb = 6.10:1. The earlier -700 text on a 15%-opacity tint
// failed Lighthouse's color-contrast audit on the list page.
const STATUS_STYLES: Record<TicketStatus, string> = {
  pending: 'bg-warning-100 text-warning-800',
  in_progress: 'bg-info-100 text-info-800',
  resolved: 'bg-success-100 text-success-800',
  closed: 'bg-neutral-200 text-neutral-600',
};

const PRIORITY_STYLES: Record<TicketPriority, string> = {
  urgent: 'bg-error-100 text-error-800',
  high: 'bg-warning-100 text-warning-800',
  medium: 'bg-info-100 text-info-800',
  low: 'bg-neutral-200 text-neutral-600',
};

interface TicketRowProps {
  ticket: TicketWithRelations;
  isSelected: boolean;
  isFocused: boolean;
  onToggleSelect: (id: string) => void;
}

export const TicketRow = memo(function TicketRow({
  ticket,
  isSelected,
  isFocused,
  onToggleSelect,
}: TicketRowProps) {
  const router = useRouter();
  const t = useTranslations('tickets');
  const tDetail = useTranslations('detail');
  const format = useFormatter();

  const handleClick = () => {
    router.push(`/tickets/${ticket.id}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div
      role="link"
      tabIndex={isFocused ? 0 : -1}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={cn(
        'flex cursor-pointer items-center gap-2 border-b border-neutral-100 px-3 py-3 transition-colors hover:bg-primary/5 focus:outline-none sm:gap-3 sm:px-4',
        isSelected && 'bg-primary/10',
        isFocused && 'ring-2 ring-inset ring-primary',
      )}
      aria-current={isSelected ? 'true' : undefined}
    >
      {/* Checkbox */}
      <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelect(ticket.id)}
          className="h-5 w-5 rounded border-neutral-300 text-primary focus:ring-primary sm:h-4 sm:w-4"
          aria-label={t('list.selectTicket', { id: ticket.id })}
        />
      </div>

      {/* Ticket ID */}
      <div className="hidden w-24 flex-shrink-0 font-mono text-xs text-neutral-500 md:block">
        {ticket.id}
      </div>

      {/* Title + meta */}
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-neutral-900">{ticket.title}</div>
        {/* Mobile: show badges + time on second line */}
        <div className="mt-1 flex items-center gap-2 md:hidden">
          <span
            className={cn(
              'inline-block rounded-full px-2 py-0.5 text-xs font-medium',
              STATUS_STYLES[ticket.status],
            )}
          >
            {tDetail(`status.${ticket.status}`)}
          </span>
          <span
            className={cn(
              'inline-block rounded-full px-2 py-0.5 text-xs font-medium',
              PRIORITY_STYLES[ticket.priority],
            )}
          >
            {tDetail(`priority.${ticket.priority}`)}
          </span>
          <span className="text-xs text-neutral-500">
            {format.dateTime(new Date(ticket.createdAt), { dateStyle: 'short' })}
          </span>
        </div>
        {/* Desktop: show customer subtext */}
        <div className="hidden truncate text-xs text-neutral-500 md:block 2xl:hidden">
          {ticket.customer.name} · {ticket.customer.company}
        </div>
      </div>

      {/* Customer — only at 2xl */}
      <div className="hidden w-32 flex-shrink-0 truncate text-sm text-neutral-600 2xl:block">
        {ticket.customer.name}
      </div>

      {/* Priority */}
      <div className="hidden w-16 flex-shrink-0 md:block">
        <span
          className={cn(
            'inline-block rounded-full px-2 py-0.5 text-xs font-medium',
            PRIORITY_STYLES[ticket.priority],
          )}
        >
          {tDetail(`priority.${ticket.priority}`)}
        </span>
      </div>

      {/* Status */}
      <div className="hidden w-20 flex-shrink-0 md:block">
        <span
          className={cn(
            'inline-block rounded-full px-2 py-0.5 text-xs font-medium',
            STATUS_STYLES[ticket.status],
          )}
        >
          {tDetail(`status.${ticket.status}`)}
        </span>
      </div>

      {/* Assignee */}
      <div className="hidden w-20 flex-shrink-0 text-sm text-neutral-600 lg:block">
        {ticket.assignee?.name ?? <span className="text-neutral-500">{tDetail('unassigned')}</span>}
      </div>

      {/* Created At */}
      <div className="hidden w-36 flex-shrink-0 text-xs text-neutral-500 lg:block">
        {format.dateTime(new Date(ticket.createdAt), { dateStyle: 'short' })}
      </div>
    </div>
  );
});
