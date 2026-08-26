import type { TicketStatus } from '@team-portal/types';

const STATUS_LABELS: Record<TicketStatus, string> = {
  pending: '待处理',
  in_progress: '处理中',
  resolved: '已解决',
  closed: '已关闭',
};

/**
 * Map a {@link TicketStatus} to its localized (Chinese) label.
 *
 * @param status - The ticket status.
 * @returns The human-readable status label.
 */
export function formatTicketStatus(status: TicketStatus): string {
  return STATUS_LABELS[status];
}
