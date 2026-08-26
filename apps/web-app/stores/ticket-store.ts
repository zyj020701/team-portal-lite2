'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { TicketStatus, TicketPriority } from '@team-portal/types';

/** Number of tickets per page in the infinite list. */
export const PAGE_SIZE = 20;

/** Sort direction. */
export type SortDirection = 'asc' | 'desc';

/** Sort field for ticket list. */
export type SortField = 'createdAt' | 'priority' | 'status';

/** Sort state. */
export interface SortState {
  field: SortField;
  direction: SortDirection;
}

/**
 * Ticket store — manages ticket list UI state (filters, sort, selection, scroll).
 *
 * Persisted fields (non-sensitive only):
 * - `status`, `priority`, `assigneeId`, `keyword`, `date`, `sort`
 *
 * Non-persisted (session-only):
 * - `selectedIds`, `scrollPosition`
 *
 * NOTE: Actual ticket data lives in TanStack Query, NOT here.
 */
export interface TicketState {
  // --- Filter state (persisted) ---
  /** Selected status filters. */
  status: TicketStatus[];
  /** Selected priority filters. */
  priority: TicketPriority[];
  /** Selected assignee ID filter. */
  assigneeId: string | undefined;
  /** Search keyword. */
  keyword: string;
  /** Date filter (YYYY-MM-DD). */
  date: string | undefined;
  /** Sort configuration. */
  sort: SortState;

  // --- Session-only state ---
  /** Selected ticket IDs for batch operations. */
  selectedIds: string[];
  /** Saved scroll position for return navigation. */
  scrollPosition: number;

  // --- Filter actions ---
  setStatus: (status: TicketStatus[]) => void;
  setPriority: (priority: TicketPriority[]) => void;
  setAssigneeId: (assigneeId: string | undefined) => void;
  setKeyword: (keyword: string) => void;
  setDate: (date: string | undefined) => void;
  setSort: (sort: SortState) => void;
  toggleSort: (field: SortField) => void;
  resetFilters: () => void;

  // --- Selection actions ---
  selectAll: (ids: string[]) => void;
  toggleSelection: (id: string) => void;
  clearSelection: () => void;

  // --- Scroll position ---
  setScrollPosition: (position: number) => void;
}

const DEFAULT_SORT: SortState = { field: 'createdAt', direction: 'desc' };

export const useTicketStore = create<TicketState>()(
  persist(
    (set) => ({
      status: [],
      priority: [],
      assigneeId: undefined,
      keyword: '',
      date: undefined,
      sort: DEFAULT_SORT,
      selectedIds: [],
      scrollPosition: 0,

      setStatus: (status) => set({ status }),
      setPriority: (priority) => set({ priority }),
      setAssigneeId: (assigneeId) => set({ assigneeId }),
      setKeyword: (keyword) => set({ keyword }),
      setDate: (date) => set({ date }),
      setSort: (sort) => set({ sort }),
      toggleSort: (field) =>
        set((state) => ({
          sort: {
            field,
            direction:
              state.sort.field === field && state.sort.direction === 'asc' ? 'desc' : 'asc',
          },
        })),
      resetFilters: () =>
        set({
          status: [],
          priority: [],
          assigneeId: undefined,
          keyword: '',
          date: undefined,
          sort: DEFAULT_SORT,
        }),

      selectAll: (ids) => set({ selectedIds: ids }),
      toggleSelection: (id) =>
        set((state) => ({
          selectedIds: state.selectedIds.includes(id)
            ? state.selectedIds.filter((sid) => sid !== id)
            : [...state.selectedIds, id],
        })),
      clearSelection: () => set({ selectedIds: [] }),

      setScrollPosition: (scrollPosition) => set({ scrollPosition }),
    }),
    {
      name: 'team-portal-ticket',
      // Only persist filter/sort preferences, NOT selection or scroll position
      partialize: (state) => ({
        status: state.status,
        priority: state.priority,
        assigneeId: state.assigneeId,
        keyword: state.keyword,
        date: state.date,
        sort: state.sort,
      }),
    },
  ),
);
