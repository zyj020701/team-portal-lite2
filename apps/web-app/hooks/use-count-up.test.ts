import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCountUp } from './use-count-up';

describe('useCountUp', () => {
  let rafCallbacks: FrameRequestCallback[];

  beforeEach(() => {
    rafCallbacks = [];
    let now = 0;
    vi.useFakeTimers();
    vi.stubGlobal(
      'requestAnimationFrame',
      vi.fn((cb: FrameRequestCallback) => {
        rafCallbacks.push(cb);
        return rafCallbacks.length;
      }),
    );
    vi.stubGlobal(
      'cancelAnimationFrame',
      vi.fn((_id: number) => {
        /* no-op */
      }),
    );
    // Allow tests to advance the rAF clock and drain the frame queue.
    (globalThis as unknown as { __advanceRaf: (ms: number) => void }).__advanceRaf = (
      ms: number,
    ) => {
      const end = now + ms;
      // Drain callbacks; the hook reschedules itself until progress === 1,
      // so keep pumping frames until time catches up or no work remains.
      while (now < end) {
        now = Math.min(now + 16, end);
        const pending = rafCallbacks.splice(0, rafCallbacks.length);
        for (const cb of pending) cb(now);
      }
    };
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  function advanceRaf(ms: number): void {
    (globalThis as unknown as { __advanceRaf: (ms: number) => void }).__advanceRaf(ms);
  }

  it('starts at 0 and eases to the target over the duration', () => {
    const { result } = renderHook(() => useCountUp(100, 800));
    expect(result.current).toBe(0);

    // First frame initializes startRef and schedules another; advance past
    // two frames so progress is non-zero.
    act(() => advanceRaf(32));
    expect(result.current).toBeGreaterThan(0);
    expect(result.current).toBeLessThan(100);

    act(() => advanceRaf(800));
    expect(result.current).toBe(100);
  });

  it('restarts from the previous value when target changes', () => {
    const { result, rerender } = renderHook(
      ({ target }: { target: number }) => useCountUp(target, 800),
      { initialProps: { target: 100 } },
    );

    act(() => advanceRaf(800));
    expect(result.current).toBe(100);

    rerender({ target: 200 });
    expect(result.current).toBe(100);

    act(() => advanceRaf(800));
    expect(result.current).toBe(200);
  });

  it('defaults to an 800ms duration', () => {
    const { result } = renderHook(() => useCountUp(50));
    // At t=200ms (25% of default 800ms), easeOutCubic ≈ 0.58 → ~29.
    act(() => advanceRaf(200));
    expect(result.current).toBeGreaterThan(0);
    act(() => advanceRaf(800));
    expect(result.current).toBe(50);
  });
});
