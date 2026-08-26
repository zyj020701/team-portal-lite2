/**
 * WebSocket connection status.
 */
export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'reconnecting';

/**
 * Message types exchanged over the WebSocket.
 */
export type WsMessageType =
  | 'ping'
  | 'pong'
  | 'notification'
  | 'sync_request'
  | 'sync_response'
  | 'mark_read'
  | 'mark_all_read';

/**
 * Base structure for all WebSocket messages.
 */
export interface WsMessage<T = unknown> {
  type: WsMessageType;
  payload: T;
  id: string;
  timestamp: number;
}

/**
 * Notification payload delivered through WebSocket.
 */
export interface NotificationPayload {
  id: string;
  type: 'ticket_assigned' | 'ticket_updated' | 'mention';
  message: string;
  ticketId?: string;
  createdAt: string;
  read: boolean;
}

/**
 * Offline sync payload — sent by the server after reconnection.
 */
export interface SyncPayload {
  messages: NotificationPayload[];
  lastSequence: number;
}

/**
 * Mark-read payload.
 */
export interface MarkReadPayload {
  notificationIds: string[];
}

/**
 * Callbacks for WebSocketClient lifecycle events.
 */
export interface WebSocketClientCallbacks {
  onOpen?: () => void;
  onMessage?: (message: WsMessage) => void;
  onClose?: (event: CloseEvent) => void;
  onError?: (event: Event) => void;
  onStatusChange?: (status: ConnectionStatus) => void;
  onNotification?: (notification: NotificationPayload) => void;
}

/**
 * Configuration for the WebSocketClient.
 */
export interface WebSocketClientConfig {
  url: string;
  /** Heartbeat interval in ms (default 30000). */
  heartbeatInterval?: number;
  /** Pong timeout in ms (default 60000). */
  pongTimeout?: number;
  /** Initial reconnect delay in ms (default 1000). */
  initialReconnectDelay?: number;
  /** Maximum reconnect delay in ms (default 30000). */
  maxReconnectDelay?: number;
  /** Maximum reconnect attempts (0 = infinite, default 0). */
  maxReconnectAttempts?: number;
}
