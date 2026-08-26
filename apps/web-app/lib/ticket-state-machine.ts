/**
 * Ticket state machine re-exported from `@team-portal/utils` so that the
 * pure transition logic lives in a single, well-tested place. The value
 * import is safe here because `@team-portal/utils` is a runtime package
 * (unlike the type-only `@team-portal/types`).
 */
export { STATUS_TRANSITIONS, canTransition, getAvailableTransitions } from '@team-portal/utils';
