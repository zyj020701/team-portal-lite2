'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations, useFormatter } from 'next-intl';
import { useWebSocket } from '@team-portal/hooks';
import type { NotificationPayload } from '@team-portal/ws-client';
import { createMockNotificationGenerator } from '@/lib/mock-notifications';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL;

// A real deployment sets NEXT_PUBLIC_WS_URL and we connect to the genuine
// push server. When it is unset there is no push backend (this is a
// front-end-only demo / local dev / Lighthouse CI), so by default we run a
// local simulated real-time feed (new-ticket alerts etc.) and the bell shows
// live notifications + an unread badge in every environment, including the
// Vercel production demo. The feed is fully client-side and network-free.
//
// Overrides:
//   - NEXT_PUBLIC_WS_MOCK=0|false  → force the feed off (bell stays empty)
//   - NEXT_PUBLIC_WS_MOCK=1|true   → force the mock feed on (default anyway)
//   - CI=true                      → forced off so audits/tests stay quiet
function resolveTransport(): { enabled: boolean; useMock: boolean } {
  const hasRealServer = Boolean(WS_URL && !WS_URL.startsWith('wss://echo.websocket'));
  if (hasRealServer) return { enabled: true, useMock: false };

  const flag = process.env.NEXT_PUBLIC_WS_MOCK;
  if (process.env.CI === 'true') return { enabled: false, useMock: false };
  if (flag === '0' || flag === 'false') return { enabled: false, useMock: false };
  // No real server and no explicit opt-out → run the simulated feed.
  return { enabled: true, useMock: true };
}

const { enabled: WS_ENABLED, useMock: USE_MOCK } = resolveTransport();

/**
 * Notification bell with unread badge and dropdown list.
 * Supports single mark-as-read and mark-all-as-read.
 */
export function NotificationBell(): JSX.Element {
  const t = useTranslations('notifications');
  const format = useFormatter();

  // Localized generator for the simulated feed; stable across renders.
  const mockConfig = useMemo(
    () => ({
      interval: 12_000,
      initialBurst: 2,
      generateNotification: createMockNotificationGenerator(
        (key, params) => t(key, params) as string,
      ),
    }),
    [t],
  );

  const { connectionStatus, unreadCount, notifications, markAsRead, markAllAsRead } = useWebSocket(
    { url: WS_URL ?? '' },
    'team-portal-ws',
    WS_ENABLED,
    USE_MOCK ? { transport: 'mock', mockConfig } : { transport: 'realtime' },
  );

  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent): void {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const displayCount = unreadCount > 99 ? '99+' : String(unreadCount);
  // Accessible name must start with the visible badge text to satisfy
  // label-content-name-mismatch. When count > 99 the badge shows "99+".
  const bellAriaLabel =
    unreadCount > 99
      ? `99+ ${t('ariaLabel', { count: 99 })}`
      : t('ariaLabel', { count: unreadCount });
  const statusColor =
    connectionStatus === 'connected'
      ? 'bg-success'
      : connectionStatus === 'reconnecting' || connectionStatus === 'connecting'
        ? 'bg-warning'
        : 'bg-error';

  function formatRelativeTime(iso: string): string {
    const date = new Date(iso);
    const diffMs = Date.now() - date.getTime();
    const minutes = Math.floor(diffMs / 60_000);
    if (minutes < 1) return t('justNow');
    if (minutes < 60) return t('minutesAgo', { count: minutes });
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return t('hoursAgo', { count: hours });
    return format.dateTime(date, { dateStyle: 'short' });
  }

  function getNotificationTypeLabel(type: NotificationPayload['type']): string {
    switch (type) {
      case 'ticket_created':
        return t('types.ticketCreated');
      case 'ticket_assigned':
        return t('types.ticketAssigned');
      case 'ticket_updated':
        return t('types.ticketUpdated');
      case 'mention':
        return t('types.mention');
      default:
        return type;
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={bellAriaLabel}
        aria-expanded={open}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-radius-medium bg-surface-hover text-text-primary transition hover:bg-surface-active focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        {/* Bell icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>

        {unreadCount > 0 && (
          <span
            data-testid="unread-badge"
            className="absolute -right-1 -top-1 inline-flex min-w-[20px] items-center justify-center rounded-radius-full bg-error px-1 text-xs font-semibold leading-5 text-white"
          >
            {displayCount}
          </span>
        )}

        {/* Connection status dot */}
        <span
          data-testid="conn-status"
          aria-hidden="true"
          className={`absolute bottom-1 right-1 h-2 w-2 rounded-full ${statusColor}`}
        />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label={t('title')}
          className="absolute right-0 z-50 mt-2 max-h-[480px] w-[360px] overflow-hidden rounded-radius-large border border-border bg-surface shadow-lg"
        >
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <span className="text-sm font-semibold text-text-primary">{t('title')}</span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="text-xs font-medium text-primary hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                {t('markAllRead')}
              </button>
            )}
          </div>

          <ul className="max-h-[400px] overflow-y-auto" data-testid="notification-list">
            {notifications.length === 0 ? (
              <li className="px-4 py-8 text-center text-sm text-text-secondary">{t('empty')}</li>
            ) : (
              notifications.map((n: NotificationPayload) => (
                <li
                  key={n.id}
                  className={`border-b border-border px-4 py-3 transition hover:bg-surface-hover ${
                    n.read ? 'opacity-60' : 'bg-primary/5'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-text-primary">
                        {getNotificationTypeLabel(n.type)}
                      </p>
                      <p className="mt-1 line-clamp-2 text-xs text-text-secondary">{n.message}</p>
                      <p className="mt-1 text-[10px] text-text-tertiary">
                        {formatRelativeTime(n.createdAt)}
                      </p>
                    </div>
                    {!n.read && (
                      <button
                        type="button"
                        onClick={() => markAsRead(n.id)}
                        aria-label={`${t('read')} ${n.id}`}
                        className="shrink-0 rounded px-2 py-1 text-[10px] font-medium text-primary hover:bg-primary/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      >
                        {t('read')}
                      </button>
                    )}
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
