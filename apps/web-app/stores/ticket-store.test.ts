import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useTicketStore, PAGE_SIZE, type SortField } from './ticket-store';

const PERSIST_KEY = 'team-portal-ticket';

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
  window.localStorage.removeItem(PERSIST_KEY);
}

describe('ticket-store', () => {
  beforeEach(() => {
    resetStore();
  });

  it('exports the expected page size constant', () => {
    expect(PAGE_SIZE).toBe(20);
  });

  it('has the expected default filter/selection state', () => {
    const s = useTicketStore.getState();
    expect(s.status).toEqual([]);
    expect(s.priority).toEqual([]);
    expect(s.assigneeId).toBeUndefined();
    expect(s.keyword).toBe('');
    expect(s.date).toBeUndefined();
    expect(s.sort).toEqual({ field: 'createdAt', direction: 'desc' });
    expect(s.selectedIds).toEqual([]);
    expect(s.scrollPosition).toBe(0);
  });

  it('updates each filter field', () => {
    useTicketStore.getState().setStatus(['pending', 'in_progress']);
    expect(useTicketStore.getState().status).toEqual(['pending', 'in_progress']);

    useTicketStore.getState().setPriority(['urgent']);
    expect(useTicketStore.getState().priority).toEqual(['urgent']);

    useTicketStore.getState().setAssigneeId('u-1');
    expect(useTicketStore.getState().assigneeId).toBe('u-1');

    useTicketStore.getState().setKeyword('login');
    expect(useTicketStore.getState().keyword).toBe('login');

    useTicketStore.getState().setDate('2026-01-01');
    expect(useTicketStore.getState().date).toBe('2026-01-01');
  });

  it('cycles sort direction via toggleSort (new field → asc, same asc → desc, same desc → asc)', () => {
    useTicketStore.getState().toggleSort('priority' as SortField);
    expect(useTicketStore.getState().sort).toEqual({
      field: 'priority',
      direction: 'asc',
    });

    useTicketStore.getState().toggleSort('priority' as SortField);
    expect(useTicketStore.getState().sort.direction).toBe('desc');

    useTicketStore.getState().toggleSort('priority' as SortField);
    expect(useTicketStore.getState().sort.direction).toBe('asc');
  });

  it('resets all filters back to defaults without touching selection/scroll', () => {
    useTicketStore.getState().setStatus(['closed']);
    useTicketStore.getState().setPriority(['low']);
    useTicketStore.getState().setAssigneeId('u-9');
    useTicketStore.getState().setKeyword('x');
    useTicketStore.getState().setDate('2026-05-05');
    useTicketStore.getState().selectAll(['a', 'b']);
    useTicketStore.getState().setScrollPosition(123);

    useTicketStore.getState().resetFilters();

    const s = useTicketStore.getState();
    expect(s.status).toEqual([]);
    expect(s.priority).toEqual([]);
    expect(s.assigneeId).toBeUndefined();
    expect(s.keyword).toBe('');
    expect(s.date).toBeUndefined();
    expect(s.sort).toEqual({ field: 'createdAt', direction: 'desc' });
    // Session-only state is preserved.
    expect(s.selectedIds).toEqual(['a', 'b']);
    expect(s.scrollPosition).toBe(123);
  });

  it('selects all, toggles individual selection, and clears selection', () => {
    useTicketStore.getState().selectAll(['t1', 't2', 't3']);
    expect(useTicketStore.getState().selectedIds).toEqual(['t1', 't2', 't3']);

    useTicketStore.getState().toggleSelection('t2');
    expect(useTicketStore.getState().selectedIds).toEqual(['t1', 't3']);

    useTicketStore.getState().toggleSelection('t2');
    expect(useTicketStore.getState().selectedIds).toEqual(['t1', 't3', 't2']);

    useTicketStore.getState().clearSelection();
    expect(useTicketStore.getState().selectedIds).toEqual([]);
  });

  it('persists filters/sort but NOT selection or scroll position', () => {
    useTicketStore.getState().setStatus(['resolved']);
    useTicketStore.getState().setKeyword('bug');
    useTicketStore.getState().selectAll(['x']);
    useTicketStore.getState().setScrollPosition(999);

    const raw = window.localStorage.getItem(PERSIST_KEY);
    expect(raw).not.toBeNull();
    const persisted = JSON.parse(raw as string) as {
      state: Record<string, unknown>;
    };

    expect(persisted.state.status).toEqual(['resolved']);
    expect(persisted.state.keyword).toBe('bug');
    expect(persisted.state.sort).toBeDefined();
    expect(persisted.state.selectedIds).toBeUndefined();
    expect(persisted.state.scrollPosition).toBeUndefined();
  });

  it('rehydrates persisted filters from localStorage', async () => {
    window.localStorage.setItem(
      PERSIST_KEY,
      JSON.stringify({
        state: {
          status: ['closed'],
          priority: ['high'],
          assigneeId: 'u-42',
          keyword: 'crash',
          date: '2026-03-03',
          sort: { field: 'priority', direction: 'asc' },
        },
        version: 0,
      }),
    );

    vi.resetModules();
    const rehydrated = await import('./ticket-store');
    await Promise.resolve();

    const s = rehydrated.useTicketStore.getState();
    expect(s.status).toEqual(['closed']);
    expect(s.priority).toEqual(['high']);
    expect(s.assigneeId).toBe('u-42');
    expect(s.keyword).toBe('crash');
    expect(s.date).toBe('2026-03-03');
    expect(s.sort).toEqual({ field: 'priority', direction: 'asc' });
    // Non-persisted session state resets.
    expect(s.selectedIds).toEqual([]);
    expect(s.scrollPosition).toBe(0);
  });
});
