import { afterEach, describe, expect, it } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import type { TicketWithRelations, TicketStatus, TicketPriority, User } from '@team-portal/types';
import {
  updateTicketInListCaches,
  updateTicketStatusInCaches,
  updateTicketPriorityInCaches,
  updateTicketAssigneeInCaches,
} from './query-cache-utils';
import { ticketKeys } from './query-keys';

function makeTicket(id: string, overrides: Partial<TicketWithRelations> = {}): TicketWithRelations {
  return {
    id,
    subject: `Ticket ${id}`,
    title: `Ticket ${id}`,
    description: '',
    status: 'open',
    priority: 'medium',
    customer: { id: 'c1', name: 'Customer', company: 'Acme', email: 'c@x.com' },
    assigneeId: null,
    assignee: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  } as unknown as TicketWithRelations;
}

describe('query-cache-utils', () => {
  let queryClient: QueryClient;

  afterEach(() => {
    queryClient?.clear();
  });

  function seedListCache(
    tickets: TicketWithRelations[],
    filters: Readonly<Record<string, unknown>> = {},
  ): void {
    queryClient.setQueryData(ticketKeys.list(filters), {
      pages: [
        {
          items: tickets,
          total: tickets.length,
          page: 1,
          pageSize: 20,
          hasMore: false,
        },
      ],
      pageParams: [1],
    });
  }

  it('updates a matching ticket across all list caches', () => {
    queryClient = new QueryClient();
    const t1 = makeTicket('t1');
    const t2 = makeTicket('t2');
    seedListCache([t1, t2]);

    updateTicketInListCaches(queryClient, 't1', (ticket) => ({
      ...ticket,
      status: 'resolved' as TicketStatus,
    }));

    const cached = queryClient.getQueryData<{
      pages: { items: TicketWithRelations[] }[];
    }>(ticketKeys.list({}));
    const updated = cached?.pages[0]?.items.find((t) => t.id === 't1');
    expect(updated?.status).toBe('resolved');
    const untouched = cached?.pages[0]?.items.find((t) => t.id === 't2');
    expect(untouched?.status).toBe('open');
  });

  it('is a no-op when the target ticket is not present in any cache', () => {
    queryClient = new QueryClient();
    const t1 = makeTicket('t1');
    seedListCache([t1]);
    const before = queryClient.getQueryData(ticketKeys.list({}));

    updateTicketInListCaches(queryClient, 'does-not-exist', (t) => ({
      ...t,
      status: 'resolved' as TicketStatus,
    }));

    expect(queryClient.getQueryData(ticketKeys.list({}))).toBe(before);
  });

  it('skips empty/undefined cache entries without throwing', () => {
    queryClient = new QueryClient();
    expect(() => updateTicketInListCaches(queryClient, 't1', (t) => t)).not.toThrow();
  });

  it('updates ticket status in every cached list query', () => {
    queryClient = new QueryClient();
    seedListCache([makeTicket('t1')], { status: ['open'] });
    seedListCache([makeTicket('t1')], { status: ['pending'] });

    updateTicketStatusInCaches(queryClient, 't1', 'closed');

    const all = queryClient.getQueriesData<{
      pages: { items: TicketWithRelations[] }[];
    }>({ queryKey: ticketKeys.lists() });
    expect(all.length).toBe(2);
    for (const [, data] of all) {
      expect(data?.pages[0]?.items[0]?.status).toBe('closed');
    }
  });

  it('updates ticket priority in caches and bumps updatedAt', () => {
    queryClient = new QueryClient();
    const original = makeTicket('t1', { updatedAt: '2020-01-01T00:00:00.000Z' });
    seedListCache([original]);

    updateTicketPriorityInCaches(queryClient, 't1', 'urgent' as TicketPriority);

    const cached = queryClient.getQueryData<{
      pages: { items: TicketWithRelations[] }[];
    }>(ticketKeys.list({}));
    const item = cached?.pages[0]?.items[0];
    expect(item?.priority).toBe('urgent');
    expect(item?.updatedAt).not.toBe('2020-01-01T00:00:00.000Z');
  });

  it('updates ticket assignee (and clears it when null)', () => {
    queryClient = new QueryClient();
    seedListCache([makeTicket('t1')]);

    const assignee: User = {
      id: 'u1',
      name: 'Alex',
    };
    updateTicketAssigneeInCaches(queryClient, 't1', assignee);

    let cached = queryClient.getQueryData<{
      pages: { items: TicketWithRelations[] }[];
    }>(ticketKeys.list({}));
    let item = cached?.pages[0]?.items[0];
    expect(item?.assigneeId).toBe('u1');
    expect(item?.assignee).toEqual(assignee);

    updateTicketAssigneeInCaches(queryClient, 't1', null);
    cached = queryClient.getQueryData(ticketKeys.list({}));
    item = cached?.pages[0]?.items[0];
    expect(item?.assigneeId).toBeNull();
    expect(item?.assignee).toBeNull();
  });
});
