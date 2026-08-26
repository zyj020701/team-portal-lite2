import { describe, expect, it } from 'vitest';
import { dashboardKeys, ticketKeys } from './query-keys';

describe('dashboardKeys', () => {
  it('all is a stable root key', () => {
    expect(dashboardKeys.all).toEqual(['dashboard']);
  });

  it('stats(locale) builds a namespaced key', () => {
    expect(dashboardKeys.stats('en')).toEqual(['dashboard', 'stats', 'en']);
    expect(dashboardKeys.stats('zh')).toEqual(['dashboard', 'stats', 'zh']);
  });
});

describe('ticketKeys', () => {
  it('all is a stable root key', () => {
    expect(ticketKeys.all).toEqual(['tickets']);
  });

  it('lists() returns the list prefix', () => {
    expect(ticketKeys.lists()).toEqual(['tickets', 'list']);
  });

  it('list(filters) includes the filters object in the key', () => {
    const filters = { status: ['open'], keyword: 'login' } as const;
    expect(ticketKeys.list(filters)).toEqual(['tickets', 'list', filters]);
  });

  it('details() returns the detail prefix', () => {
    expect(ticketKeys.details()).toEqual(['tickets', 'detail']);
  });

  it('detail(id) builds a per-ticket key', () => {
    expect(ticketKeys.detail('abc-123')).toEqual(['tickets', 'detail', 'abc-123']);
  });

  it('produces distinct references on each factory call (no shared mutation)', () => {
    const a = ticketKeys.lists();
    const b = ticketKeys.lists();
    expect(a).not.toBe(b);
    expect(a).toEqual(b);
  });
});
