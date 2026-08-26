import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider, type InfiniteData } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import {
  useTicketsInfiniteQuery,
  useUsers,
  useBatchAssignTickets,
  useBatchCloseTickets,
  flattenPages,
  type TicketQueryFilters,
} from './use-tickets';
import type { PaginatedResult, TicketWithRelations, User } from '@team-portal/types';
import { ticketKeys } from '../lib/query-keys';

vi.mock('../lib/api-client', () => ({
  fetchTickets: vi.fn(),
  fetchUsers: vi.fn(),
  batchAssignTickets: vi.fn(),
  batchCloseTickets: vi.fn(),
}));

import { fetchTickets, fetchUsers, batchAssignTickets, batchCloseTickets } from '../lib/api-client';
import { PAGE_SIZE } from '../stores/ticket-store';

function makeTicket(id: string): TicketWithRelations {
  return {
    id,
    subject: `T ${id}`,
    title: `T ${id}`,
    description: '',
    status: 'open',
    priority: 'medium',
    customer: { id: 'c1', name: 'C', company: 'Co', email: 'c@x.com' },
    assigneeId: null,
    assignee: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as unknown as TicketWithRelations;
}

function makePage(
  items: TicketWithRelations[],
  page = 1,
  hasMore = false,
): PaginatedResult<TicketWithRelations> {
  return { items, total: items.length, page, pageSize: PAGE_SIZE, hasMore };
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return {
    queryClient,
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  };
}

describe('flattenPages', () => {
  it('returns an empty array for undefined data', () => {
    expect(flattenPages(undefined)).toEqual([]);
  });

  it('flattens all pages into a single array', () => {
    const data = {
      pages: [makePage([makeTicket('a'), makeTicket('b')]), makePage([makeTicket('c')])],
      pageParams: [1, 2],
    };
    expect(flattenPages(data).map((t) => t.id)).toEqual(['a', 'b', 'c']);
  });
});

describe('useTicketsInfiniteQuery', () => {
  beforeEach(() => vi.clearAllMocks());

  it('fetches the first page using buildQueryKey', async () => {
    vi.mocked(fetchTickets).mockResolvedValue(makePage([makeTicket('t1')]));
    const { wrapper } = createWrapper();
    const filters: TicketQueryFilters = { status: ['open'], keyword: 'login' };

    const { result } = renderHook(() => useTicketsInfiniteQuery(filters), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(fetchTickets).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 1,
        pageSize: PAGE_SIZE,
        keyword: 'login',
      }),
    );
    expect(flattenPages(result.current.data)).toHaveLength(1);
  });

  it('passes sort params through to fetchTickets', async () => {
    vi.mocked(fetchTickets).mockResolvedValue(makePage([makeTicket('t1')]));
    const { wrapper } = createWrapper();
    const filters: TicketQueryFilters = {
      sortField: 'priority',
      sortDirection: 'desc',
    };

    const { result } = renderHook(() => useTicketsInfiniteQuery(filters), {
      wrapper,
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(fetchTickets).toHaveBeenCalledWith(
      expect.objectContaining({
        sort: { field: 'priority', direction: 'desc' },
      }),
    );
  });

  it('omits sort when sortField or sortDirection is missing', async () => {
    vi.mocked(fetchTickets).mockResolvedValue(makePage([makeTicket('t1')]));
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useTicketsInfiniteQuery({ sortField: 'priority' }), {
      wrapper,
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(fetchTickets).toHaveBeenCalledWith(expect.objectContaining({ sort: undefined }));
  });

  it('uses hasMore to compute hasNextPage', async () => {
    vi.mocked(fetchTickets).mockResolvedValue(makePage([makeTicket('t1')], 3, true));
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useTicketsInfiniteQuery({}), {
      wrapper,
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.hasNextPage).toBe(true);
  });

  it('returns hasNextPage=false when the last page has no more items', async () => {
    vi.mocked(fetchTickets).mockResolvedValue(makePage([makeTicket('t1')], 1, false));
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useTicketsInfiniteQuery({}), {
      wrapper,
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.hasNextPage).toBe(false);
  });

  it('accepts initialData without immediately refetching', () => {
    const initialData: InfiniteData<PaginatedResult<TicketWithRelations>> = {
      pages: [makePage([makeTicket('seed')])],
      pageParams: [1],
    };
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useTicketsInfiniteQuery({}, initialData), { wrapper });
    expect(fetchTickets).not.toHaveBeenCalled();
    expect(flattenPages(result.current.data)).toHaveLength(1);
  });
});

describe('useUsers', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns users via the cached list query', async () => {
    const users: User[] = [{ id: 'u1', name: 'A' }];
    vi.mocked(fetchUsers).mockResolvedValue(users);
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useUsers(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(users);
  });
});

describe('useBatchAssignTickets', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls batchAssignTickets and updates list caches with the assignee', async () => {
    const assignee: User = {
      id: 'u1',
      name: 'Alex',
    };
    vi.mocked(batchAssignTickets).mockResolvedValue(undefined);
    vi.mocked(fetchUsers).mockResolvedValue([assignee]);

    const { wrapper, queryClient } = createWrapper();
    queryClient.setQueryData(ticketKeys.list({}), {
      pages: [makePage([makeTicket('t1')])],
      pageParams: [1],
    });

    const { result } = renderHook(() => useBatchAssignTickets(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ ticketIds: ['t1'], assigneeId: 'u1' });
    });

    expect(batchAssignTickets).toHaveBeenCalledWith(['t1'], 'u1');
    const cached = queryClient.getQueryData<{
      pages: { items: TicketWithRelations[] }[];
    }>(ticketKeys.list({}));
    expect(cached?.pages[0]?.items[0]?.assigneeId).toBe('u1');
  });
});

describe('useBatchCloseTickets', () => {
  beforeEach(() => vi.clearAllMocks());

  it('updates the status of all listed tickets to closed', async () => {
    vi.mocked(batchCloseTickets).mockResolvedValue(undefined);
    const { wrapper, queryClient } = createWrapper();
    queryClient.setQueryData(ticketKeys.list({}), {
      pages: [makePage([makeTicket('t1'), makeTicket('t2')])],
      pageParams: [1],
    });

    const { result } = renderHook(() => useBatchCloseTickets(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync(['t1', 't2']);
    });

    expect(batchCloseTickets).toHaveBeenCalledWith(['t1', 't2']);
    const cached = queryClient.getQueryData<
      InfiniteData<{
        items: TicketWithRelations[];
      }>
    >(ticketKeys.list({}));
    for (const item of cached?.pages[0]?.items ?? []) {
      expect(item.status).toBe('closed');
    }
  });
});
