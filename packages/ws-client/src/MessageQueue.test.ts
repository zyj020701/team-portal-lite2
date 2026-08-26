import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MessageQueue } from './MessageQueue';
import type { NotificationPayload } from './types';

function makeNotification(id: string): NotificationPayload {
  return {
    id,
    type: 'ticket_assigned',
    message: `msg ${id}`,
    createdAt: new Date().toISOString(),
    read: false,
  };
}

describe('MessageQueue', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts empty', () => {
    const queue = new MessageQueue(vi.fn());
    expect(queue.size).toBe(0);
  });

  it('flushes a single enqueued notification on the next animation frame', () => {
    const onFlush = vi.fn();
    const queue = new MessageQueue(onFlush);

    queue.enqueue(makeNotification('n-1'));
    expect(queue.size).toBe(1);
    // Nothing has flushed yet.
    expect(onFlush).not.toHaveBeenCalled();

    // Advance past the rAF scheduling (setTimeout fallback in jsdom).
    vi.advanceTimersByTime(16);

    expect(onFlush).toHaveBeenCalledTimes(1);
    expect(onFlush).toHaveBeenCalledWith([expect.objectContaining({ id: 'n-1' })]);
    expect(queue.size).toBe(0);
  });

  it('coalesces multiple enqueues into a single flush', () => {
    const onFlush = vi.fn();
    const queue = new MessageQueue(onFlush);

    queue.enqueue(makeNotification('a'));
    queue.enqueue(makeNotification('b'));
    queue.enqueue(makeNotification('c'));

    vi.advanceTimersByTime(16);

    expect(onFlush).toHaveBeenCalledTimes(1);
    const batch = onFlush.mock.calls[0]?.[0] as NotificationPayload[];
    expect(batch).toHaveLength(3);
    expect(batch.map((n) => n.id)).toEqual(['a', 'b', 'c']);
  });

  it('flushes immediately when the queue reaches maxBatchSize', () => {
    const onFlush = vi.fn();
    const queue = new MessageQueue(onFlush, 3);

    queue.enqueue(makeNotification('1'));
    queue.enqueue(makeNotification('2'));
    expect(onFlush).not.toHaveBeenCalled();

    queue.enqueue(makeNotification('3'));
    // The third item triggers an immediate synchronous flush.
    expect(onFlush).toHaveBeenCalledTimes(1);
    expect(onFlush.mock.calls[0]?.[0]).toHaveLength(3);
    expect(queue.size).toBe(0);
  });

  it('enqueueBatch flushes all notifications immediately', () => {
    const onFlush = vi.fn();
    const queue = new MessageQueue(onFlush);

    queue.enqueueBatch([makeNotification('x'), makeNotification('y')]);

    expect(onFlush).toHaveBeenCalledTimes(1);
    expect(onFlush.mock.calls[0]?.[0]).toHaveLength(2);
  });

  it('clear empties the queue without flushing', () => {
    const onFlush = vi.fn();
    const queue = new MessageQueue(onFlush);

    queue.enqueue(makeNotification('a'));
    queue.clear();

    expect(queue.size).toBe(0);
    vi.advanceTimersByTime(100);
    expect(onFlush).not.toHaveBeenCalled();
  });

  it('flush is a no-op when there is nothing pending and resets scheduled state', () => {
    const onFlush = vi.fn();
    const queue = new MessageQueue(onFlush);

    // Calling flush on an already-empty queue must not throw or invoke.
    expect(() => queue.flush()).not.toThrow();
    expect(onFlush).not.toHaveBeenCalled();
  });
});
