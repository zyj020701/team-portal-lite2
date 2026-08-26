'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { TicketStatus, TicketPriority } from '@team-portal/types';
import { useTicketStore } from '../stores/ticket-store';

/**
 * A read-only view of the URL search parameters that `useTicketFilters`
 * needs. This is intentionally structural so the hook is not coupled to
 * Next.js' `ReadonlyURLSearchParams` and is easy to test.
 */
export interface TicketFiltersSearchParams {
  get(name: string): string | null;
}

/**
 * Callback invoked by {@link useTicketFilters} whenever a filter change
 * should be reflected in the URL. The consumer wires this to
 * `router.replace`.
 */
export type UpdateUrl = (updates: Record<string, string | undefined>) => void;

/** Options accepted by {@link useTicketFilters}. */
export interface UseTicketFiltersOptions {
  /** Current URL search parameters. */
  searchParams: TicketFiltersSearchParams;
  /** Called to write filter changes back to the URL. */
  updateUrl: UpdateUrl;
  /** Debounce window for the keyword search in ms. Defaults to 300. */
  keywordDebounceMs?: number;
}

/**
 * Reads ticket filters from the URL on mount, keeps the Zustand ticket
 * store in sync, and exposes handlers for status/priority/assignee
 * changes plus a debounced keyword search (with immediate Enter submit).
 *
 * The URL is the source of truth; the Zustand store acts as the client
 * cache consumed by the list query.
 */
export function useTicketFilters({
  searchParams,
  updateUrl,
  keywordDebounceMs = 300,
}: UseTicketFiltersOptions) {
  const status = useTicketStore((s) => s.status);
  const priority = useTicketStore((s) => s.priority);
  const assigneeId = useTicketStore((s) => s.assigneeId);
  const keyword = useTicketStore((s) => s.keyword);
  const setStatus = useTicketStore((s) => s.setStatus);
  const setPriority = useTicketStore((s) => s.setPriority);
  const setAssigneeId = useTicketStore((s) => s.setAssigneeId);
  const setKeyword = useTicketStore((s) => s.setKeyword);

  const [localKeyword, setLocalKeyword] = useState(keyword);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialized = useRef(false);

  // Hydrate the store from URL params on mount / when the URL changes.
  useEffect(() => {
    const urlStatus = searchParams.get('status');
    const urlPriority = searchParams.get('priority');
    const urlAssignee = searchParams.get('assignee');
    const urlKeyword = searchParams.get('keyword');

    if (urlStatus) setStatus(urlStatus.split(',') as TicketStatus[]);
    if (urlPriority) setPriority(urlPriority.split(',') as TicketPriority[]);
    if (urlAssignee) setAssigneeId(urlAssignee);
    if (urlKeyword) {
      setKeyword(urlKeyword);
      setLocalKeyword(urlKeyword);
    }
    initialized.current = true;
  }, [searchParams, setStatus, setPriority, setAssigneeId, setKeyword]);

  const handleStatusChange = useCallback(
    (value: TicketStatus) => {
      const next = status.includes(value) ? status.filter((s) => s !== value) : [...status, value];
      setStatus(next);
      updateUrl({ status: next.length > 0 ? next.join(',') : undefined });
    },
    [status, setStatus, updateUrl],
  );

  const handlePriorityChange = useCallback(
    (value: TicketPriority) => {
      const next = priority.includes(value)
        ? priority.filter((p) => p !== value)
        : [...priority, value];
      setPriority(next);
      updateUrl({ priority: next.length > 0 ? next.join(',') : undefined });
    },
    [priority, setPriority, updateUrl],
  );

  const handleAssigneeChange = useCallback(
    (value: string) => {
      const next = value || undefined;
      setAssigneeId(next);
      updateUrl({ assignee: next });
    },
    [setAssigneeId, updateUrl],
  );

  const handleKeywordChange = useCallback(
    (value: string) => {
      setLocalKeyword(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        setKeyword(value);
        updateUrl({ keyword: value || undefined });
      }, keywordDebounceMs);
    },
    [setKeyword, updateUrl, keywordDebounceMs],
  );

  const handleKeywordSubmit = useCallback(
    (value: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      setKeyword(value);
      updateUrl({ keyword: value || undefined });
    },
    [setKeyword, updateUrl],
  );

  return {
    status,
    priority,
    assigneeId,
    keyword,
    localKeyword,
    handleStatusChange,
    handlePriorityChange,
    handleAssigneeChange,
    handleKeywordChange,
    handleKeywordSubmit,
  };
}
