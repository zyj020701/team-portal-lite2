import type {
  ConnectionStatus,
  NotificationPayload,
  SyncPayload,
  WebSocketClientCallbacks,
  WebSocketClientConfig,
  WsMessage,
} from './types';

/**
 * Generates a unique message id.
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * Calculates the next reconnect delay using exponential backoff with full jitter.
 *
 * Formula: min(maxDelay, initialDelay * 2^attempt) * (0.5 + Math.random() * 0.5)
 *
 * The jitter prevents the "thundering herd" problem when many clients
 * reconnect simultaneously after a server outage.
 */
export function calculateBackoffDelay(
  attempt: number,
  initialDelay: number,
  maxDelay: number,
): number {
  const exponential = Math.min(maxDelay, initialDelay * Math.pow(2, attempt));
  // Full jitter: random value between 0 and exponential
  return Math.floor(exponential * (0.5 + Math.random() * 0.5));
}

const DEFAULT_CONFIG: Required<
  Pick<
    WebSocketClientConfig,
    | 'heartbeatInterval'
    | 'pongTimeout'
    | 'initialReconnectDelay'
    | 'maxReconnectDelay'
    | 'maxReconnectAttempts'
  >
> = {
  heartbeatInterval: 30_000,
  pongTimeout: 60_000,
  initialReconnectDelay: 1_000,
  maxReconnectDelay: 30_000,
  maxReconnectAttempts: 0,
};

/**
 * A robust WebSocket client with:
 * - Automatic heartbeat (ping/pong)
 * - Exponential backoff reconnection with jitter
 * - Offline message sync after reconnection
 * - Typed message protocol
 *
 * This class is framework-agnostic and can be used with any UI layer.
 */
export class WebSocketClient {
  private ws: WebSocket | null = null;
  private readonly config: Required<WebSocketClientConfig>;
  private readonly callbacks: WebSocketClientCallbacks;
  private status: ConnectionStatus = 'disconnected';
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private pongTimeoutTimer: ReturnType<typeof setTimeout> | null = null;
  private manuallyClosed = false;
  private lastSequence = 0;

  constructor(config: WebSocketClientConfig, callbacks: WebSocketClientCallbacks = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.callbacks = callbacks;
  }

  /**
   * Establishes a WebSocket connection.
   * If already connected or connecting, this is a no-op.
   */
  connect(): void {
    if (
      this.status === 'connected' ||
      this.status === 'connecting' ||
      this.status === 'reconnecting'
    ) {
      return;
    }

    this.manuallyClosed = false;
    this.setStatus(this.reconnectAttempts > 0 ? 'reconnecting' : 'connecting');

    try {
      this.ws = new WebSocket(this.config.url);
    } catch {
      this.scheduleReconnect();
      return;
    }

    this.ws.onopen = this.handleOpen;
    this.ws.onmessage = this.handleMessage;
    this.ws.onclose = this.handleClose;
    this.ws.onerror = this.handleError;
  }

  /**
   * Gracefully disconnects the WebSocket.
   * Prevents automatic reconnection.
   */
  disconnect(): void {
    this.manuallyClosed = true;
    this.clearTimers();
    this.reconnectAttempts = 0;

    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onmessage = null;
      this.ws.onclose = null;
      this.ws.onerror = null;
      if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
        this.ws.close(1000, 'Client disconnect');
      }
      this.ws = null;
    }

    this.setStatus('disconnected');
  }

  /**
   * Sends a typed message through the WebSocket.
   * Returns false if the connection is not open.
   */
  send<T>(type: WsMessage['type'], payload: T): boolean {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return false;
    }

    const message: WsMessage<T> = {
      type,
      payload,
      id: generateId(),
      timestamp: Date.now(),
    };

    this.ws.send(JSON.stringify(message));
    return true;
  }

  /**
   * Returns the current connection status.
   */
  getStatus(): ConnectionStatus {
    return this.status;
  }

  /**
   * Updates the last known sequence number for offline sync.
   */
  setLastSequence(seq: number): void {
    this.lastSequence = seq;
  }

  // ---- Private handlers ----

  private handleOpen = (): void => {
    this.reconnectAttempts = 0;
    this.setStatus('connected');
    this.startHeartbeat();
    this.requestOfflineSync();
    this.callbacks.onOpen?.();
  };

  private handleMessage = (event: MessageEvent): void => {
    let message: WsMessage;
    try {
      message = JSON.parse(event.data as string) as WsMessage;
    } catch {
      return;
    }

    // Handle pong response 鈥?reset the timeout
    if (message.type === 'pong') {
      this.clearPongTimeout();
      return;
    }

    // Handle offline sync response
    if (message.type === 'sync_response') {
      const syncPayload = message.payload as SyncPayload;
      this.lastSequence = syncPayload.lastSequence;
      for (const notification of syncPayload.messages) {
        this.callbacks.onNotification?.(notification);
      }
      return;
    }

    // Handle incoming notifications
    if (message.type === 'notification') {
      const notification = message.payload as NotificationPayload;
      this.callbacks.onNotification?.(notification);
    }

    this.callbacks.onMessage?.(message);
  };

  private handleClose = (event: CloseEvent): void => {
    this.clearHeartbeat();
    this.clearPongTimeout();
    this.ws = null;

    if (this.manuallyClosed) {
      this.setStatus('disconnected');
      return;
    }

    this.callbacks.onClose?.(event);
    this.scheduleReconnect();
  };

  private handleError = (event: Event): void => {
    this.callbacks.onError?.(event);
    // The onclose handler will be called after onerror,
    // which will trigger reconnection.
  };

  // ---- Heartbeat ----

  private startHeartbeat(): void {
    this.clearHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      this.send('ping', null);
      this.startPongTimeout();
    }, this.config.heartbeatInterval);
  }

  private clearHeartbeat(): void {
    if (this.heartbeatTimer !== null) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private startPongTimeout(): void {
    this.clearPongTimeout();
    this.pongTimeoutTimer = setTimeout(() => {
      // No pong received within timeout 鈥?connection is stale, force close
      if (this.ws) {
        this.ws.close(4000, 'Pong timeout');
      }
    }, this.config.pongTimeout);
  }

  private clearPongTimeout(): void {
    if (this.pongTimeoutTimer !== null) {
      clearTimeout(this.pongTimeoutTimer);
      this.pongTimeoutTimer = null;
    }
  }

  // ---- Reconnection ----

  private scheduleReconnect(): void {
    const maxAttempts = this.config.maxReconnectAttempts;
    if (maxAttempts > 0 && this.reconnectAttempts >= maxAttempts) {
      this.setStatus('disconnected');
      return;
    }

    this.setStatus('reconnecting');

    const delay = calculateBackoffDelay(
      this.reconnectAttempts,
      this.config.initialReconnectDelay,
      this.config.maxReconnectDelay,
    );

    this.reconnectAttempts += 1;

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }

  // ---- Offline sync ----

  private requestOfflineSync(): void {
    this.send('sync_request', { lastSequence: this.lastSequence });
  }

  // ---- Utilities ----

  private setStatus(status: ConnectionStatus): void {
    if (this.status === status) return;
    this.status = status;
    this.callbacks.onStatusChange?.(status);
  }

  private clearTimers(): void {
    this.clearHeartbeat();
    this.clearPongTimeout();
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
}
