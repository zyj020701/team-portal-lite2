/**
 * Ticket list filter helpers — shared between server (RSC prefetch / route
 * handlers) and client (TanStack Query hooks).
 *
 * This module is intentionally client-safe (no `server-only`, no Node APIs)
 * so that the exact same query keys / API params are produced on both sides,
 * which is required for SSR-prefetched data to hydrate the client cache.
 */
import type { TicketListParams, TicketPriority, TicketStatus } from '@team-portal/types';
import { ticketKeys } from './query-keys';

/** Number of tickets per page in the infinite list. */
export const PAGE_SIZE = 20;

/** Raw filter values derived from the URL (all optional, all JSON-ish). */
export interface TicketQueryFilters {
  status?: string[];
  priority?: string[];
  assigneeId?: string;
  keyword?: string;
  date?: string;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
}

/** Minimal structural type for URL search params (works with Next.js' own). */
export interface URLSearchParamsLike {
  get(name: string): string | null;
}

/**
 * Parse ticket filters from URL search params. Used by both the client
 * list component (`useSearchParams`) and the RSC page (`searchParams`).
 */
export function parseTicketFilters(sp: URLSearchParamsLike): TicketQueryFilters {
  const split = (v: string | null): string[] | undefined => {
    if (!v) return undefined;
    const arr = v.split(',').filter(Boolean);
    return arr.length > 0 ? arr : undefined;
  };
  return {
    status: split(sp.get('status')),
    priority: split(sp.get('priority')),
    assigneeId: sp.get('assignee') ?? undefined,
    keyword: sp.get('keyword') ?? '',
    date: sp.get('date') ?? undefined,
    sortField: sp.get('sortField') ?? undefined,
    sortDirection: (sp.get('sortDirection') as 'asc' | 'desc' | null) ?? undefined,
  };
}

/** Build the TanStack Query key for a given filter set (shared by SSR/client). */
export function ticketListQueryKey(filters: TicketQueryFilters): readonly unknown[] {
  return ticketKeys.list(filters as Readonly<Record<string, unknown>>);
}

/** Build the API request params for a given page + filters. */
export function buildTicketListParams(
  page: number,
  filters: TicketQueryFilters,
): TicketListParams {
  return {
    page,
    pageSize: PAGE_SIZE,
    status: filters.status as TicketListParams['status'],
    priority: filters.priority as TicketListParams['priority'],
    assigneeId: filters.assigneeId,
    keyword: filters.keyword,
    date: filters.date,
    sort:
      filters.sortField && filters.sortDirection
        ? {
            field: filters.sortField as 'createdAt' | 'priority',
            direction: filters.sortDirection,
          }
        : undefined,
  };
}

/** Serialize a filter set into a URL query string for the tickets API. */
export function buildTicketListQuery(page: number, filters: TicketQueryFilters): string {
  const sp = new URLSearchParams();
  sp.set('page', String(page));
  sp.set('pageSize', String(PAGE_SIZE));
  if (filters.status && filters.status.length > 0) sp.set('status', filters.status.join(','));
  if (filters.priority && filters.priority.length > 0)
    sp.set('priority', filters.priority.join(','));
  if (filters.assigneeId) sp.set('assignee', filters.assigneeId);
  if (filters.keyword && filters.keyword.trim()) sp.set('keyword', filters.keyword);
  if (filters.date) sp.set('date', filters.date);
  if (filters.sortField) sp.set('sortField', filters.sortField);
  if (filters.sortDirection) sp.set('sortDirection', filters.sortDirection);
  return sp.toString();
}

export type { TicketStatus, TicketPriority };
