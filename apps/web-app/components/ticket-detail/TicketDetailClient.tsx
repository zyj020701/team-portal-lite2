'use client';

import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useTranslations, useFormatter } from 'next-intl';
import { useRouter } from '../../i18n/navigation';
import {
  type TicketDetail as TicketDetailType,
  type TicketStatus,
  type TicketPriority,
} from '@team-portal/types';
import { useTicketDetail, useTicketComments } from '../../hooks/use-ticket-detail';
import { useUsers } from '../../hooks/use-tickets';
import { StatusActions } from './StatusActions';
import { TicketComments } from './TicketComments';
import { TicketActionsPanel } from './TicketActionsPanel';

// Dynamic import timeline (below-the-fold, non-critical) with skeleton
const TicketTimeline = dynamic(
  () => import('./TicketTimeline').then((mod) => ({ default: mod.TicketTimeline })),
  {
    ssr: false,
    loading: () => (
      <div className="animate-pulse space-y-3" role="status" aria-label="Loading timeline">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex gap-3">
            <div className="h-2 w-2 rounded-full bg-neutral-200 mt-1.5 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-24 rounded bg-neutral-200" />
              <div className="h-3 w-full rounded bg-neutral-200" />
            </div>
          </div>
        ))}
      </div>
    ),
  },
);

interface TicketDetailClientProps {
  id: string;
  initialData: TicketDetailType | null;
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-1.5 border-b border-neutral-200 last:border-b-0">
      <span className="text-sm text-neutral-500">{label}</span>
      <span className="text-sm font-medium text-neutral-800">{value}</span>
    </div>
  );
}

export function TicketDetailClient({ id, initialData }: TicketDetailClientProps) {
  const router = useRouter();
  const t = useTranslations('detail');
  const tCommon = useTranslations('common');
  const format = useFormatter();

  const { data: ticket, isLoading, isError } = useTicketDetail(id, initialData ?? undefined);
  const { data: comments = [] } = useTicketComments(id);
  const { data: users } = useUsers();

  const assigneeName = ticket?.assigneeId
    ? (users?.find((u) => u.id === ticket.assigneeId)?.name ?? t('assigned'))
    : t('unassigned');

  // Esc key returns to list
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        router.push('/tickets');
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router]);

  if (isLoading && !ticket) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-neutral-200 rounded w-1/3" />
          <div className="h-32 bg-neutral-200 rounded" />
          <div className="h-48 bg-neutral-200 rounded" />
        </div>
      </div>
    );
  }

  if (isError || !ticket) {
    return (
      <div className="p-6 text-center">
        <p className="text-neutral-800 mb-4">{t('loadError')}</p>
        <button
          onClick={() => router.push('/tickets')}
          className="px-4 py-2 rounded-md bg-primary-600 text-white hover:bg-primary-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
        >
          {t('backToList')}
        </button>
      </div>
    );
  }

  const formatDateTime = (iso: string) =>
    format.dateTime(new Date(iso), {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Back button */}
      <button
        onClick={() => router.push('/tickets')}
        className="mb-4 inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 rounded px-2 py-1"
      >
        ← {t('backToList')}
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title & status actions */}
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-xl font-semibold text-neutral-900">{ticket.title}</h1>
              <p className="text-sm text-neutral-500 mt-1">
                {t('ticketId')}: {ticket.id.slice(0, 8)}
              </p>
            </div>
            <StatusActions ticket={ticket} />
          </div>

          {/* Basic info card */}
          <section className="border border-neutral-200 rounded-lg p-4 bg-white">
            <h2 className="text-sm font-semibold text-neutral-800 mb-2">{t('basicInfo')}</h2>
            <InfoRow
              label={tCommon('fields.status')}
              value={t(`status.${ticket.status as TicketStatus}`)}
            />
            <InfoRow
              label={tCommon('fields.priority')}
              value={t(`priority.${ticket.priority as TicketPriority}`)}
            />
            <InfoRow label={tCommon('fields.createdAt')} value={formatDateTime(ticket.createdAt)} />
            <InfoRow label={tCommon('fields.updatedAt')} value={formatDateTime(ticket.updatedAt)} />
            <InfoRow label={tCommon('fields.assignee')} value={assigneeName} />
          </section>

          {/* Customer info */}
          <section className="border border-neutral-200 rounded-lg p-4 bg-white">
            <h2 className="text-sm font-semibold text-neutral-800 mb-2">{t('customerInfo')}</h2>
            <InfoRow label={t('customerName')} value={ticket.customer.name} />
            <InfoRow label={t('contact')} value={ticket.customer.contact} />
            <InfoRow label={t('company')} value={ticket.customer.company} />
          </section>

          {/* Description */}
          <section className="border border-neutral-200 rounded-lg p-4 bg-white">
            <h2 className="text-sm font-semibold text-neutral-800 mb-2">{t('description')}</h2>
            <p className="text-sm text-neutral-700 whitespace-pre-wrap">{ticket.description}</p>
          </section>

          {/* Comments */}
          <section className="border border-neutral-200 rounded-lg p-4 bg-white">
            <h2 className="text-sm font-semibold text-neutral-800 mb-3">{t('internalNotes')}</h2>
            <TicketComments ticketId={ticket.id} comments={comments} />
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Actions panel */}
          <section className="border border-neutral-200 rounded-lg p-4 bg-white">
            <h2 className="text-sm font-semibold text-neutral-800 mb-3">{t('actions')}</h2>
            <TicketActionsPanel
              ticketId={ticket.id}
              currentPriority={ticket.priority}
              currentAssigneeId={ticket.assigneeId}
            />
          </section>

          {/* Timeline */}
          <section className="border border-neutral-200 rounded-lg p-4 bg-white">
            <h2 className="text-sm font-semibold text-neutral-800 mb-3">{t('timeline.heading')}</h2>
            <TicketTimeline events={ticket.events} />
          </section>
        </div>
      </div>
    </div>
  );
}
