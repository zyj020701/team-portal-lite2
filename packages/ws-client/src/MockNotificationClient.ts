import type {
  ConnectionStatus,
  NotificationPayload,
  NotificationType,
  WebSocketClientCallbacks,
} from './types';

/**
 * Generates a single simulated notification.
 *
 * Implementations build the human-readable {@link NotificationPayload.message}
 * however they like (e.g. localized via an i18n library); the client only
 * guarantees the surrounding envelope (id / createdAt / read).
 */
export type MockNotificationGenerator = () => Omit<
  NotificationPayload,
  'id' | 'createdAt' | 'read'
>;

/**
 * Configuration for {@link MockNotificationClient}.
 */
export interface MockNotificationClientConfig {
  /** Delay before the first periodic notification, in ms (default 12000). */
  interval?: number;
  /** Emit a burst of recent notifications on connect (default 2). */
  initialBurst?: number;
  /** Override the default notification generator. */
  generateNotification?: MockNotificationGenerator;
}

interface FullMockConfig extends Required<Omit<MockNotificationClientConfig, 'generateNotification'>> {
  generateNotification?: MockNotificationGenerator;
}

const DEFAULT_CONFIG: FullMockConfig = {
  interval: 12_000,
  initialBurst: 2,
};

function randomId(): string {
  return `mock-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function ticketNumber(): string {
  return `TK-${String(Math.floor(10000 + Math.random() * 89999))}`;
}

const MOCK_COMPANIES = ['Acme Corp', 'Globex', 'Initech', 'Umbrella LLC', 'Stark Industries'];
const MOCK_AGENTS = ['Alice Chen', 'Bob Wang', 'Carol Li', 'David Zhang', 'Emma Zhao'];

/**
 * Default, locale-neutral generator used when no override is supplied.
 * Roughly half of the events are "new ticket" alerts so the primary
 * feature of the bell is exercised out of the box.
 */
export function defaultMockNotificationGenerator(): Omit<
  NotificationPayload,
  'id' | 'createdAt' | 'read'
> {
  const roll = Math.random();
  const ticketId = ticketNumber();
  const company = MOCK_COMPANIES[Math.floor(Math.random() * MOCK_COMPANIES.length)] ?? 'Acme Corp';
  const agent = MOCK_AGENTS[Math.floor(Math.random() * MOCK_AGENTS.length)] ?? 'Alice Chen';

  let type: NotificationType;
  let message: string;
  if (roll < 0.5) {
    type = 'ticket_created';
    message = `New ticket ${ticketId} opened by ${company}`;
  } else if (roll < 0.75) {
    type = 'ticket_assigned';
    message = `Ticket ${ticketId} assigned to ${agent}`;
  } else if (roll < 0.92) {
    type = 'ticket_updated';
    message = `Ticket ${ticketId} was updated by ${agent}`;
  } else {
    type = 'mention';
    message = `${agent} mentioned you on ticket ${ticketId}`;
  }

  return { type, message, ticketId };
}

/**
 * A drop-in stand-in for {@link WebSocketClient} used when there is no real
 * WebSocket endpoint available (local development, product demos, design
 * review). It reports a `connected` status and periodically emits
 * notifications through the same `onStatusChange` / `onNotification`
 * callbacks, so the entire downstream pipeline (message queue, batching,
 * notification store, bell UI) is exercised without a live server.
 *
 * This class intentionally does NOT talk to the network and does NOT
 * participate in multi-tab leader election — each tab drives its own
 * simulated feed.
 */
export class MockNotificationClient {
  private readonly config: FullMockConfig;
  private readonly callbacks: WebSocketClientCallbacks;
  private status: ConnectionStatus = 'disconnected';
  private timer: ReturnType<typeof setTimeout> | null = null;
  private active = false;

  constructor(
    config: MockNotificationClientConfig = {},
    callbacks: WebSocketClientCallbacks = {},
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.callbacks = callbacks;
  }

  /**
   * Starts the simulated feed: reports `connected`, replays a small burst
   * of "recent" notifications, then schedules periodic new ones.
   */
  connect(): void {
    if (this.active) return;
    this.active = true;
    this.setStatus('connecting');

    // Simulate a short handshake round-trip before going connected.
    this.timer = setTimeout(() => {
      if (!this.active) return;
      this.setStatus('connected');

      const burst = this.config.initialBurst;
      for (let i = burst - 1; i >= 0; i -= 1) {
        this.callbacks.onNotification?.(this.buildNotification(i * 45_000));
      }

      this.scheduleNext();
    }, 300);
  }

  /**
   * Stops the simulated feed and reports `disconnected`.
   */
  disconnect(): void {
    this.active = false;
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.setStatus('disconnected');
  }

  /**
   * Pushes an immediate notification (useful for manual demos / tests),
   * regardless of the periodic schedule.
   */
  emit(override?: Partial<NotificationPayload>): NotificationPayload {
    const notification = this.buildNotification(0, override);
    this.callbacks.onNotification?.(notification);
    return notification;
  }

  // ---- internals ----

  private scheduleNext(): void {
    if (!this.active) return;
    this.timer = setTimeout(() => {
      if (!this.active) return;
      this.callbacks.onNotification?.(this.buildNotification(0));
      this.scheduleNext();
    }, this.config.interval);
  }

  private buildNotification(
    ageMs: number,
    override?: Partial<NotificationPayload>,
  ): NotificationPayload {
    const generator = this.config.generateNotification ?? defaultMockNotificationGenerator;
    const generated = generator();
    return {
      id: randomId(),
      createdAt: new Date(Date.now() - ageMs).toISOString(),
      read: false,
      ...generated,
      ...override,
    };
  }

  private setStatus(status: ConnectionStatus): void {
    if (this.status === status) return;
    this.status = status;
    this.callbacks.onStatusChange?.(status);
  }
}
