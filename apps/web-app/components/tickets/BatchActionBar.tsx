'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useTicketStore } from '../../stores/ticket-store';
import { useBatchAssignTickets, useBatchCloseTickets, useUsers } from '../../hooks/use-tickets';
import { cn } from '@team-portal/utils';

export function BatchActionBar() {
  const t = useTranslations('tickets.batch');
  const selectedIds = useTicketStore((s) => s.selectedIds);
  const clearSelection = useTicketStore((s) => s.clearSelection);
  const { data: users } = useUsers();
  const assignMutation = useBatchAssignTickets();
  const closeMutation = useBatchCloseTickets();

  const [showAssign, setShowAssign] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [assignUserId, setAssignUserId] = useState('');

  const selectedCount = selectedIds.length;

  if (selectedCount === 0) return null;

  const handleAssign = async () => {
    if (!assignUserId) return;
    await assignMutation.mutateAsync({
      ticketIds: selectedIds,
      assigneeId: assignUserId,
    });
    setShowAssign(false);
    setAssignUserId('');
    clearSelection();
  };

  const handleClose = async () => {
    await closeMutation.mutateAsync(selectedIds);
    setShowCloseConfirm(false);
    clearSelection();
  };

  const isMutating = assignMutation.isPending || closeMutation.isPending;

  return (
    <div className="flex items-center gap-3 border-b border-primary/20 bg-primary/5 px-4 py-2.5">
      <span className="text-sm font-medium text-primary">
        {t('selected', { count: selectedCount })}
      </span>

      <div className="flex-1" />

      {showAssign ? (
        <div className="flex items-center gap-2">
          <select
            value={assignUserId}
            onChange={(e) => setAssignUserId(e.target.value)}
            className="rounded-md border border-neutral-300 px-2 py-1 text-sm"
            autoFocus
            aria-label={t('selectAssignee')}
          >
            <option value="">{t('selectAssignee')}</option>
            {users?.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleAssign}
            disabled={!assignUserId || isMutating}
            className="rounded-md bg-primary-600 px-3 py-1 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
          >
            {t('confirmAssign')}
          </button>
          <button
            type="button"
            onClick={() => setShowAssign(false)}
            className="rounded-md px-3 py-1 text-sm text-neutral-600 hover:bg-neutral-100"
          >
            {t('cancel')}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowAssign(true)}
          disabled={isMutating}
          className="rounded-md border border-neutral-300 bg-white px-3 py-1 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
        >
          {t('assign')}
        </button>
      )}

      {showCloseConfirm ? (
        <div className="flex items-center gap-2">
          <span className="text-sm text-error-700">{t('confirmClose')}</span>
          <button
            type="button"
            onClick={handleClose}
            disabled={isMutating}
            className="rounded-md bg-error-600 px-3 py-1 text-sm font-medium text-white hover:bg-error-700 disabled:opacity-50"
          >
            {t('confirmCloseBtn')}
          </button>
          <button
            type="button"
            onClick={() => setShowCloseConfirm(false)}
            className="rounded-md px-3 py-1 text-sm text-neutral-600 hover:bg-neutral-100"
          >
            {t('cancel')}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowCloseConfirm(true)}
          disabled={isMutating}
          className="rounded-md border border-error/30 bg-white px-3 py-1 text-sm font-medium text-error hover:bg-error/5 disabled:opacity-50"
        >
          {t('close')}
        </button>
      )}

      <button
        type="button"
        onClick={clearSelection}
        className={cn(
          'rounded-md px-3 py-1 text-sm text-neutral-500 hover:bg-neutral-100',
          isMutating && 'opacity-50',
        )}
        disabled={isMutating}
      >
        {t('clearSelection')}
      </button>
    </div>
  );
}
