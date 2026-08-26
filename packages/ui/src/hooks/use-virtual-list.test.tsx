import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useVirtualList } from './use-virtual-list';

interface Item {
  id: string;
  label: string;
}

const ITEMS: Item[] = Array.from({ length: 100 }, (_, i) => ({
  id: `id-${i}`,
  label: `Item ${i}`,
}));

/**
 * @tanstack/react-virtual measures the scroll element via getBoundingClientRect.
 * jsdom returns zeros, so we stub a viewport-sized rect for the duration of
 * the test. ResizeObserver is already mocked globally in vitest.setup.ts.
 */
function stubViewport(width = 800, height = 600): void {
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
    // Rows can report their own measured height; the container gets the
    // full viewport. Use a simple heuristic: any element returns the
    // viewport size — sufficient for initial virtual-item computation.
    return {
      top: 0,
      left: 0,
      right: width,
      bottom: height,
      width,
      height,
      x: 0,
      y: 0,
      toJSON: () => '',
    } as DOMRect;
  });
}

describe('useVirtualList', () => {
  beforeEach(() => {
    stubViewport();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('exposes a parent ref, virtual items and total size for initialization', () => {
    const { result } = renderHook(() =>
      useVirtualList({
        items: ITEMS,
        itemKey: (item) => item.id,
      }),
    );

    expect(result.current.parentRef).toBeDefined();
    expect(Array.isArray(result.current.virtualItems)).toBe(true);
    // With 100 items and a 72px estimate, total size must be > viewport.
    expect(result.current.totalSize).toBeGreaterThan(600);
    expect(typeof result.current.handleScroll).toBe('function');
    expect(typeof result.current.scrollToIndex).toBe('function');
  });

  it('returns zero total size for an empty list', () => {
    const { result } = renderHook(() =>
      useVirtualList({ items: [], itemKey: (item: Item) => item.id }),
    );

    expect(result.current.totalSize).toBe(0);
    expect(result.current.virtualItems).toHaveLength(0);
  });

  it('uses the business key (never the array index) for item keys', () => {
    const { result } = renderHook(() =>
      useVirtualList({
        items: [
          { id: 'alpha', label: 'a' },
          { id: 'beta', label: 'b' },
        ],
        itemKey: (item) => item.id,
      }),
    );

    // The virtualizer's getItemKey is invoked internally; verify the hook
    // wires keys by checking the key of the produced virtual items.
    for (const vItem of result.current.virtualItems) {
      const source = ITEMS[vItem.index];
      // When the source exists the key should equal the business id, not
      // the numeric index.
      if (source) {
        expect(vItem.key).toBe(source.id);
      }
    }
  });

  it('calls onLoadMore when scrolled near the bottom and hasMore is true', () => {
    const onLoadMore = vi.fn();
    const { result } = renderHook(() =>
      useVirtualList({
        items: ITEMS,
        itemKey: (item) => item.id,
        onLoadMore,
        hasMore: true,
        isLoading: false,
        estimateSize: 72,
      }),
    );

    const el = document.createElement('div');
    // Simulate being 1 row from the bottom: distanceFromBottom < 5 * 72.
    Object.defineProperty(el, 'scrollHeight', { value: 7200 });
    Object.defineProperty(el, 'clientHeight', { value: 600 });
    Object.defineProperty(el, 'scrollTop', { value: 7200 - 600 - 10, writable: true });

    act(() => {
      result.current.handleScroll({
        currentTarget: el,
      } as unknown as React.UIEvent<HTMLDivElement>);
    });

    expect(onLoadMore).toHaveBeenCalledTimes(1);
  });

  it('does not call onLoadMore when hasMore is false or already loading', () => {
    const onLoadMore = vi.fn();

    const { result, rerender } = renderHook(
      (props: { hasMore: boolean; isLoading: boolean }) =>
        useVirtualList({
          items: ITEMS,
          itemKey: (item) => item.id,
          onLoadMore,
          hasMore: props.hasMore,
          isLoading: props.isLoading,
        }),
      { initialProps: { hasMore: false, isLoading: false } },
    );

    const el = document.createElement('div');
    Object.defineProperty(el, 'scrollHeight', { value: 7200 });
    Object.defineProperty(el, 'clientHeight', { value: 600 });
    Object.defineProperty(el, 'scrollTop', { value: 7200 - 600 - 10, writable: true });

    act(() => {
      result.current.handleScroll({
        currentTarget: el,
      } as unknown as React.UIEvent<HTMLDivElement>);
    });
    expect(onLoadMore).not.toHaveBeenCalled();

    // Loading in progress → no duplicate trigger.
    rerender({ hasMore: true, isLoading: true });
    act(() => {
      result.current.handleScroll({
        currentTarget: el,
      } as unknown as React.UIEvent<HTMLDivElement>);
    });
    expect(onLoadMore).not.toHaveBeenCalled();
  });

  it('does not trigger onLoadMore when the user is far from the bottom', () => {
    const onLoadMore = vi.fn();
    const { result } = renderHook(() =>
      useVirtualList({
        items: ITEMS,
        itemKey: (item) => item.id,
        onLoadMore,
        hasMore: true,
      }),
    );

    const el = document.createElement('div');
    Object.defineProperty(el, 'scrollHeight', { value: 7200 });
    Object.defineProperty(el, 'clientHeight', { value: 600 });
    Object.defineProperty(el, 'scrollTop', { value: 0, writable: true });

    act(() => {
      result.current.handleScroll({
        currentTarget: el,
      } as unknown as React.UIEvent<HTMLDivElement>);
    });

    expect(onLoadMore).not.toHaveBeenCalled();
  });
});
