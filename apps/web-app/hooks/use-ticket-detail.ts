'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { TicketDetail, TicketComment, TicketStatus, TicketPriority } from '@team-portal/types';
import {
  fetchTicketDetail,
  fetchTicketComments,
  createComment,
  transitionTicketStatus,
  changeTicketPriority,
  assignTicketToUser,
  fetchUsers,
} from '../lib/api-client';
import { ticketKeys } from '../lib/query-keys';
import {
  updateTicketStatusInCaches,
  updateTicketPriorityInCaches,
  updateTicketAssigneeInCaches,
} from '../lib/query-cache-utils';

export function useTicketDetail(id: string, initialData?: TicketDetail) {
  return useQuery<TicketDetail | null>({
    queryKey: ['tickets', 'detail', id],
    queryFn: () => fetchTicketDetail(id),
    initialData: initialData ?? undefined,
    staleTime: initialData ? 30_000 : 0,
  });
}

export function useTicketComments(ticketId: string) {
  return useQuery<TicketComment[]>({
    queryKey: ['tickets', 'comments', ticketId],
    queryFn: () => fetchTicketComments(ticketId),
    staleTime: 10_000,
  });
}

export function useAddComment(ticketId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => createComment(ticketId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['tickets', 'comments', ticketId],
      });
      queryClient.invalidateQueries({
        queryKey: ['tickets', 'detail', ticketId],
      });
    },
  });
}

export function useTransitionStatus(ticketId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (status: TicketStatus) => transitionTicketStatus(ticketId, status),
    onSuccess: (_data, status) => {
      // Precisely update the detail cache
      queryClient.setQueryData(
        ticketKeys.detail(ticketId),
        (old: TicketDetail | null | undefined) =>
          old ? { ...old, status, updatedAt: new Date().toISOString() } : old,
      );
      // Precisely update all list caches (instant cross-page sync)
      updateTicketStatusInCaches(queryClient, ticketId, status);
      // Invalidate comments/timeline so they refetch
      queryClient.invalidateQueries({
        queryKey: ['tickets', 'comments', ticketId],
      });
    },
  });
}

export function useChangePriority(ticketId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (priority: TicketPriority) => changeTicketPriority(ticketId, priority),
    onSuccess: (_data, priority) => {
      queryClient.setQueryData(
        ticketKeys.detail(ticketId),
        (old: TicketDetail | null | undefined) =>
          old ? { ...old, priority, updatedAt: new Date().toISOString() } : old,
      );
      updateTicketPriorityInCaches(queryClient, ticketId, priority);
      queryClient.invalidateQueries({
        queryKey: ['tickets', 'comments', ticketId],
      });
    },
  });
}

export function useAssignTicket(ticketId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (assigneeId: string) => assignTicketToUser(ticketId, assigneeId),
    onSuccess: async (_data, assigneeId) => {
      // Fetch the assignee user to get full user object
      const users = await fetchUsers();
      const assignee = users.find((u) => u.id === assigneeId) ?? null;
      queryClient.setQueryData(
        ticketKeys.detail(ticketId),
        (old: TicketDetail | null | undefined) =>
          old ? { ...old, assigneeId, assignee, updatedAt: new Date().toISOString() } : old,
      );
      updateTicketAssigneeInCaches(queryClient, ticketId, assignee);
      queryClient.invalidateQueries({
        queryKey: ['tickets', 'comments', ticketId],
      });
    },
  });
}
