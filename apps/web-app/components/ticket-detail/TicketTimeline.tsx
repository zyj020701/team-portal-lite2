'use client';

import { useMemo } from 'react';
import { useTranslations, useFormatter } from 'next-intl';
import type {
  TimelineEvent,
  TimelineEventType,
  TicketStatus,
  TicketPriority,
} from '@team-portal/types';

interface TicketTimelineProps {
  events: TimelineEvent[];
}

const TYPE_ORDER: Record<TimelineEventType, number> = {
  created: 0,
  assigned: 1,
  status_changed: 2,
  priority_changed: 3,
  comment: 4,
};

export function TicketTimeline({ events }: TicketTimelineProps) {
  const t = useTranslations('detail.timeline');
  const tDetail = useTranslations('detail');
  const format = useFormatter();

  const sorted = useMemo(() => {
    return [...events].sort((a, b) => {
      const timeDiff = new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      if (timeDiff !== 0) return timeDiff;
      return TYPE_ORDER[a.type] - TYPE_ORDER[b.type];
    });
  }, [events]);

  function getEventDescription(event: TimelineEvent): string {
    switch (event.type) {
      case 'status_changed':
        if (event.fromStatus && event.toStatus) {
          return `${tDetail(`status.${event.fromStatus as TicketStatus}`)} → ${tDetail(`status.${event.toStatus as TicketStatus}`)}`;
        }
        return event.content;
      case 'priority_changed':
        if (event.fromPriority && event.toPriority) {
          return `${tDetail(`priority.${event.fromPriority as TicketPriority}`)} → ${tDetail(`priority.${event.toPriority as TicketPriority}`)}`;
        }
        return event.content;
      case 'assigned':
        if (event.toAssignee) {
          return t('assignedTo', { name: event.toAssignee.name });
        }
        return event.content;
      default:
        return event.content;
    }
  }

  return (
    <div className="space-y-0">
      {sorted.map((event, idx) => (
        <div key={event.id} className="flex gap-3">
          <div className="flex flex-col items-center">
            <div
              className={`h-2.5 w-2.5 rounded-full mt-1.5 ${
                event.type === 'comment'
                  ? 'bg-info-500'
                  : event.type === 'status_changed'
                    ? 'bg-warning-500'
                    : event.type === 'created'
                      ? 'bg-success-500'
                      : 'bg-primary-600'
              }`}
            />
            {idx < sorted.length - 1 && <div className="w-px flex-1 bg-neutral-200 min-h-[2rem]" />}
          </div>
          <div className="pb-4 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-medium text-neutral-600 bg-neutral-100 px-1.5 py-0.5 rounded">
                {t(`types.${event.type}`)}
              </span>
              <span className="text-sm font-medium text-neutral-800">{event.operator.name}</span>
              <span className="text-xs text-neutral-500">
                {format.dateTime(new Date(event.timestamp), {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
            <p className="text-sm text-neutral-800 mt-1">{getEventDescription(event)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
