import type { QueryClient } from '@tanstack/react-query';
import type { TicketWithRelations, TicketStatus, TicketPriority, User } from '@team-portal/types';
import { ticketKeys } from './query-keys';

interface TicketListPage {
  items: TicketWithRelations[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

interface InfiniteTicketCache {
  pages: TicketListPage[];
  pageParams: number[];
}

/**
 * Update a single ticket across ALL cached ticket list queries.
 *
 * This enables instant cross-page sync: when a ticket's status/priority/assignee
 * changes on the detail page, the list cache is updated immediately so that
 * returning to the list shows fresh data without a refetch or loading spinner.
 */
export function updateTicketInListCaches(
  queryClient: QueryClient,
  ticketId: string,
  updater: (ticket: TicketWithRelations) => TicketWithRelations,
): void {
  const queries = queryClient.getQueriesData<InfiniteTicketCache>({
    queryKey: ticketKeys.lists(),
  });

  for (const [queryKey, data] of queries) {
    if (!data) continue;
    let changed = false;
    const newPages = data.pages.map((page) => {
      const newItems = page.items.map((item) => {
        if (item.id === ticketId) {
          changed = true;
          return updater(item);
        }
        return item;
      });
      return changed ? { ...page, items: newItems } : page;
    });
    if (changed) {
      queryClient.setQueryData(queryKey, { ...data, pages: newPages });
    }
  }
}

/**
 * Update ticket status in all list caches.
 */
export function updateTicketStatusInCaches(
  queryClient: QueryClient,
  ticketId: string,
  status: TicketStatus,
): void {
  updateTicketInListCaches(queryClient, ticketId, (ticket) => ({
    ...ticket,
    status,
    updatedAt: new Date().toISOString(),
  }));
}

/**
 * Update ticket priority in all list caches.
 */
export function updateTicketPriorityInCaches(
  queryClient: QueryClient,
  ticketId: string,
  priority: TicketPriority,
): void {
  updateTicketInListCaches(queryClient, ticketId, (ticket) => ({
    ...ticket,
    priority,
    updatedAt: new Date().toISOString(),
  }));
}

/**
 * Update ticket assignee in all list caches.
 */
export function updateTicketAssigneeInCaches(
  queryClient: QueryClient,
  ticketId: string,
  assignee: User | null,
): void {
  updateTicketInListCaches(queryClient, ticketId, (ticket) => ({
    ...ticket,
    assigneeId: assignee?.id ?? null,
    assignee,
    updatedAt: new Date().toISOString(),
  }));
}
