import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { TicketStatus, TicketPriority } from '@team-portal/types';
import { useTicketFilters } from './use-ticket-filters';
import { useTicketStore } from '../stores/ticket-store';
import type { TicketFiltersSearchParams } from './use-ticket-filters';

function makeSearchParams(init: Record<string, string> = {}): TicketFiltersSearchParams {
  const store = new Map(Object.entries(init));
  return {
    get: (name: string) => store.get(name) ?? null,
  };
}

function resetStore(): void {
  useTicketStore.setState({
    status: [],
    priority: [],
    assigneeId: undefined,
    keyword: '',
    date: undefined,
    sort: { field: 'createdAt', direction: 'desc' },
    selectedIds: [],
    scrollPosition: 0,
  });
}

describe('useTicketFilters', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    resetStore();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('hydrates filters from URL search params on mount', () => {
    const searchParams = makeSearchParams({
      status: 'pending,in_progress',
      priority: 'urgent',
      assignee: 'u-1',
      keyword: 'login',
    });
    const updateUrl = vi.fn();

    renderHook(() => useTicketFilters({ searchParams, updateUrl, keywordDebounceMs: 300 }));

    const state = useTicketStore.getState();
    expect(state.status).toEqual(['pending', 'in_progress']);
    expect(state.priority).toEqual(['urgent' as TicketPriority]);
    expect(state.assigneeId).toBe('u-1');
    expect(state.keyword).toBe('login');
  });

  it('toggles a status filter and syncs to the URL', () => {
    const updateUrl = vi.fn();
    const { result } = renderHook(() =>
      useTicketFilters({
        searchParams: makeSearchParams(),
        updateUrl,
      }),
    );

    act(() => {
      result.current.handleStatusChange('pending' as TicketStatus);
    });
    expect(useTicketStore.getState().status).toEqual(['pending']);
    expect(updateUrl).toHaveBeenCalledWith({ status: 'pending' });

    act(() => {
      result.current.handleStatusChange('pending' as TicketStatus);
    });
    expect(useTicketStore.getState().status).toEqual([]);
    expect(updateUrl).toHaveBeenLastCalledWith({ status: undefined });
  });

  it('toggles a priority filter and syncs to the URL', () => {
    const updateUrl = vi.fn();
    const { result } = renderHook(() =>
      useTicketFilters({
        searchParams: makeSearchParams(),
        updateUrl,
      }),
    );

    act(() => {
      result.current.handlePriorityChange('high' as TicketPriority);
    });
    expect(useTicketStore.getState().priority).toEqual(['high']);
    expect(updateUrl).toHaveBeenCalledWith({ priority: 'high' });
  });

  it('sets and clears the assignee filter (empty string → undefined)', () => {
    const updateUrl = vi.fn();
    const { result } = renderHook(() =>
      useTicketFilters({
        searchParams: makeSearchParams(),
        updateUrl,
      }),
    );

    act(() => {
      result.current.handleAssigneeChange('u-9');
    });
    expect(useTicketStore.getState().assigneeId).toBe('u-9');
    expect(updateUrl).toHaveBeenCalledWith({ assignee: 'u-9' });

    act(() => {
      result.current.handleAssigneeChange('');
    });
    expect(useTicketStore.getState().assigneeId).toBeUndefined();
    expect(updateUrl).toHaveBeenLastCalledWith({ assignee: undefined });
  });

  it('debounces keyword changes and syncs after the delay', () => {
    const updateUrl = vi.fn();
    const { result } = renderHook(() =>
      useTicketFilters({
        searchParams: makeSearchParams(),
        updateUrl,
        keywordDebounceMs: 300,
      }),
    );

    act(() => {
      result.current.handleKeywordChange('a');
    });
    act(() => {
      result.current.handleKeywordChange('ab');
    });

    // Before the debounce window elapses, no keyword is committed.
    vi.advanceTimersByTime(299);
    expect(useTicketStore.getState().keyword).toBe('');
    expect(updateUrl).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(useTicketStore.getState().keyword).toBe('ab');
    expect(updateUrl).toHaveBeenCalledWith({ keyword: 'ab' });
  });

  it('submits the keyword immediately (Enter) by clearing the debounce', () => {
    const updateUrl = vi.fn();
    const { result } = renderHook(() =>
      useTicketFilters({
        searchParams: makeSearchParams(),
        updateUrl,
        keywordDebounceMs: 300,
      }),
    );

    act(() => {
      result.current.handleKeywordChange('search-term');
    });
    act(() => {
      result.current.handleKeywordSubmit('search-term');
    });

    expect(useTicketStore.getState().keyword).toBe('search-term');
    expect(updateUrl).toHaveBeenCalledWith({ keyword: 'search-term' });

    // The pending debounced call must not fire later.
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    const keywordCalls = updateUrl.mock.calls.filter((c) => {
      const [updates] = c as [Record<string, string | undefined> | undefined];
      return updates?.keyword !== undefined;
    });
    expect(keywordCalls).toHaveLength(1);
  });

  it('updates localKeyword as the user types without committing immediately', () => {
    const { result } = renderHook(() =>
      useTicketFilters({
        searchParams: makeSearchParams(),
        updateUrl: vi.fn(),
      }),
    );

    act(() => {
      result.current.handleKeywordChange('typed');
    });

    expect(result.current.localKeyword).toBe('typed');
    expect(useTicketStore.getState().keyword).toBe('');
  });
});
