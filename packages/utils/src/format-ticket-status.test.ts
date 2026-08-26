import { describe, it, expect } from 'vitest';
import { formatTicketStatus } from './format-ticket-status';
import type { TicketStatus } from '@team-portal/types';

describe('formatTicketStatus', () => {
  it('maps each known status to its Chinese label', () => {
    expect(formatTicketStatus('pending')).toBe('待处理');
    expect(formatTicketStatus('in_progress')).toBe('处理中');
    expect(formatTicketStatus('resolved')).toBe('已解决');
    expect(formatTicketStatus('closed')).toBe('已关闭');
  });

  it('returns a non-empty string for every possible status', () => {
    const statuses: TicketStatus[] = ['pending', 'in_progress', 'resolved', 'closed'];
    for (const status of statuses) {
      expect(formatTicketStatus(status).length).toBeGreaterThan(0);
    }
  });

  it('produces distinct labels for distinct statuses', () => {
    const labels = [
      formatTicketStatus('pending'),
      formatTicketStatus('in_progress'),
      formatTicketStatus('resolved'),
      formatTicketStatus('closed'),
    ];
    expect(new Set(labels).size).toBe(labels.length);
  });
});
