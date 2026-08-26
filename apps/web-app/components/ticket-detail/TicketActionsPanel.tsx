'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { type TicketPriority } from '@team-portal/types';
import { useUsers } from '../../hooks/use-tickets';
import { useChangePriority, useAssignTicket } from '../../hooks/use-ticket-detail';

const PRIORITY_OPTIONS: TicketPriority[] = ['urgent', 'high', 'medium', 'low'];

interface TicketActionsPanelProps {
  ticketId: string;
  currentPriority: TicketPriority;
  currentAssigneeId: string | null;
}

export function TicketActionsPanel({
  ticketId,
  currentPriority,
  currentAssigneeId,
}: TicketActionsPanelProps) {
  const t = useTranslations('detail');
  const tCommon = useTranslations('common');
  const { data: users } = useUsers();
  const changePriority = useChangePriority(ticketId);
  const assignTicket = useAssignTicket(ticketId);
  const [priority, setPriority] = useState(currentPriority);
  const [assigneeId, setAssigneeId] = useState(currentAssigneeId ?? '');

  async function handlePriorityChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value as TicketPriority;
    setPriority(next);
    await changePriority.mutateAsync(next);
  }

  async function handleAssignChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value;
    setAssigneeId(next);
    if (next) {
      await assignTicket.mutateAsync(next);
    }
  }

  const isMutating = changePriority.isPending || assignTicket.isPending;

  return (
    <div className="space-y-4">
      <div>
        <label
          htmlFor="ticket-priority-select"
          className="block text-sm font-medium text-neutral-800 mb-1.5"
        >
          {tCommon('fields.priority')}
        </label>
        <select
          id="ticket-priority-select"
          value={priority}
          onChange={handlePriorityChange}
          disabled={isMutating}
          className="w-full rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm text-neutral-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 disabled:opacity-50"
        >
          {PRIORITY_OPTIONS.map((p) => (
            <option key={p} value={p}>
              {t(`priority.${p}`)}
            </option>
          ))}
        </select>
        {changePriority.isError && (
          <p className="mt-1 text-xs text-error-700">{t('priorityChangeFailed')}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="ticket-assignee-select"
          className="block text-sm font-medium text-neutral-800 mb-1.5"
        >
          {tCommon('fields.assignee')}
        </label>
        <select
          id="ticket-assignee-select"
          value={assigneeId}
          onChange={handleAssignChange}
          disabled={isMutating}
          className="w-full rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm text-neutral-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 disabled:opacity-50"
        >
          <option value="">{t('unassigned')}</option>
          {users?.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>
        {assignTicket.isError && <p className="mt-1 text-xs text-error-700">{t('assignFailed')}</p>}
      </div>

      {isMutating && <p className="text-xs text-neutral-500">{t('updating')}</p>}
    </div>
  );
}
