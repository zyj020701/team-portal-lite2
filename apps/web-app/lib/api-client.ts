/**
 * Client-side API layer.
 *
 * Browser / Client Components must call the Next.js Route Handlers over HTTP
 * rather than importing the server-only mock data layer (`lib/ticket-api`,
 * `lib/dashboard-api`, `lib/mock-data`). Keeping the 10k-row mock dataset and
 * its generation out of the client bundle is a key performance measure: the
 * synchronous 10k-object build used to ship to the browser and blocked the
 * main thread (high TBT on throttled mobile CPUs).
 */
import type {
  TicketWithRelations,
  TicketListParams,
  PaginatedResult,
  User,
  TicketDetail,
  TicketComment,
  TicketStatus,
  TicketPriority,
  DashboardData,
} from '@team-portal/types';

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    let message = `Request failed: ${res.status}`;
    try {
      const body = (await res.json()) as { error?: string };
      if (body.error) message = body.error;
    } catch {
      /* keep generic message */
    }
    throw new Error(message);
  }
  return (await res.json()) as T;
}

// ── Tickets ───────────────────────────────────────────────────────

export function fetchTickets(
  params: TicketListParams,
): Promise<PaginatedResult<TicketWithRelations>> {
  const sp = new URLSearchParams();
  sp.set('page', String(params.page));
  sp.set('pageSize', String(params.pageSize));
  if (params.status && params.status.length > 0) sp.set('status', params.status.join(','));
  if (params.priority && params.priority.length > 0)
    sp.set('priority', params.priority.join(','));
  if (params.assigneeId) sp.set('assigneeId', params.assigneeId);
  if (params.keyword && params.keyword.trim()) sp.set('keyword', params.keyword);
  if (params.date) sp.set('date', params.date);
  if (params.sort) {
    sp.set('sortField', params.sort.field);
    sp.set('sortDirection', params.sort.direction);
  }
  return request<PaginatedResult<TicketWithRelations>>(`/api/tickets?${sp.toString()}`);
}

export function fetchUsers(): Promise<User[]> {
  return request<User[]>('/api/users');
}

export function fetchTicketDetail(id: string): Promise<TicketDetail | null> {
  return request<TicketDetail | null>(`/api/tickets/${encodeURIComponent(id)}`);
}

export function fetchTicketComments(ticketId: string): Promise<TicketComment[]> {
  return request<TicketComment[]>(
    `/api/tickets/${encodeURIComponent(ticketId)}/comments`,
  );
}

export function createComment(ticketId: string, content: string): Promise<TicketComment> {
  return request<TicketComment>(`/api/tickets/${encodeURIComponent(ticketId)}/comments`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  });
}

export function transitionTicketStatus(
  ticketId: string,
  status: TicketStatus,
): Promise<void> {
  return request<void>(`/api/tickets/${encodeURIComponent(ticketId)}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export function changeTicketPriority(
  ticketId: string,
  priority: TicketPriority,
): Promise<void> {
  return request<void>(`/api/tickets/${encodeURIComponent(ticketId)}`, {
    method: 'PATCH',
    body: JSON.stringify({ priority }),
  });
}

export function assignTicketToUser(ticketId: string, assigneeId: string): Promise<void> {
  return request<void>(`/api/tickets/${encodeURIComponent(ticketId)}`, {
    method: 'PATCH',
    body: JSON.stringify({ assigneeId }),
  });
}

export function batchAssignTickets(
  ticketIds: string[],
  assigneeId: string,
): Promise<void> {
  return request<void>('/api/tickets/batch/assign', {
    method: 'POST',
    body: JSON.stringify({ ticketIds, assigneeId }),
  });
}

export function batchCloseTickets(ticketIds: string[]): Promise<void> {
  return request<void>('/api/tickets/batch/close', {
    method: 'POST',
    body: JSON.stringify({ ticketIds }),
  });
}

// ── Dashboard ─────────────────────────────────────────────────────

export function fetchDashboardData(locale: string): Promise<DashboardData> {
  return request<DashboardData>(`/api/dashboard?locale=${encodeURIComponent(locale)}`);
}
