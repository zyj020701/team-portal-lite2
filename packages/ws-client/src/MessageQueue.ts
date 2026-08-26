import type { NotificationPayload } from './types';

/**
 * Callback invoked when the queue flushes a batch of notifications.
 */
export type FlushCallback = (notifications: NotificationPayload[]) => void;

/**
 * Batches incoming notifications using requestAnimationFrame.
 *
 * When messages arrive at high frequency (e.g. 100 messages in one second),
 * this queue coalesces them into a single rAF callback, dramatically reducing
 * React re-renders.
 *
 * If the queue grows beyond `maxBatchSize`, it flushes immediately to
 * prevent unbounded memory growth.
 */
export class MessageQueue {
  private queue: NotificationPayload[] = [];
  private scheduled = false;
  private readonly flushCallback: FlushCallback;
  private readonly maxBatchSize: number;

  constructor(flushCallback: FlushCallback, maxBatchSize = 50) {
    this.flushCallback = flushCallback;
    this.maxBatchSize = maxBatchSize;
  }

  /**
   * Enqueues a single notification. Schedules a rAF flush if not already.
   */
  enqueue(notification: NotificationPayload): void {
    this.queue.push(notification);

    if (this.queue.length >= this.maxBatchSize) {
      this.flush();
      return;
    }

    if (!this.scheduled) {
      this.scheduled = true;
      // Use globalThis to be safe in non-browser (SSR) environments.
      const raf =
        typeof globalThis.requestAnimationFrame === 'function'
          ? globalThis.requestAnimationFrame
          : (cb: FrameRequestCallback): number =>
              setTimeout(() => cb(Date.now()), 16) as unknown as number;

      raf(() => this.flush());
    }
  }

  /**
   * Enqueues multiple notifications at once.
   */
  enqueueBatch(notifications: NotificationPayload[]): void {
    for (const n of notifications) {
      this.queue.push(n);
    }
    if (this.queue.length > 0) {
      this.flush();
    }
  }

  /**
   * Immediately flushes all pending notifications.
   */
  flush(): void {
    if (this.queue.length === 0) {
      this.scheduled = false;
      return;
    }

    const batch = this.queue;
    this.queue = [];
    this.scheduled = false;
    this.flushCallback(batch);
  }

  /**
   * Clears the queue without flushing.
   */
  clear(): void {
    this.queue = [];
    this.scheduled = false;
  }

  /**
   * Returns the number of pending notifications.
   */
  get size(): number {
    return this.queue.length;
  }
}
