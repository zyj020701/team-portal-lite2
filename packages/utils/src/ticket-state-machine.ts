import type { TicketStatus } from '@team-portal/types';

/**
 * Legal ticket status transitions:
 *   pending      → in_progress, closed
 *   in_progress  → resolved, closed
 *   resolved     → closed, in_progress (reopen)
 *   closed       → (terminal, no transitions)
 *
 * Defined locally (rather than re-exported from the types package) because
 * the types package is treated as type-only by SWC/isolatedModules, which
 * would erase the runtime value import and cause a crash at runtime.
 */
export const STATUS_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  pending: ['in_progress', 'closed'],
  in_progress: ['resolved', 'closed'],
  resolved: ['closed', 'in_progress'],
  closed: [],
};

const ALL_STATUSES: TicketStatus[] = ['pending', 'in_progress', 'resolved', 'closed'];

/**
 * Pure function to validate whether a ticket status transition is legal.
 *
 * This serves as the second line of defense beyond button disabling —
 * even if a user manipulates the DOM, the transition is re-validated
 * before submission.
 *
 * @param from - Current ticket status.
 * @param to   - Target ticket status.
 * @returns `true` if the transition is allowed.
 */
export function canTransition(from: TicketStatus, to: TicketStatus): boolean {
  if (from === to) {
    return false;
  }
  const allowed = STATUS_TRANSITIONS[from];
  return allowed.includes(to);
}

/**
 * Returns the list of statuses the ticket can transition to from its
 * current status.
 */
export function getAvailableTransitions(from: TicketStatus): TicketStatus[] {
  return STATUS_TRANSITIONS[from];
}

/**
 * Returns every possible (from, to) transition pair. Primarily useful for
 * exhaustive testing of the state machine.
 */
export function getAllTransitions(): Array<{
  from: TicketStatus;
  to: TicketStatus;
  allowed: boolean;
}> {
  return ALL_STATUSES.flatMap((from) =>
    ALL_STATUSES.map((to) => ({ from, to, allowed: canTransition(from, to) })),
  );
}
