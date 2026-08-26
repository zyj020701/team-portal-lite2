import type { NotificationPayload } from './types';

/**
 * Messages exchanged between tabs via BroadcastChannel.
 */
export type TabMessage =
  | { type: 'leader_elected'; tabId: string }
  | { type: 'leader_hb'; tabId: string }
  | { type: 'notification'; notification: NotificationPayload }
  | { type: 'mark_read'; notificationIds: string[] }
  | { type: 'mark_all_read' }
  | { type: 'request_state' }
  | { type: 'state_response'; unreadCount: number; notifications: NotificationPayload[] };

/**
 * Coordinates a single WebSocket connection across multiple browser tabs
 * using the BroadcastChannel API and a simple leader-election protocol.
 *
 * Protocol:
 * 1. Each tab generates a unique tabId on load.
 * 2. Tabs broadcast a `leader_elected` claim.
 * 3. The first tab to claim leadership (lowest tabId wins on conflict)
 *    maintains the WebSocket connection.
 * 4. The leader broadcasts a heartbeat every 5s.
 * 5. If a follower doesn't receive a heartbeat within 15s, it triggers
 *    a new election.
 * 6. The leader relays notifications to followers via BroadcastChannel.
 *
 * This ensures only one WebSocket connection exists per browser,
 * reducing server load and keeping unread counts in sync.
 */
export class TabCoordinator {
  private readonly channel: BroadcastChannel;
  private readonly tabId: string;
  private isLeader = false;
  private leaderId: string | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private leaderTimeoutTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly onBecomeLeader: () => void;
  private readonly onLoseLeadership: () => void;
  private readonly onRemoteNotification: (n: NotificationPayload) => void;
  private readonly onRemoteMarkRead: (ids: string[]) => void;
  private readonly onRemoteMarkAllRead: () => void;
  private readonly onStateRequest: () => void;

  constructor(
    channelName: string,
    handlers: {
      onBecomeLeader: () => void;
      onLoseLeadership: () => void;
      onRemoteNotification: (n: NotificationPayload) => void;
      onRemoteMarkRead: (ids: string[]) => void;
      onRemoteMarkAllRead: () => void;
      onStateRequest: () => void;
    },
  ) {
    this.tabId = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    this.channel = new BroadcastChannel(channelName);
    this.onBecomeLeader = handlers.onBecomeLeader;
    this.onLoseLeadership = handlers.onLoseLeadership;
    this.onRemoteNotification = handlers.onRemoteNotification;
    this.onRemoteMarkRead = handlers.onRemoteMarkRead;
    this.onRemoteMarkAllRead = handlers.onRemoteMarkAllRead;
    this.onStateRequest = handlers.onStateRequest;

    this.channel.onmessage = this.handleMessage;
    this.startElection();
  }

  /**
   * Whether this tab is the elected leader (owns the WebSocket).
   */
  get leader(): boolean {
    return this.isLeader;
  }

  /**
   * Broadcasts a notification to all other tabs.
   */
  broadcastNotification(notification: NotificationPayload): void {
    this.channel.postMessage({
      type: 'notification',
      notification,
    } satisfies TabMessage);
  }

  /**
   * Broadcasts mark-read events to other tabs.
   */
  broadcastMarkRead(notificationIds: string[]): void {
    this.channel.postMessage({
      type: 'mark_read',
      notificationIds,
    } satisfies TabMessage);
  }

  /**
   * Broadcasts mark-all-read to other tabs.
   */
  broadcastMarkAllRead(): void {
    this.channel.postMessage({ type: 'mark_all_read' } satisfies TabMessage);
  }

  /**
   * Broadcasts current state to a newly opened tab.
   */
  broadcastState(unreadCount: number, notifications: NotificationPayload[]): void {
    this.channel.postMessage({
      type: 'state_response',
      unreadCount,
      notifications,
    } satisfies TabMessage);
  }

  /**
   * Closes the channel and cleans up timers.
   */
  destroy(): void {
    this.clearTimers();
    this.channel.onmessage = null;
    this.channel.close();
    if (this.isLeader) {
      this.isLeader = false;
      this.onLoseLeadership();
    }
  }

  // ---- Private ----

  private startElection(): void {
    // Announce leadership claim
    this.channel.postMessage({
      type: 'leader_elected',
      tabId: this.tabId,
    } satisfies TabMessage);

    // Wait briefly for other tabs to respond. If no higher-priority
    // leader appears, assume leadership.
    setTimeout(() => {
      if (this.leaderId === null || this.leaderId === this.tabId) {
        this.assumeLeadership();
      }
    }, 500);
  }

  private assumeLeadership(): void {
    this.isLeader = true;
    this.leaderId = this.tabId;
    this.startHeartbeat();
    this.onBecomeLeader();
  }

  private startHeartbeat(): void {
    this.clearTimers();
    this.heartbeatTimer = setInterval(() => {
      this.channel.postMessage({
        type: 'leader_hb',
        tabId: this.tabId,
      } satisfies TabMessage);
    }, 5_000);
  }

  private resetLeaderTimeout(): void {
    if (this.leaderTimeoutTimer !== null) {
      clearTimeout(this.leaderTimeoutTimer);
    }
    this.leaderTimeoutTimer = setTimeout(() => {
      // Leader timed out — start a new election
      this.leaderId = null;
      if (!this.isLeader) {
        this.startElection();
      }
    }, 15_000);
  }

  private clearTimers(): void {
    if (this.heartbeatTimer !== null) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    if (this.leaderTimeoutTimer !== null) {
      clearTimeout(this.leaderTimeoutTimer);
      this.leaderTimeoutTimer = null;
    }
  }

  private handleMessage = (event: MessageEvent<TabMessage>): void => {
    const msg = event.data;

    switch (msg.type) {
      case 'leader_elected':
        if (!this.isLeader && (this.leaderId === null || msg.tabId < this.tabId)) {
          this.leaderId = msg.tabId;
          this.resetLeaderTimeout();
        } else if (this.isLeader && msg.tabId < this.tabId) {
          // Another tab with lower id wins — step down
          this.isLeader = false;
          this.leaderId = msg.tabId;
          this.clearTimers();
          this.onLoseLeadership();
          this.resetLeaderTimeout();
        }
        break;

      case 'leader_hb':
        if (msg.tabId !== this.tabId) {
          this.leaderId = msg.tabId;
          if (this.isLeader) {
            this.isLeader = false;
            this.clearTimers();
            this.onLoseLeadership();
          }
          this.resetLeaderTimeout();
        }
        break;

      case 'notification':
        if (!this.isLeader) {
          this.onRemoteNotification(msg.notification);
        }
        break;

      case 'mark_read':
        if (!this.isLeader) {
          this.onRemoteMarkRead(msg.notificationIds);
        }
        break;

      case 'mark_all_read':
        if (!this.isLeader) {
          this.onRemoteMarkAllRead();
        }
        break;

      case 'request_state':
        if (this.isLeader) {
          this.onStateRequest();
        }
        break;

      case 'state_response':
        // Handled at hook level via onRemoteNotification etc.
        break;
    }
  };
}
