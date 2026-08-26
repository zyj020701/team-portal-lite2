'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { TicketStatus, TicketDetail } from '@team-portal/types';
import { canTransition, getAvailableTransitions } from '../../lib/ticket-state-machine';
import { useTransitionStatus } from '../../hooks/use-ticket-detail';

interface StatusActionsProps {
  ticket: TicketDetail;
}

const STATUS_BUTTON_VARIANTS: Record<TicketStatus, string> = {
  pending: 'bg-warning-100 text-warning-800 hover:bg-warning-200',
  in_progress: 'bg-info-100 text-info-800 hover:bg-info-200',
  resolved: 'bg-success-100 text-success-800 hover:bg-success-200',
  closed: 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200',
};

export function StatusActions({ ticket }: StatusActionsProps) {
  const t = useTranslations('detail');
  const transition = useTransitionStatus(ticket.id);
  const [confirmTarget, setConfirmTarget] = useState<TicketStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  const available = getAvailableTransitions(ticket.status);

  async function handleTransition(target: TicketStatus) {
    setError(null);

    if (!canTransition(ticket.status, target)) {
      setError(
        t('invalidTransition', {
          from: t(`status.${ticket.status}`),
          to: t(`status.${target}`),
        }),
      );
      return;
    }

    try {
      await transition.mutateAsync(target);
      setConfirmTarget(null);
    } catch {
      setError(t('updateFailed'));
    }
  }

  if (available.length === 0) {
    return <div className="text-sm text-neutral-500">{t('noActions')}</div>;
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {available.map((target) => (
          <button
            key={target}
            type="button"
            disabled={transition.isPending}
            onClick={() => {
              if (target === 'closed') {
                setConfirmTarget(target);
              } else {
                void handleTransition(target);
              }
            }}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 ${
              STATUS_BUTTON_VARIANTS[target]
            }`}
          >
            {transition.isPending && transition.variables === target
              ? t('processing')
              : t('markAs', { status: t(`status.${target}`) })}
          </button>
        ))}
      </div>

      {error && (
        <p className="text-sm text-error" role="alert">
          {error}
        </p>
      )}

      {confirmTarget === 'closed' && (
        <div
          className="border border-neutral-200 rounded-lg p-4 bg-white space-y-3"
          role="dialog"
          aria-modal="true"
          aria-label={t('confirmCloseTitle')}
        >
          <p className="text-sm text-neutral-800">{t('confirmClose')}</p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={transition.isPending}
              onClick={() => void handleTransition('closed')}
              className="px-3 py-1.5 rounded-md text-sm font-medium bg-error-600 text-white hover:bg-error-700 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-error-600"
            >
              {transition.isPending ? t('closing') : t('confirmCloseBtn')}
            </button>
            <button
              type="button"
              disabled={transition.isPending}
              onClick={() => setConfirmTarget(null)}
              className="px-3 py-1.5 rounded-md text-sm font-medium bg-neutral-100 text-neutral-700 hover:bg-neutral-200 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
            >
              {t('cancel')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
