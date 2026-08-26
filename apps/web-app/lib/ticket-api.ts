import type {
  TicketWithRelations,
  TicketListParams,
  PaginatedResult,
  TicketPriority,
  TicketStatus,
  User,
  TicketDetail,
  TicketComment,
} from '@team-portal/types';
import {
  ALL_TICKETS,
  ALL_USERS,
  getTicketDetail,
  getTicketComments,
  addTicketComment,
  updateTicketStatus,
  updateTicketPriority,
  assignTicket,
} from './mock-data';

const PRIORITY_ORDER: Record<TicketPriority, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
};

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function applyFilters(
  tickets: TicketWithRelations[],
  params: TicketListParams,
): TicketWithRelations[] {
  let result = [...tickets];

  if (params.status && params.status.length > 0) {
    result = result.filter((t) => params.status!.includes(t.status));
  }

  if (params.priority && params.priority.length > 0) {
    result = result.filter((t) => params.priority!.includes(t.priority));
  }

  if (params.assigneeId) {
    result = result.filter((t) => t.assigneeId === params.assigneeId);
  }

  if (params.keyword && params.keyword.trim()) {
    const kw = params.keyword.trim().toLowerCase();
    result = result.filter(
      (t) =>
        t.title.toLowerCase().includes(kw) ||
        t.customer.name.toLowerCase().includes(kw) ||
        t.customer.company.toLowerCase().includes(kw),
    );
  }

  if (params.date) {
    result = result.filter((t) => {
      const created = new Date(t.createdAt);
      const dateStr =
        `${created.getFullYear()}-` +
        `${String(created.getMonth() + 1).padStart(2, '0')}-` +
        `${String(created.getDate()).padStart(2, '0')}`;
      return dateStr === params.date;
    });
  }

  if (params.sort) {
    const { field, direction } = params.sort;
    const dir = direction === 'asc' ? 1 : -1;
    result.sort((a, b) => {
      if (field === 'createdAt') {
        return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * dir;
      }
      if (field === 'priority') {
        return (PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]) * dir;
      }
      return 0;
    });
  }

  return result;
}

export async function fetchTickets(
  params: TicketListParams,
): Promise<PaginatedResult<TicketWithRelations>> {
  await delay(300);

  const filtered = applyFilters(ALL_TICKETS, params);
  const start = (params.page - 1) * params.pageSize;
  const items = filtered.slice(start, start + params.pageSize);

  return {
    items,
    total: filtered.length,
    page: params.page,
    pageSize: params.pageSize,
    hasMore: start + params.pageSize < filtered.length,
  };
}

export async function fetchTicketDetail(id: string): Promise<TicketDetail | null> {
  await delay(200);
  const ticket = ALL_TICKETS.find((t) => t.id === id);
  if (!ticket) return null;
  return getTicketDetail(ticket);
}

export async function fetchTicketComments(ticketId: string): Promise<TicketComment[]> {
  await delay(150);
  return getTicketComments(ticketId);
}

export async function createComment(ticketId: string, content: string): Promise<TicketComment> {
  await delay(300);
  // In a real app, the current user would come from auth context
  const author = ALL_USERS[0]!;
  return addTicketComment(ticketId, author, content);
}

export async function transitionTicketStatus(
  ticketId: string,
  status: TicketStatus,
): Promise<void> {
  await delay(300);
  const operator = ALL_USERS[0]!;
  updateTicketStatus(ticketId, status, operator);
}

export async function changeTicketPriority(
  ticketId: string,
  priority: TicketPriority,
): Promise<void> {
  await delay(300);
  const operator = ALL_USERS[0]!;
  updateTicketPriority(ticketId, priority, operator);
}

export async function assignTicketToUser(ticketId: string, assigneeId: string): Promise<void> {
  await delay(300);
  const operator = ALL_USERS[0]!;
  const assignee = ALL_USERS.find((u) => u.id === assigneeId);
  if (!assignee) throw new Error('用户不存在');
  assignTicket(ticketId, assignee, operator);
}

export async function fetchUsers(): Promise<User[]> {
  await delay(100);
  return ALL_USERS;
}

export async function batchAssignTickets(ticketIds: string[], assigneeId: string): Promise<void> {
  await delay(400);
  for (const ticket of ALL_TICKETS) {
    if (ticketIds.includes(ticket.id)) {
      ticket.assigneeId = assigneeId;
      ticket.assignee = ALL_USERS.find((u) => u.id === assigneeId) ?? null;
      ticket.updatedAt = new Date().toISOString();
    }
  }
}

export async function batchCloseTickets(ticketIds: string[]): Promise<void> {
  await delay(400);
  for (const ticket of ALL_TICKETS) {
    if (ticketIds.includes(ticket.id)) {
      ticket.status = 'closed';
      ticket.updatedAt = new Date().toISOString();
    }
  }
}
