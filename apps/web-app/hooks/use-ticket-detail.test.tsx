import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import {
  useTicketDetail,
  useTicketComments,
  useAddComment,
  useTransitionStatus,
  useChangePriority,
  useAssignTicket,
} from './use-ticket-detail';
import type {
  TicketDetail,
  TicketComment,
  TicketStatus,
  TicketPriority,
  User,
} from '@team-portal/types';
import { ticketKeys } from '../lib/query-keys';

vi.mock('../lib/ticket-api', () => ({
  fetchTicketDetail: vi.fn(),
  fetchTicketComments: vi.fn(),
  createComment: vi.fn(),
  transitionTicketStatus: vi.fn(),
  changeTicketPriority: vi.fn(),
  assignTicketToUser: vi.fn(),
  fetchUsers: vi.fn(),
}));

import {
  fetchTicketDetail,
  fetchTicketComments,
  createComment,
  transitionTicketStatus,
  changeTicketPriority,
  assignTicketToUser,
  fetchUsers,
} from '../lib/ticket-api';

function makeDetail(id: string, overrides: Partial<TicketDetail> = {}): TicketDetail {
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
    comments: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  } as unknown as TicketDetail;
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

describe('useTicketDetail', () => {
  beforeEach(() => vi.clearAllMocks());

  it('fetches the ticket by id', async () => {
    vi.mocked(fetchTicketDetail).mockResolvedValue(makeDetail('t1'));
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useTicketDetail('t1'), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(fetchTicketDetail).toHaveBeenCalledWith('t1');
    expect(result.current.data?.id).toBe('t1');
  });

  it('accepts initial data without fetching', () => {
    const initial = makeDetail('t1');
    const { wrapper, queryClient } = createWrapper();
    renderHook(() => useTicketDetail('t1', initial), { wrapper });
    expect(fetchTicketDetail).not.toHaveBeenCalled();
    expect(queryClient.getQueryData<TicketDetail>(ticketKeys.detail('t1'))).toEqual(initial);
  });
});

describe('useTicketComments', () => {
  beforeEach(() => vi.clearAllMocks());

  it('fetches comments for a ticket', async () => {
    const comments: TicketComment[] = [
      {
        id: 'cm1',
        ticketId: 't1',
        author: { id: 'u1', name: 'A' } as User,
        content: 'hi',
        createdAt: '',
      } as TicketComment,
    ];
    vi.mocked(fetchTicketComments).mockResolvedValue(comments);
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useTicketComments('t1'), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
  });
});

describe('useAddComment', () => {
  beforeEach(() => vi.clearAllMocks());

  it('creates a comment and invalidates comments and detail queries', async () => {
    vi.mocked(createComment).mockResolvedValue({} as TicketComment);
    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useAddComment('t1'), { wrapper });
    await act(async () => {
      await result.current.mutateAsync('new comment');
    });

    expect(createComment).toHaveBeenCalledWith('t1', 'new comment');
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['tickets', 'comments', 't1'],
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['tickets', 'detail', 't1'],
    });
  });
});

describe('useTransitionStatus', () => {
  beforeEach(() => vi.clearAllMocks());

  it('transitions status and updates the detail cache', async () => {
    vi.mocked(transitionTicketStatus).mockResolvedValue(undefined);
    const { wrapper, queryClient } = createWrapper();
    queryClient.setQueryData(ticketKeys.detail('t1'), makeDetail('t1'));

    const { result } = renderHook(() => useTransitionStatus('t1'), { wrapper });
    await act(async () => {
      await result.current.mutateAsync('pending' as TicketStatus);
    });

    expect(transitionTicketStatus).toHaveBeenCalledWith('t1', 'pending');
    const cached = queryClient.getQueryData<TicketDetail>(ticketKeys.detail('t1'));
    expect(cached?.status).toBe('pending');
  });

  it('does not throw when the detail cache is empty (null updater branch)', async () => {
    vi.mocked(transitionTicketStatus).mockResolvedValue(undefined);
    const { wrapper, queryClient } = createWrapper();
    // No detail cache set — updater receives undefined and must return it.
    expect(queryClient.getQueryData(ticketKeys.detail('t1'))).toBeUndefined();

    const { result } = renderHook(() => useTransitionStatus('t1'), { wrapper });
    await act(async () => {
      await result.current.mutateAsync('closed' as TicketStatus);
    });
    // No exception; list cache invalidation still happened.
    expect(transitionTicketStatus).toHaveBeenCalledWith('t1', 'closed');
  });
});

describe('useChangePriority', () => {
  beforeEach(() => vi.clearAllMocks());

  it('updates priority in the detail cache', async () => {
    vi.mocked(changeTicketPriority).mockResolvedValue(undefined);
    const { wrapper, queryClient } = createWrapper();
    queryClient.setQueryData(ticketKeys.detail('t1'), makeDetail('t1'));

    const { result } = renderHook(() => useChangePriority('t1'), { wrapper });
    await act(async () => {
      await result.current.mutateAsync('urgent' as TicketPriority);
    });

    const cached = queryClient.getQueryData<TicketDetail>(ticketKeys.detail('t1'));
    expect(cached?.priority).toBe('urgent');
  });

  it('tolerates an empty detail cache (null updater branch)', async () => {
    vi.mocked(changeTicketPriority).mockResolvedValue(undefined);
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useChangePriority('t1'), { wrapper });
    await act(async () => {
      await result.current.mutateAsync('low' as TicketPriority);
    });
    expect(changeTicketPriority).toHaveBeenCalledWith('t1', 'low');
  });
});

describe('useAssignTicket', () => {
  beforeEach(() => vi.clearAllMocks());

  it('looks up the assignee and updates the detail cache', async () => {
    const assignee: User = {
      id: 'u1',
      name: 'Alex',
    };
    vi.mocked(assignTicketToUser).mockResolvedValue(undefined);
    vi.mocked(fetchUsers).mockResolvedValue([assignee]);
    const { wrapper, queryClient } = createWrapper();
    queryClient.setQueryData(ticketKeys.detail('t1'), makeDetail('t1'));

    const { result } = renderHook(() => useAssignTicket('t1'), { wrapper });
    await act(async () => {
      await result.current.mutateAsync('u1');
    });

    expect(assignTicketToUser).toHaveBeenCalledWith('t1', 'u1');
    const cached = queryClient.getQueryData<TicketDetail>(ticketKeys.detail('t1'));
    expect(cached?.assigneeId).toBe('u1');
    expect(cached?.assignee).toEqual(assignee);
  });

  it('sets assignee to null in caches when the user is not found', async () => {
    vi.mocked(assignTicketToUser).mockResolvedValue(undefined);
    vi.mocked(fetchUsers).mockResolvedValue([]);
    const { wrapper, queryClient } = createWrapper();
    queryClient.setQueryData(
      ticketKeys.detail('t1'),
      makeDetail('t1', { assigneeId: 'previous', assignee: null }),
    );

    const { result } = renderHook(() => useAssignTicket('t1'), { wrapper });
    await act(async () => {
      await result.current.mutateAsync('unknown-user');
    });

    // The API call still happens; the cache updater resolves the user to null.
    const cached = queryClient.getQueryData<TicketDetail>(ticketKeys.detail('t1'));
    expect(cached?.assignee).toBeNull();
  });
});
