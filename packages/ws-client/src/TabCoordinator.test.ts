import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TabCoordinator, type TabMessage } from './TabCoordinator';
import type { NotificationPayload } from './types';

interface Channel {
  name: string;
  onmessage: ((ev: { data: TabMessage }) => void) | null;
  postMessage: ReturnType<typeof vi.fn>;
  close: ReturnType<typeof vi.fn>;
}

const channels: Channel[] = [];

function makeChannel(name: string): Channel {
  return {
    name,
    onmessage: null,
    postMessage: vi.fn(),
    close: vi.fn(),
  };
}

function installBroadcastChannelMock(): void {
  channels.length = 0;
  vi.stubGlobal(
    'BroadcastChannel',
    vi.fn((name: string) => {
      const channel = makeChannel(name);
      channels.push(channel);
      return channel;
    }),
  );
}

function lastChannel(): Channel {
  const c = channels[channels.length - 1];
  if (!c) throw new Error('No BroadcastChannel instance');
  return c;
}

function deliverTo(channel: Channel, message: TabMessage): void {
  channel.onmessage?.({ data: message });
}

function makeNotification(id: string): NotificationPayload {
  return {
    id,
    type: 'mention',
    message: `hello ${id}`,
    createdAt: new Date().toISOString(),
    read: false,
  };
}

function makeHandlers() {
  return {
    onBecomeLeader: vi.fn(),
    onLoseLeadership: vi.fn(),
    onRemoteNotification: vi.fn(),
    onRemoteMarkRead: vi.fn(),
    onRemoteMarkAllRead: vi.fn(),
    onStateRequest: vi.fn(),
  };
}

describe('TabCoordinator', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    installBroadcastChannelMock();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('creates a BroadcastChannel with the given name', () => {
    new TabCoordinator('team-portal', makeHandlers());
    expect(BroadcastChannel).toHaveBeenCalledWith('team-portal');
  });

  it('becomes leader after the election timeout with no competitors', () => {
    const handlers = makeHandlers();
    const coordinator = new TabCoordinator('ch', handlers);

    expect(lastChannel().postMessage).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'leader_elected' }),
    );
    expect(coordinator.leader).toBe(false);

    vi.advanceTimersByTime(500);
    expect(coordinator.leader).toBe(true);
    expect(handlers.onBecomeLeader).toHaveBeenCalledTimes(1);
  });

  it('steps down when a lower-id tab claims leadership', () => {
    const handlers = makeHandlers();
    const coordinator = new TabCoordinator('ch', handlers);
    vi.advanceTimersByTime(500);
    expect(coordinator.leader).toBe(true);

    deliverTo(lastChannel(), {
      type: 'leader_elected',
      tabId: '0000-lower',
    });

    expect(coordinator.leader).toBe(false);
    expect(handlers.onLoseLeadership).toHaveBeenCalledTimes(1);
  });

  it('does not step down when a higher-id tab claims leadership', () => {
    const handlers = makeHandlers();
    const coordinator = new TabCoordinator('ch', handlers);
    vi.advanceTimersByTime(500);

    deliverTo(lastChannel(), {
      type: 'leader_elected',
      tabId: 'zzzz-higher',
    });

    expect(coordinator.leader).toBe(true);
    expect(handlers.onLoseLeadership).not.toHaveBeenCalled();
  });

  it('broadcasts notifications, mark-read, mark-all-read, and state', () => {
    const coordinator = new TabCoordinator('ch', makeHandlers());
    const channel = lastChannel();

    coordinator.broadcastNotification(makeNotification('n1'));
    expect(channel.postMessage).toHaveBeenCalledWith({
      type: 'notification',
      // Vitest's expect.objectContaining returns a typed matcher that is
      // typed as `any` for asymmetric matching; this is safe test code.
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      notification: expect.objectContaining({ id: 'n1' }),
    });

    coordinator.broadcastMarkRead(['n1', 'n2']);
    expect(channel.postMessage).toHaveBeenCalledWith({
      type: 'mark_read',
      notificationIds: ['n1', 'n2'],
    });

    coordinator.broadcastMarkAllRead();
    expect(channel.postMessage).toHaveBeenCalledWith({ type: 'mark_all_read' });

    coordinator.broadcastState(3, [makeNotification('x')]);
    expect(channel.postMessage).toHaveBeenCalledWith({
      type: 'state_response',
      unreadCount: 3,
      notifications: [expect.objectContaining({ id: 'x' })],
    });
  });

  it('delivers remote notifications only to followers', () => {
    const handlers = makeHandlers();
    const coordinator = new TabCoordinator('ch', handlers);

    deliverTo(lastChannel(), {
      type: 'notification',
      notification: makeNotification('r1'),
    });
    expect(handlers.onRemoteNotification).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'r1' }),
    );

    vi.advanceTimersByTime(500);
    expect(coordinator.leader).toBe(true);
    deliverTo(lastChannel(), {
      type: 'notification',
      notification: makeNotification('r2'),
    });
    expect(handlers.onRemoteNotification).toHaveBeenCalledTimes(1);
  });

  it('delivers remote mark-read / mark-all-read only to followers', () => {
    const handlers = makeHandlers();
    const coordinator = new TabCoordinator('ch', handlers);

    deliverTo(lastChannel(), { type: 'mark_read', notificationIds: ['a'] });
    expect(handlers.onRemoteMarkRead).toHaveBeenCalledWith(['a']);

    deliverTo(lastChannel(), { type: 'mark_all_read' });
    expect(handlers.onRemoteMarkAllRead).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(500);
    expect(coordinator.leader).toBe(true);
    deliverTo(lastChannel(), { type: 'mark_read', notificationIds: ['b'] });
    deliverTo(lastChannel(), { type: 'mark_all_read' });
    expect(handlers.onRemoteMarkRead).toHaveBeenCalledTimes(1);
    expect(handlers.onRemoteMarkAllRead).toHaveBeenCalledTimes(1);
  });

  it('responds to request_state only on the leader', () => {
    const handlers = makeHandlers();
    const coordinator = new TabCoordinator('ch', handlers);

    deliverTo(lastChannel(), { type: 'request_state' });
    expect(handlers.onStateRequest).not.toHaveBeenCalled();

    vi.advanceTimersByTime(500);
    expect(coordinator.leader).toBe(true);
    deliverTo(lastChannel(), { type: 'request_state' });
    expect(handlers.onStateRequest).toHaveBeenCalledTimes(1);
  });

  it('emits heartbeats as leader and steps down on a foreign heartbeat', () => {
    const handlers = makeHandlers();
    const coordinator = new TabCoordinator('ch', handlers);
    const channel = lastChannel();
    vi.advanceTimersByTime(500);
    expect(coordinator.leader).toBe(true);

    vi.advanceTimersByTime(5_000);
    const hbCalls = channel.postMessage.mock.calls.filter(
      (c) => (c[0] as TabMessage).type === 'leader_hb',
    );
    expect(hbCalls.length).toBeGreaterThan(0);

    deliverTo(channel, { type: 'leader_hb', tabId: 'other-leader' });
    expect(coordinator.leader).toBe(false);
    expect(handlers.onLoseLeadership).toHaveBeenCalled();
  });

  it('ignores its own heartbeat', () => {
    const handlers = makeHandlers();
    new TabCoordinator('ch', handlers);
    vi.advanceTimersByTime(500);

    const elected = lastChannel().postMessage.mock.calls.find(
      (c) => (c[0] as TabMessage).type === 'leader_elected',
    )?.[0] as { type: 'leader_elected'; tabId: string } | undefined;
    expect(elected).toBeDefined();

    deliverTo(lastChannel(), {
      type: 'leader_hb',
      tabId: elected!.tabId,
    });
    expect(handlers.onLoseLeadership).not.toHaveBeenCalled();
  });

  it('destroy closes the channel, clears onmessage, and loses leadership', () => {
    const handlers = makeHandlers();
    const coordinator = new TabCoordinator('ch', handlers);
    vi.advanceTimersByTime(500);
    expect(coordinator.leader).toBe(true);

    const channel = lastChannel();
    coordinator.destroy();

    expect(channel.close).toHaveBeenCalledTimes(1);
    expect(channel.onmessage).toBeNull();
    expect(coordinator.leader).toBe(false);
    expect(handlers.onLoseLeadership).toHaveBeenCalledTimes(1);
  });

  it('destroy without leadership still closes the channel without calling onLoseLeadership', () => {
    const handlers = makeHandlers();
    const coordinator = new TabCoordinator('ch', handlers);
    const channel = lastChannel();
    coordinator.destroy();

    expect(channel.close).toHaveBeenCalledTimes(1);
    expect(handlers.onLoseLeadership).not.toHaveBeenCalled();
    expect(coordinator.leader).toBe(false);
  });

  it('state_response is a safe no-op on followers', () => {
    const handlers = makeHandlers();
    new TabCoordinator('ch', handlers);
    expect(() =>
      deliverTo(lastChannel(), {
        type: 'state_response',
        unreadCount: 0,
        notifications: [],
      }),
    ).not.toThrow();
  });
});
