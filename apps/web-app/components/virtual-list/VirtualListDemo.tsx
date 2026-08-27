'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { VirtualList, type VirtualListHandle } from '@team-portal/ui';

const TOTAL_ROWS = 100_000;

interface DemoRow {
  id: string;
  index: number;
  title: string;
  detail: string;
}

/** Ticket-like title snippets of varying length to simulate dynamic row heights. */
const TITLE_PARTS = [
  'Login',
  'Payment',
  'Dashboard export',
  'WebSocket notification delivery',
  'Bulk ticket assignment across multiple teams',
  'Multi-tenant theme switch',
  'Virtual list smooth scrolling performance verification with 100k rows',
];

const DETAIL_PARTS = [
  'High priority.',
  'Customer reported intermittent failures over the last week.',
  'Affects the filter bar, detail timeline, and dashboard charts under heavy load.',
  'Requires investigation of the connection heartbeat, exponential-backoff reconnect, and queued message flush after recovery.',
];

function buildRows(): DemoRow[] {
  const rows = new Array<DemoRow>(TOTAL_ROWS);
  for (let i = 0; i < TOTAL_ROWS; i += 1) {
    const title = TITLE_PARTS[i % TITLE_PARTS.length];
    const detailCount = (i % 3) + 1;
    const detail = Array.from(
      { length: detailCount },
      (_v, d) => DETAIL_PARTS[(i + d) % DETAIL_PARTS.length],
    ).join(' ');
    rows[i] = {
      id: `demo-row-${i}`,
      index: i,
      title: `#${i + 1} · ${title}`,
      detail,
    };
  }
  return rows;
}

export function VirtualListDemo() {
  const t = useTranslations('virtualList');
  const listRef = useRef<VirtualListHandle>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [rows, setRows] = useState<DemoRow[]>([]);
  const [generating, setGenerating] = useState(true);
  const [jumpValue, setJumpValue] = useState('50000');
  const [domRows, setDomRows] = useState(0);

  // Defer 100k row generation so the page shell paints first (avoids blocking FCP).
  useEffect(() => {
    const timer = setTimeout(() => {
      setRows(buildRows());
      setGenerating(false);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Observe how many rows are actually in the DOM — should stay in the ~20–30 range.
  useEffect(() => {
    if (generating) return;
    const container = scrollContainerRef.current;
    if (!container || typeof MutationObserver === 'undefined') return;

    const count = () => {
      setDomRows(container.querySelectorAll('[role="listitem"]').length);
    };
    count();

    const observer = new MutationObserver(count);
    observer.observe(container, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [generating]);

  const jumpIndex = useMemo(() => {
    const parsed = Number.parseInt(jumpValue, 10);
    if (Number.isNaN(parsed)) return null;
    return Math.min(Math.max(parsed - 1, 0), TOTAL_ROWS - 1);
  }, [jumpValue]);

  function handleJump() {
    if (jumpIndex === null) return;
    listRef.current?.scrollToIndex(jumpIndex, { align: 'start' });
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-foreground">{t('title')}</h1>
      <p className="text-muted-foreground">{t('description')}</p>

      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card p-3">
        <span className="text-sm font-medium text-neutral-800">{t('total', { count: TOTAL_ROWS })}</span>
        <label htmlFor="virtual-jump-input" className="sr-only">
          {t('indexPlaceholder')}
        </label>
        <input
          id="virtual-jump-input"
          type="number"
          min={1}
          max={TOTAL_ROWS}
          value={jumpValue}
          onChange={(e) => setJumpValue(e.target.value)}
          placeholder={t('indexPlaceholder')}
          className="w-32 rounded-md border border-neutral-300 px-3 py-1.5 text-sm text-neutral-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
        />
        <button
          type="button"
          onClick={handleJump}
          disabled={generating || jumpIndex === null}
          className="rounded-md bg-primary-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-primary-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 disabled:opacity-50"
        >
          {t('jump')}
        </button>
        <span
          className="ml-auto text-sm text-neutral-500"
          role="status"
          aria-label={t('measureDom')}
        >
          {t('currentDomRows', { count: domRows })}
        </span>
      </div>

      <div
        ref={scrollContainerRef}
        className="h-[600px] rounded-lg border border-border bg-card"
      >
        {generating ? (
          <div className="flex h-full items-center justify-center text-sm text-neutral-500">
            {t('generating')}
          </div>
        ) : (
          <VirtualList<DemoRow>
            ref={listRef}
            items={rows}
            itemKey={(item) => item.id}
            estimateSize={72}
            renderItem={(item) => (
              <div className="border-b border-neutral-100 px-4 py-3">
                <p className="text-sm font-semibold text-neutral-900">{item.title}</p>
                <p className="mt-0.5 text-xs text-neutral-500">{item.detail}</p>
              </div>
            )}
            endPlaceholder={<span aria-hidden="true" />}
          />
        )}
      </div>
    </div>
  );
}
