import type { MockNotificationGenerator } from '@team-portal/ws-client';
import type { NotificationType } from '@team-portal/ws-client';

/**
 * Translation function shape (the subset of next-intl we use).
 * `t(key, params?)` returns the localized string for a `notifications.*` key.
 */
export type NotificationT = (
  key: string,
  params?: Record<string, string | number>,
) => string;

// Proper nouns stay identical across locales; only the surrounding sentence
// is localized. Companies mirror the tenant/brand names used in the demo so
// a "new ticket" notification feels like it comes from a real customer.
const COMPANIES = ['Acme Corp', 'Globex', 'Initech', 'Umbrella LLC', 'Stark Industries'];
const AGENTS = ['张伟', '李娜', '王芳', '刘洋', '陈明'];

function pick<T>(list: T[]): T {
  const idx = Math.floor(Math.random() * list.length);
  return list[idx] as T;
}

function nextTicketNumber(): string {
  return `TK-${String(Math.floor(10000 + Math.random() * 89999))}`;
}

/**
 * Builds a localized mock notification generator.
 *
 * The returned generator produces the same shape of events a real push
 * server would emit. Roughly half are `ticket_created` ("new ticket")
 * alerts — the headline feature of the notification bell — with the rest
 * split across assignment, updates and mentions for variety.
 */
export function createMockNotificationGenerator(t: NotificationT): MockNotificationGenerator {
  return () => {
    const roll = Math.random();
    const ticketId = nextTicketNumber();
    const company = pick(COMPANIES);
    const agent = pick(AGENTS);

    let type: NotificationType;
    let message: string;
    if (roll < 0.5) {
      type = 'ticket_created';
      message = t('mock.ticketCreated', { ticket: ticketId, company });
    } else if (roll < 0.72) {
      type = 'ticket_assigned';
      message = t('mock.ticketAssigned', { ticket: ticketId, agent });
    } else if (roll < 0.9) {
      type = 'ticket_updated';
      message = t('mock.ticketUpdated', { ticket: ticketId, agent });
    } else {
      type = 'mention';
      message = t('mock.mention', { ticket: ticketId, agent });
    }

    return { type, message, ticketId };
  };
}
