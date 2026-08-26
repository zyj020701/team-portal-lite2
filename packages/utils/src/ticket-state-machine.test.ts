import { describe, it, expect } from 'vitest';
import {
  STATUS_TRANSITIONS,
  canTransition,
  getAvailableTransitions,
  getAllTransitions,
} from './ticket-state-machine';
import type { TicketStatus } from '@team-portal/types';

const ALL_STATUSES: TicketStatus[] = ['pending', 'in_progress', 'resolved', 'closed'];

describe('ticket state machine', () => {
  describe('canTransition', () => {
    it('allows pending → in_progress', () => {
      expect(canTransition('pending', 'in_progress')).toBe(true);
    });

    it('allows pending → closed', () => {
      expect(canTransition('pending', 'closed')).toBe(true);
    });

    it('allows in_progress → resolved', () => {
      expect(canTransition('in_progress', 'resolved')).toBe(true);
    });

    it('allows in_progress → closed', () => {
      expect(canTransition('in_progress', 'closed')).toBe(true);
    });

    it('allows resolved → closed', () => {
      expect(canTransition('resolved', 'closed')).toBe(true);
    });

    it('allows resolved → in_progress (reopen)', () => {
      expect(canTransition('resolved', 'in_progress')).toBe(true);
    });

    it('rejects transitions from the terminal closed state', () => {
      for (const target of ALL_STATUSES) {
        expect(canTransition('closed', target)).toBe(false);
      }
    });

    it('rejects a transition to the same status', () => {
      for (const status of ALL_STATUSES) {
        expect(canTransition(status, status)).toBe(false);
      }
    });

    it('rejects illegal forward/backward jumps', () => {
      expect(canTransition('pending', 'resolved')).toBe(false);
      expect(canTransition('in_progress', 'pending')).toBe(false);
      expect(canTransition('resolved', 'pending')).toBe(false);
      expect(canTransition('resolved', 'resolved')).toBe(false);
    });
  });

  describe('getAvailableTransitions', () => {
    it('returns the allowed targets for pending', () => {
      expect(getAvailableTransitions('pending')).toEqual(['in_progress', 'closed']);
    });

    it('returns an empty list for the terminal closed state', () => {
      expect(getAvailableTransitions('closed')).toEqual([]);
    });
  });

  describe('exhaustive transition matrix (all 16 combinations)', () => {
    // Build the full expected matrix from STATUS_TRANSITIONS so every
    // (from, to) pair is asserted — including all illegal/edge cases.
    const expected: Record<TicketStatus, Record<TicketStatus, boolean>> = {
      pending: { pending: false, in_progress: true, resolved: false, closed: true },
      in_progress: { pending: false, in_progress: false, resolved: true, closed: true },
      resolved: { pending: false, in_progress: true, resolved: false, closed: true },
      closed: { pending: false, in_progress: false, resolved: false, closed: false },
    };

    it('covers every (from, to) pair exactly once', () => {
      const all = getAllTransitions();
      expect(all).toHaveLength(ALL_STATUSES.length * ALL_STATUSES.length);
    });

    it.each(ALL_STATUSES.flatMap((from) => ALL_STATUSES.map((to) => ({ from, to }))))(
      '$from → $to is $expected',
      ({ from, to }) => {
        expect(canTransition(from, to)).toBe(expected[from][to]);
      },
    );

    it('STATUS_TRANSITIONS agrees with the expected matrix', () => {
      for (const from of ALL_STATUSES) {
        for (const to of ALL_STATUSES) {
          const inList = STATUS_TRANSITIONS[from].includes(to);
          expect(canTransition(from, to)).toBe(from !== to && inList ? true : expected[from][to]);
        }
      }
    });
  });
});
