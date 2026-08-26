'use client';

import { useState } from 'react';
import { useTranslations, useFormatter } from 'next-intl';
import { Button, Modal, Table } from '@team-portal/ui';
import type { Ticket, TicketPriority, TicketStatus } from '@team-portal/types';

interface TicketOverviewProps {
  tickets: Ticket[];
}

const priorityStyles: Record<TicketPriority, string> = {
  low: 'bg-neutral-100 text-neutral-700',
  medium: 'bg-primary-100 text-primary-700',
  high: 'bg-warning-100 text-warning-700',
  urgent: 'bg-error-100 text-error-700',
};

const statusStyles: Record<TicketStatus, string> = {
  pending: 'bg-warning-100 text-warning-700',
  in_progress: 'bg-primary-100 text-primary-700',
  resolved: 'bg-success-100 text-success-700',
  closed: 'bg-neutral-100 text-neutral-700',
};

export function TicketOverview({ tickets }: TicketOverviewProps) {
  const t = useTranslations('tickets');
  const tDetail = useTranslations('detail');
  const tCommon = useTranslations('common');
  const format = useFormatter();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  const columns = [
    { key: 'id', header: t('columns.id') },
    { key: 'title', header: t('columns.title') },
    {
      key: 'status',
      header: t('columns.status'),
      render: (row: Ticket) => (
        <span
          className={`inline-flex items-center rounded-small px-2 py-0.5 text-xs font-medium ${statusStyles[row.status]}`}
        >
          {tDetail(`status.${row.status}`)}
        </span>
      ),
    },
    {
      key: 'priority',
      header: t('columns.priority'),
      render: (row: Ticket) => (
        <span
          className={`inline-flex items-center rounded-small px-2 py-0.5 text-xs font-medium ${priorityStyles[row.priority]}`}
        >
          {tDetail(`priority.${row.priority}`)}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: t('columns.createdAt'),
      render: (row: Ticket) => format.dateTime(new Date(row.createdAt), { dateStyle: 'short' }),
    },
  ];

  const handleRowClick = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setModalOpen(true);
  };

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-neutral-900">{t('overview.title')}</h2>
        <Button variant="primary" size="sm" onClick={() => setModalOpen(true)}>
          {t('overview.viewDetails')}
        </Button>
      </div>

      <div
        onClick={() => tickets.length > 0 && handleRowClick(tickets[0]!)}
        className="cursor-pointer"
      >
        <Table<Ticket> columns={columns} data={tickets} />
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={
          selectedTicket
            ? t('overview.ticketDetail', { id: selectedTicket.id })
            : t('overview.detailTitle')
        }
      >
        {selectedTicket ? (
          <div className="space-y-3 text-neutral-700">
            <p>
              <span className="font-medium text-neutral-900">{t('columns.title')}：</span>
              {selectedTicket.title}
            </p>
            <p>
              <span className="font-medium text-neutral-900">{t('columns.status')}：</span>
              {tDetail(`status.${selectedTicket.status}`)}
            </p>
            <p>
              <span className="font-medium text-neutral-900">{t('columns.createdAt')}：</span>
              {format.dateTime(new Date(selectedTicket.createdAt), {
                dateStyle: 'short',
              })}
            </p>
          </div>
        ) : (
          <p className="text-neutral-500">{t('overview.clickToView')}</p>
        )}
        <div className="mt-6 flex justify-end">
          <Button variant="ghost" onClick={() => setModalOpen(false)}>
            {tCommon('close')}
          </Button>
        </div>
      </Modal>
    </section>
  );
}
