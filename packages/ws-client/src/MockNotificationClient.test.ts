import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MockNotificationClient, defaultMockNotificationGenerator } from './MockNotificationClient';
import type { NotificationPayload } from './types';

describe('MockNotificationClient', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // Belt-and-suspenders: guarantee the real clock is restored for the rest
  // of the test run (other files rely on real timers under a shared fork).
  afterAll(() => {
    vi.useRealTimers();
  });

  it('reports connecting then connected and replays the initial burst', () => {
    const onStatusChange = vi.fn();
    const onNotification = vi.fn();
    const client = new MockNotificationClient(
      { interval: 10_000, initialBurst: 3 },
      { onStatusChange, onNotification },
    );

    client.connect();
    expect(onStatusChange).toHaveBeenCalledWith('connecting');

    // Handshake round-trip (300ms).
    vi.advanceTimersByTime(300);

    expect(onStatusChange).toHaveBeenCalledWith('connected');
    expect(onNotification).toHaveBeenCalledTimes(3);
    client.disconnect();
  });

  it('emits new-ticket notifications by default and schedules periodic ones', () => {
    const onNotification = vi.fn();
    const client = new MockNotificationClient(
      { interval: 5_000, initialBurst: 0 },
      { onNotification },
    );

    client.connect();
    vi.advanceTimersByTime(300);
    expect(onNotification).not.toHaveBeenCalled();

    vi.advanceTimersByTime(5_000);
    expect(onNotification).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(5_000);
    expect(onNotification).toHaveBeenCalledTimes(2);

    const payload = onNotification.mock.calls[0]?.[0] as NotificationPayload;
    expect(payload).toMatchObject({ read: false });
    expect(payload.id).toBeTruthy();
    expect(payload.ticketId).toMatch(/^TK-\d{5}$/);
    client.disconnect();
  });

  it('stops emitting after disconnect and reports disconnected', () => {
    const onStatusChange = vi.fn();
    const onNotification = vi.fn();
    const client = new MockNotificationClient(
      { interval: 1_000, initialBurst: 0 },
      { onStatusChange, onNotification },
    );

    client.connect();
    vi.advanceTimersByTime(300);
    client.disconnect();

    expect(onStatusChange).toHaveBeenCalledWith('disconnected');
    vi.advanceTimersByTime(10_000);
    expect(onNotification).not.toHaveBeenCalled();
  });

  it('emit() pushes an immediate notification honoring overrides', () => {
    const onNotification = vi.fn();
    const client = new MockNotificationClient(
      { initialBurst: 0 },
      { onNotification },
    );
    client.connect();
    vi.advanceTimersByTime(300);

    const pushed = client.emit({ type: 'ticket_created', message: 'manual', ticketId: 'TK-99999' });
    expect(pushed.type).toBe('ticket_created');
    expect(pushed.ticketId).toBe('TK-99999');
    expect(onNotification).toHaveBeenCalledWith(pushed);
    client.disconnect();
  });

  it('uses a custom generator when provided', () => {
    const generateNotification = vi.fn(() => ({
      type: 'mention' as const,
      message: 'custom',
      ticketId: 'TK-1',
    }));
    const onNotification = vi.fn();
    const client = new MockNotificationClient(
      { initialBurst: 1, generateNotification },
      { onNotification },
    );

    client.connect();
    vi.advanceTimersByTime(300);

    expect(generateNotification).toHaveBeenCalledTimes(1);
    const payload = onNotification.mock.calls[0]?.[0] as NotificationPayload;
    expect(payload.type).toBe('mention');
    expect(payload.message).toBe('custom');
    client.disconnect();
  });

  it('connect() is a no-op when already active', () => {
    const onStatusChange = vi.fn();
    const client = new MockNotificationClient({ initialBurst: 0 }, { onStatusChange });
    client.connect();
    client.connect();
    vi.advanceTimersByTime(300);
    // connecting once + connected once.
    expect(onStatusChange).toHaveBeenCalledTimes(2);
    client.disconnect();
  });

  it('default generator produces valid envelopes across many rolls', () => {
    const types = new Set<string>();
    for (let i = 0; i < 100; i += 1) {
      const n = defaultMockNotificationGenerator();
      types.add(n.type);
      expect(n.message).toBeTruthy();
      expect(n.ticketId).toMatch(/^TK-\d{5}$/);
    }
    expect(types.has('ticket_created')).toBe(true);
  });
});
