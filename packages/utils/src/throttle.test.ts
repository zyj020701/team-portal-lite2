import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { throttle } from './throttle';

describe('throttle', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('invokes on the leading edge by default', () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 200);

    throttled('first');
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('first');
  });

  it('suppresses additional calls within the wait window', () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 200);

    throttled();
    throttled();
    throttled();
    expect(fn).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(200);
    // the trailing call fires with the most recent args
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('uses the latest arguments for the trailing invocation', () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 200);

    throttled('a');
    throttled('b');
    vi.advanceTimersByTime(200);

    expect(fn).toHaveBeenLastCalledWith('b');
  });

  it('allows another leading call after the window elapses', () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 100);

    throttled();
    vi.advanceTimersByTime(100);
    throttled();
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('can disable the leading edge (trailing-only)', () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 100, { leading: false });

    throttled();
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('can disable the trailing edge (leading-only)', () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 100, { trailing: false });

    throttled();
    throttled();
    vi.advanceTimersByTime(200);

    // only the single leading call, no trailing
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('cancel() prevents a pending trailing invocation', () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 100);

    throttled();
    expect(fn).toHaveBeenCalledTimes(1);

    throttled();
    throttled.cancel();
    vi.advanceTimersByTime(200);

    // trailing call was cancelled, still just the one leading call
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('coalesces repeated calls across consecutive windows (trailing recursion)', () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 100);

    throttled('a'); // leading
    // 60ms later still within first window -> schedules/keeps trailing
    vi.advanceTimersByTime(60);
    throttled('b');
    // at 100ms the first trailing fires ('b') and schedules another window
    vi.advanceTimersByTime(40);
    expect(fn).toHaveBeenLastCalledWith('b');
    // no further calls in the second window -> the recursive trailing is a
    // no-op because lastArgs was cleared
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(2);
  });
});
