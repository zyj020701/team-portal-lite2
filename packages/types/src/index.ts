/**
 * Team Portal Lite — Shared domain types.
 *
 * These types are consumed by every app and package. They must remain
 * free of any runtime dependencies and contain **zero** `any` usages.
 */

// ── Ticket domain ───────────────────────────────────────────────

export type TicketStatus = 'pending' | 'in_progress' | 'resolved' | 'closed';

export type TicketPriority = 'urgent' | 'high' | 'medium' | 'low';

export type TicketSortField = 'createdAt' | 'priority';
export type SortDirection = 'asc' | 'desc';

export interface TicketSort {
  field: TicketSortField;
  direction: SortDirection;
}

export interface User {
  id: string;
  name: string;
  avatarUrl?: string;
}

export interface Customer {
  id: string;
  name: string;
  contact: string;
  company: string;
}

export interface Ticket {
  id: string;
  title: string;
  status: TicketStatus;
  priority: TicketPriority;
  assigneeId: string | null;
  tenantId: string;
  customerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface TicketWithRelations extends Ticket {
  assignee: User | null;
  customer: Customer;
}

// ── Ticket detail ───────────────────────────────────────────────

export type TimelineEventType =
  'created' | 'assigned' | 'status_changed' | 'priority_changed' | 'comment';

export interface TimelineEvent {
  id: string;
  type: TimelineEventType;
  timestamp: string;
  operator: User;
  content: string;
  /** For status_changed: the previous status. */
  fromStatus?: TicketStatus;
  /** For status_changed: the new status. */
  toStatus?: TicketStatus;
  /** For priority_changed: the previous priority. */
  fromPriority?: TicketPriority;
  /** For priority_changed: the new priority. */
  toPriority?: TicketPriority;
  /** For assigned: the previous assignee. */
  fromAssignee?: User | null;
  /** For assigned: the new assignee. */
  toAssignee?: User | null;
}

export interface TicketComment {
  id: string;
  ticketId: string;
  author: User;
  content: string;
  createdAt: string;
}

export interface TicketDetail extends TicketWithRelations {
  description: string;
  events: TimelineEvent[];
}

// ── State machine ───────────────────────────────────────────────

/**
 * Legal ticket status transitions:
 *   pending      → in_progress, closed
 *   in_progress  → resolved, closed
 *   resolved     → closed, in_progress (reopen)
 *   closed       → (terminal, no transitions)
 */
export const STATUS_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  pending: ['in_progress', 'closed'],
  in_progress: ['resolved', 'closed'],
  resolved: ['closed', 'in_progress'],
  closed: [],
};

export const STATUS_LABELS: Record<TicketStatus, string> = {
  pending: '待处理',
  in_progress: '处理中',
  resolved: '已解决',
  closed: '已关闭',
};

export const PRIORITY_LABELS: Record<TicketPriority, string> = {
  urgent: '紧急',
  high: '高',
  medium: '中',
  low: '低',
};

// ── Filter / query params ───────────────────────────────────────

export interface TicketListParams {
  status?: TicketStatus[];
  priority?: TicketPriority[];
  assigneeId?: string;
  keyword?: string;
  /** Filter tickets created on this date (YYYY-MM-DD) */
  date?: string;
  page: number;
  pageSize: number;
  sort?: TicketSort;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ── WebSocket ───────────────────────────────────────────────────

export type WSMessageType =
  'ticket.created' | 'ticket.updated' | 'ticket.assigned' | 'notification';

export interface WSMessage<T = unknown> {
  id: string;
  type: WSMessageType;
  payload: T;
  timestamp: string;
}

/**
 * Canonical alias for {@link WSMessage} — the envelope used for every
 * message received over the WebSocket connection. Named explicitly as
 * `WebSocketMessage` to satisfy the shared domain-type contract.
 */
export type WebSocketMessage<T = unknown> = WSMessage<T>;

export interface NotificationPayload {
  id: string;
  title: string;
  read: boolean;
  createdAt: string;
}

// ── Theme ───────────────────────────────────────────────────────

export interface ThemeTokens {
  primary: Record<string, string>;
  secondary: Record<string, string>;
  success: Record<string, string>;
  warning: Record<string, string>;
  error: Record<string, string>;
  info: Record<string, string>;
  neutral: Record<string, string>;
  radius: { small: string; medium: string; large: string };
  spacing: Record<string, string>;
}

export type TenantId = 'company-a' | 'company-b';

/**
 * A tenant (customer organization) on the platform.
 * Multi-tenant theming is keyed off {@link TenantId}.
 */
export interface Tenant {
  id: TenantId;
  name: string;
  /** Theme token set applied at runtime for this tenant. */
  theme: ThemeTokens;
}

// ── Dashboard ───────────────────────────────────────────────────

export interface DashboardStats {
  newToday: number;
  pending: number;
  resolved: number;
  avgResponseMinutes: number;
  /** Percentage change vs previous period, positive = up */
  newTodayChange: number;
  pendingChange: number;
  resolvedChange: number;
  avgResponseChange: number;
}

export interface TrendPoint {
  date: string;
  created: number;
  resolved: number;
}

export interface StatusDistributionItem {
  status: TicketStatus;
  count: number;
}

export interface AssigneeRank {
  assigneeId: string;
  assigneeName: string;
  count: number;
}

export interface DashboardData {
  stats: DashboardStats;
  trend: TrendPoint[];
  distribution: StatusDistributionItem[];
  topAssignees: AssigneeRank[];
}
