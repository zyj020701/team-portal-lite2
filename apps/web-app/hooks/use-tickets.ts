'use client';

import {
  useInfiniteQuery,
  useQuery,
  useMutation,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query';
import type {
  TicketWithRelations,
  PaginatedResult,
  User,
} from '@team-portal/types';
import {
  fetchTickets,
  fetchUsers,
  batchAssignTickets,
  batchCloseTickets,
} from '../lib/api-client';
import { ticketKeys } from '../lib/query-keys';
import { updateTicketStatusInCaches, updateTicketAssigneeInCaches } from '../lib/query-cache-utils';
import {
  buildTicketListParams,
  type TicketQueryFilters,
} from '../lib/ticket-filters';

export type { TicketQueryFilters };

function buildQueryKey(filters: TicketQueryFilters): readonly unknown[] {
  return ticketKeys.list(filters as Readonly<Record<string, unknown>>);
}

export function useTicketsInfiniteQuery(
  filters: TicketQueryFilters,
  initialData?: InfiniteData<PaginatedResult<TicketWithRelations>>,
) {
  return useInfiniteQuery({
    queryKey: buildQueryKey(filters),
    queryFn: ({ pageParam }) => {
      const params = buildTicketListParams(pageParam as number, filters);
      return fetchTickets(params);
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.page + 1 : undefined),
    initialData: initialData ? () => initialData : undefined,
    staleTime: initialData ? 30_000 : 0,
  });
}

export function useUsers(): ReturnType<typeof useQuery<User[]>> {
  return useQuery<User[]>({
    queryKey: ['users', 'list'],
    queryFn: fetchUsers,
    staleTime: 5 * 60 * 1000,
  });
}

export function useBatchAssignTickets() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ticketIds, assigneeId }: { ticketIds: string[]; assigneeId: string }) =>
      batchAssignTickets(ticketIds, assigneeId),
    onSuccess: async (_data, { ticketIds, assigneeId }) => {
      const users = await fetchUsers();
      const assignee = users.find((u) => u.id === assigneeId) ?? null;
      for (const id of ticketIds) {
        updateTicketAssigneeInCaches(queryClient, id, assignee);
      }
    },
  });
}

export function useBatchCloseTickets() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ticketIds: string[]) => batchCloseTickets(ticketIds),
    onSuccess: (_data, ticketIds) => {
      for (const id of ticketIds) {
        updateTicketStatusInCaches(queryClient, id, 'closed');
      }
    },
  });
}

export function flattenPages(
  data: { pages: { items: TicketWithRelations[] }[] } | undefined,
): TicketWithRelations[] {
  if (!data) return [];
  return data.pages.flatMap((p) => p.items);
}
