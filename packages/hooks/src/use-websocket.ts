'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  WebSocketClient,
  MockNotificationClient,
  MessageQueue,
  TabCoordinator,
} from '@team-portal/ws-client';
import type {
  ConnectionStatus,
  NotificationPayload,
  WebSocketClientConfig,
  MockNotificationClientConfig,
} from '@team-portal/ws-client';

/**
 * Transport used by {@link useWebSocket}.
 *
 * - `realtime` opens a genuine WebSocket via {@link WebSocketClient} and
 *   participates in multi-tab leader election.
 * - `mock` runs an in-memory simulated feed via
 *   {@link MockNotificationClient} (for local dev / demos where no WS
 *   server is available). It connects directly, skipping leader election,
 *   so every tab drives its own feed and never tears itself down on a
 *   lost-election event.
 */
export type WebSocketTransport = 'realtime' | 'mock';

/** Minimal surface shared by the real and mock clients. */
interface NotificationTransport {
  connect(): void;
  disconnect(): void;
}

/**
 * Return value of the {@link useWebSocket} hook.
 */
export interface UseWebSocketResult {
  /** Current connection status. */
  connectionStatus: ConnectionStatus;
  /** Most recently received notification (or null). */
  lastMessage: NotificationPayload | null;
  /** Number of unread notifications. */
  unreadCount: number;
  /** List of recent notifications (newest first). */
  notifications: NotificationPayload[];
  /** Marks a single notification as read. */
  markAsRead: (id: string) => void;
  /** Marks all notifications as read. */
  markAllAsRead: () => void;
  /** Manually reconnect (disconnect + connect). */
  reconnect: () => void;
}

const MAX_NOTIFICATIONS = 100;

/**
 * Creates a {@link TabCoordinator} with a graceful fallback when
 * BroadcastChannel is unavailable (e.g. some headless browser contexts).
 */
function createCoordinator(
  channelName: string,
  handlers: ConstructorParameters<typeof TabCoordinator>[1],
): TabCoordinator | null {
  try {
    if (typeof BroadcastChannel === 'undefined') return null;
    return new TabCoordinator(channelName, handlers);
  } catch {
    return null;
  }
}

/**
 * React hook that manages a WebSocket connection with:
 * - Heartbeat & automatic reconnection (delegated to {@link WebSocketClient})
 * - Batched message processing via {@link MessageQueue}
 * - Multi-tab coordination via {@link TabCoordinator}
 *
 * Only the elected leader tab maintains the actual WebSocket;
 * followers receive notifications through BroadcastChannel.
 *
 * @param config - WebSocket client configuration.
 * @param channelName - BroadcastChannel name for tab coordination.
 * @param enabled - When false, the hook creates no connection (default true).
 */
export interface UseWebSocketOptions {
  /** Selects the real WebSocket transport or a simulated mock feed. */
  transport?: WebSocketTransport;
  /** Configuration passed to {@link MockNotificationClient} when `transport === 'mock'`. */
  mockConfig?: MockNotificationClientConfig;
}

export function useWebSocket(
  config: WebSocketClientConfig,
  channelName = 'team-portal-ws',
  enabled = true,
  options: UseWebSocketOptions = {},
): UseWebSocketResult {
  const { transport = 'realtime', mockConfig } = options;
  const isMock = transport === 'mock';
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [notifications, setNotifications] = useState<NotificationPayload[]>([]);
  const [lastMessage, setLastMessage] = useState<NotificationPayload | null>(null);

  const clientRef = useRef<NotificationTransport | null>(null);
  const queueRef = useRef<MessageQueue | null>(null);
  const coordinatorRef = useRef<TabCoordinator | null>(null);
  const notificationsRef = useRef<NotificationPayload[]>([]);
  // Keep the latest mock config available without re-creating the client
  // when a caller passes a fresh object literal on every render.
  const mockConfigRef = useRef<MockNotificationClientConfig | undefined>(mockConfig);
  mockConfigRef.current = mockConfig;

  // Keep ref in sync for use in callbacks without re-subscribing
  useEffect(() => {
    notificationsRef.current = notifications;
  }, [notifications]);

  const addNotifications = useCallback((incoming: NotificationPayload[]) => {
    setNotifications((prev) => {
      const seen = new Set(prev.map((n) => n.id));
      const fresh = incoming.filter((n) => !seen.has(n.id));
      if (fresh.length === 0) return prev;
      const merged = [...fresh.reverse(), ...prev].slice(0, MAX_NOTIFICATIONS);
      return merged;
    });
    if (incoming.length > 0) {
      setLastMessage(incoming[incoming.length - 1] ?? null);
    }
  }, []);

  // Initialize message queue
  useEffect(() => {
    queueRef.current = new MessageQueue((batch) => {
      addNotifications(batch);
    });
    return () => {
      queueRef.current?.clear();
      queueRef.current = null;
    };
  }, [addNotifications]);

  // Initialize the notification transport (real WebSocket or mock feed)
  useEffect(() => {
    if (!enabled) return;
    const callbacks: ConstructorParameters<typeof WebSocketClient>[1] = {
      onStatusChange: (status) => setConnectionStatus(status),
      onNotification: (notification) => {
        // Enqueue locally (batches into React state via the MessageQueue).
        queueRef.current?.enqueue(notification);
        // Broadcast to other tabs — only meaningful for the realtime
        // leader; the coordinator is never created in mock mode.
        coordinatorRef.current?.broadcastNotification(notification);
      },
    };

    const client: NotificationTransport = isMock
      ? new MockNotificationClient(mockConfigRef.current ?? {}, callbacks)
      : new WebSocketClient(config, callbacks);
    clientRef.current = client;

    return () => {
      client.disconnect();
      clientRef.current = null;
    };
  }, [config.url, enabled, isMock]);

  // Initialize tab coordinator
  useEffect(() => {
    if (!enabled) return;
    // Mock feed connects directly — no leader election, no cross-tab sync.
    if (isMock) {
      clientRef.current?.connect();
      return;
    }
    const coordinator = createCoordinator(channelName, {
      onBecomeLeader: () => {
        clientRef.current?.connect();
      },
      onLoseLeadership: () => {
        clientRef.current?.disconnect();
        setConnectionStatus('disconnected');
      },
      onRemoteNotification: (notification) => {
        // Follower: received from leader tab
        queueRef.current?.enqueue(notification);
      },
      onRemoteMarkRead: (ids) => {
        setNotifications((prev) =>
          prev.map((n) => (ids.includes(n.id) ? { ...n, read: true } : n)),
        );
      },
      onRemoteMarkAllRead: () => {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      },
      onStateRequest: () => {
        coordinatorRef.current?.broadcastState(
          notificationsRef.current.filter((n) => !n.read).length,
          notificationsRef.current,
        );
      },
    });
    coordinatorRef.current = coordinator;

    // If BroadcastChannel is unavailable, this tab acts as its own leader
    if (!coordinator) {
      clientRef.current?.connect();
    }

    return () => {
      coordinator?.destroy();
      coordinatorRef.current = null;
    };
  }, [channelName, enabled, isMock]);

  const unreadCount = notifications.reduce((count, n) => (n.read ? count : count + 1), 0);

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    coordinatorRef.current?.broadcastMarkRead([id]);
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    coordinatorRef.current?.broadcastMarkAllRead();
  }, []);

  const reconnect = useCallback(() => {
    const client = clientRef.current;
    if (!client) return;
    client.disconnect();
    client.connect();
  }, []);

  return {
    connectionStatus,
    lastMessage,
    unreadCount,
    notifications,
    markAsRead,
    markAllAsRead,
    reconnect,
  };
}
