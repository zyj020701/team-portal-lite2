import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import type {
  ConnectionStatus,
  NotificationPayload,
  WebSocketClientCallbacks,
  WebSocketClientConfig,
} from '@team-portal/ws-client';

// ---- Mock the ws-client package so no real socket is opened ----
const clientMocks = vi.hoisted(() => {
  const instances: Array<{
    connect: ReturnType<typeof vi.fn>;
    disconnect: ReturnType<typeof vi.fn>;
    callbacks: WebSocketClientCallbacks;
  }> = [];
  // Captured handlers passed to the most recent TabCoordinator so tests
  // can simulate cross-tab / leadership events.
  let lastCoordinatorHandlers: Record<string, (...args: unknown[]) => void> = {};
  return {
    instances,
    getCoordinatorHandlers: () => lastCoordinatorHandlers,
    resetCoordinatorHandlers: () => {
      lastCoordinatorHandlers = {};
    },
  };
});

vi.mock('@team-portal/ws-client', () => {
  class MockWebSocketClient {
    public callbacks: WebSocketClientCallbacks;
    public connect = vi.fn();
    public disconnect = vi.fn();
    constructor(_config: WebSocketClientConfig, callbacks: WebSocketClientCallbacks = {}) {
      this.callbacks = callbacks;
      clientMocks.instances.push(this);
    }
  }
  class MockMessageQueue {
    private onFlush: (batch: NotificationPayload[]) => void;
    constructor(onFlush: (batch: NotificationPayload[]) => void) {
      this.onFlush = onFlush;
    }
    public enqueue = vi.fn((n: NotificationPayload) => this.onFlush([n]));
    public clear = vi.fn();
  }
  return {
    WebSocketClient: MockWebSocketClient,
    MockNotificationClient: MockWebSocketClient,
    MessageQueue: MockMessageQueue,
    TabCoordinator: class {
      constructor(
        _channelName: string,
        handlers: Record<string, (...args: unknown[]) => void> = {},
      ) {
        // Capture handlers so tests can drive follower/leadership events.
        clientMocks.resetCoordinatorHandlers();
        Object.entries(handlers).forEach(([key, fn]) => {
          clientMocks.getCoordinatorHandlers()[key] = fn;
        });
        // Simulate this tab immediately winning the leadership election
        // so the hook opens the WebSocket connection synchronously.
        handlers.onBecomeLeader?.();
      }
      destroy() {
        /* no-op */
      }
      broadcastNotification() {
        /* no-op */
      }
      broadcastMarkRead() {
        /* no-op */
      }
      broadcastMarkAllRead() {
        /* no-op */
      }
      broadcastState() {
        /* no-op */
      }
    },
  };
});

import { useWebSocket } from './use-websocket';

function makeNotification(
  id: string,
  overrides: Partial<NotificationPayload> = {},
): NotificationPayload {
  return {
    id,
    type: 'ticket_assigned',
    message: `msg ${id}`,
    createdAt: new Date().toISOString(),
    read: false,
    ...overrides,
  };
}

describe('useWebSocket', () => {
  beforeEach(() => {
    clientMocks.instances.length = 0;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('starts disconnected and creates a client when enabled', () => {
    const { result } = renderHook(() => useWebSocket({ url: 'wss://example.com' }));

    expect(result.current.connectionStatus).toBe('disconnected');
    const client = clientMocks.instances[0];
    expect(client).toBeDefined();
    expect(client?.connect).toHaveBeenCalledTimes(1);
  });

  it('does not create a connection when enabled is false', () => {
    renderHook(() => useWebSocket({ url: 'wss://example.com' }, 'ch', false));
    expect(clientMocks.instances).toHaveLength(0);
  });

  it('uses the mock transport when transport is "mock" and connects directly', () => {
    const generator = vi.fn(() => ({
      type: 'ticket_created' as const,
      message: 'mock new ticket',
      ticketId: 'TK-1',
    }));

    renderHook(() =>
      useWebSocket(
        { url: '' },
        'ch',
        true,
        { transport: 'mock', mockConfig: { interval: 99, initialBurst: 0, generateNotification: generator } },
      ),
    );

    // A client was created and connected immediately (no leader election).
    const client = clientMocks.instances[0];
    expect(client).toBeDefined();
    expect(client?.connect).toHaveBeenCalledTimes(1);

    // No TabCoordinator handler capture means no coordinator was set up;
    // the client receives notifications straight from the mock feed.
    act(() => {
      client?.callbacks.onNotification?.(
        makeNotification('m1', { type: 'ticket_created', message: 'new ticket' }),
      );
    });
  });

  it('mock transport ignores lost-leadership (no cross-tab teardown)', () => {
    renderHook(() =>
      useWebSocket({ url: '' }, 'ch', true, { transport: 'mock' }),
    );
    const client = clientMocks.instances[0];
    expect(client?.connect).toHaveBeenCalledTimes(1);

    // In mock mode there is no coordinator, so a leadership event must not
    // be wired up; invoking it defensively must not disconnect the client.
    expect(() => {
      act(() => {
        clientMocks.getCoordinatorHandlers().onLoseLeadership?.();
      });
    }).not.toThrow();
    expect(client?.disconnect).not.toHaveBeenCalled();
  });

  it('reflects connection status changes reported by the client', () => {
    const { result } = renderHook(() => useWebSocket({ url: 'wss://example.com' }));
    const client = clientMocks.instances[0];

    act(() => {
      client?.callbacks.onStatusChange?.('connecting');
    });
    expect(result.current.connectionStatus).toBe('connecting');

    act(() => {
      client?.callbacks.onStatusChange?.('connected');
    });
    expect(result.current.connectionStatus).toBe('connected' as ConnectionStatus);
  });

  it('enqueues notifications, dedupes by id, and computes unread count', () => {
    const { result } = renderHook(() => useWebSocket({ url: 'wss://example.com' }));
    const client = clientMocks.instances[0];

    act(() => {
      client?.callbacks.onNotification?.(makeNotification('1'));
      // Duplicate id delivered before newer messages must be deduped and
      // must not affect the final newest message.
      client?.callbacks.onNotification?.(makeNotification('1'));
      client?.callbacks.onNotification?.(makeNotification('2', { read: true }));
    });

    expect(result.current.notifications).toHaveLength(2);
    expect(result.current.unreadCount).toBe(1);
    expect(result.current.lastMessage?.id).toBe('2');
  });

  it('marks a single notification as read', () => {
    const { result } = renderHook(() => useWebSocket({ url: 'wss://example.com' }));
    const client = clientMocks.instances[0];

    act(() => {
      client?.callbacks.onNotification?.(makeNotification('a'));
      client?.callbacks.onNotification?.(makeNotification('b'));
    });
    expect(result.current.unreadCount).toBe(2);

    act(() => {
      result.current.markAsRead('a');
    });

    expect(result.current.unreadCount).toBe(1);
    expect(result.current.notifications.find((n) => n.id === 'a')?.read).toBe(true);
  });

  it('marks all notifications as read', () => {
    const { result } = renderHook(() => useWebSocket({ url: 'wss://example.com' }));
    const client = clientMocks.instances[0];

    act(() => {
      client?.callbacks.onNotification?.(makeNotification('a'));
      client?.callbacks.onNotification?.(makeNotification('b'));
    });

    act(() => {
      result.current.markAllAsRead();
    });

    expect(result.current.unreadCount).toBe(0);
    expect(result.current.notifications.every((n) => n.read)).toBe(true);
  });

  it('reconnect() disconnects then connects the client again', () => {
    const { result } = renderHook(() => useWebSocket({ url: 'wss://example.com' }));
    const client = clientMocks.instances[0];
    expect(client).toBeDefined();

    act(() => {
      result.current.reconnect();
    });

    expect(client?.disconnect).toHaveBeenCalledTimes(1);
    expect(client?.connect).toHaveBeenCalledTimes(2);
  });

  it('disconnects the client on unmount', () => {
    const { unmount } = renderHook(() => useWebSocket({ url: 'wss://example.com' }));
    const client = clientMocks.instances[0];

    unmount();

    expect(client?.disconnect).toHaveBeenCalledTimes(1);
  });
  it('handles losing leadership by disconnecting and resetting status', () => {
    const { result } = renderHook(() => useWebSocket({ url: 'wss://example.com' }));
    const client = clientMocks.instances[0];

    act(() => {
      client?.callbacks.onStatusChange?.('connected');
    });
    expect(result.current.connectionStatus).toBe('connected');

    act(() => {
      clientMocks.getCoordinatorHandlers().onLoseLeadership?.();
    });

    expect(client?.disconnect).toHaveBeenCalled();
    expect(result.current.connectionStatus).toBe('disconnected');
  });

  it('enqueues notifications received from a remote (leader) tab', () => {
    const { result } = renderHook(() => useWebSocket({ url: 'wss://example.com' }));

    act(() => {
      clientMocks.getCoordinatorHandlers().onRemoteNotification?.(makeNotification('remote-1'));
    });

    expect(result.current.notifications).toHaveLength(1);
    expect(result.current.notifications[0]?.id).toBe('remote-1');
  });

  it('applies mark-read and mark-all-read from a remote tab', () => {
    const { result } = renderHook(() => useWebSocket({ url: 'wss://example.com' }));

    act(() => {
      clientMocks.getCoordinatorHandlers().onRemoteNotification?.(makeNotification('a'));
      clientMocks.getCoordinatorHandlers().onRemoteNotification?.(makeNotification('b'));
    });
    expect(result.current.unreadCount).toBe(2);

    act(() => {
      clientMocks.getCoordinatorHandlers().onRemoteMarkRead?.(['a']);
    });
    expect(result.current.unreadCount).toBe(1);

    act(() => {
      clientMocks.getCoordinatorHandlers().onRemoteMarkAllRead?.();
    });
    expect(result.current.unreadCount).toBe(0);
  });

  it('responds to a state request by broadcasting current state', () => {
    renderHook(() => useWebSocket({ url: 'wss://example.com' }));
    const client = clientMocks.instances[0];
    // Pre-populate via the leader notification path.
    act(() => {
      client?.callbacks.onNotification?.(makeNotification('s1'));
    });

    // onStateRequest calls coordinatorRef.current.broadcastState — verify
    // it runs without throwing (the mock method is a no-op vi.fn implicitly).
    expect(() => {
      clientMocks.getCoordinatorHandlers().onStateRequest?.();
    }).not.toThrow();
  });

  it('caps the stored notification list at 100 newest entries', async () => {
    const { result } = renderHook(() => useWebSocket({ url: 'wss://example.com' }));
    const client = clientMocks.instances[0];

    act(() => {
      for (let i = 0; i < 105; i += 1) {
        client?.callbacks.onNotification?.(makeNotification(String(i)));
      }
    });

    await waitFor(() => {
      expect(result.current.notifications).toHaveLength(100);
    });
    expect(result.current.notifications[0]?.id).toBe('104');
  });
});
