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
 * Kinds of business events a notification can represent.
 *
 * `ticket_created` is the "new ticket" alert raised whenever a customer
 * opens a new ticket; it is the primary signal shown by the notification
 * bell. The other types cover assignment, follow-up edits and mentions.
 */
export type NotificationType =
  | 'ticket_created'
  | 'ticket_assigned'
  | 'ticket_updated'
  | 'mention';

/**
 * Notification payload delivered through WebSocket.
 */
export interface NotificationPayload {
  id: string;
  type: NotificationType;
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
