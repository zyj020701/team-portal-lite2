'use client';

import { useCallback, useEffect, useRef } from 'react';
import type { UIEvent } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

/**
 * Props for the {@link useVirtualList} hook.
 * @typeParam T - The type of items in the list.
 */
export interface UseVirtualListOptions<T> {
  /** The data items to virtualize. */
  items: T[];
  /** Returns a unique business key for each item (never an array index). */
  itemKey: (item: T, index: number) => string | number;
  /** Called when the user scrolls near the bottom to load more data. */
  onLoadMore?: () => void;
  /** Whether there is more data to load. */
  hasMore?: boolean;
  /** Whether data is currently loading (prevents duplicate onLoadMore calls). */
  isLoading?: boolean;
  /** Estimated row height before measurement. Defaults to 72. */
  estimateSize?: number;
  /** Number of items rendered outside the viewport. Defaults to 5. */
  overscan?: number;
  /** Number of estimated rows from the bottom at which to trigger onLoadMore. Defaults to 5. */
  loadMoreThreshold?: number;
}

/**
 * Return value of the {@link useVirtualList} hook.
 */
export interface UseVirtualListResult {
  /** Ref to attach to the scroll container element. */
  parentRef: React.RefObject<HTMLDivElement>;
  /** The items currently rendered by the virtualizer. */
  virtualItems: ReturnType<ReturnType<typeof useVirtualizer>['getVirtualItems']>;
  /** Total pixel height of the virtualized content. */
  totalSize: number;
  /** Measure callback to attach to each row via `ref`. */
  measureElement: (node: Element | null) => void;
  /** Scroll handler to attach to the scroll container. */
  handleScroll: (e: UIEvent<HTMLDivElement>) => void;
  /** Imperatively scroll to the item at the given index. */
  scrollToIndex: (index: number, options?: { align?: 'start' | 'center' | 'end' | 'auto' }) => void;
}

const DEFAULT_ESTIMATE = 72;
const DEFAULT_OVERSCAN = 5;
const LOAD_MORE_THRESHOLD = 5;

/**
 * Encapsulates virtual-scroll setup for a list of `items`: dynamic row
 * measurement, imperative `scrollToIndex`, and near-bottom `onLoadMore`
 * triggering with a debounce guard to avoid duplicate calls.
 *
 * @typeParam T - The type of items in the list.
 */
export function useVirtualList<T>({
  items,
  itemKey,
  onLoadMore,
  hasMore = false,
  isLoading = false,
  estimateSize = DEFAULT_ESTIMATE,
  overscan = DEFAULT_OVERSCAN,
  loadMoreThreshold = LOAD_MORE_THRESHOLD,
}: UseVirtualListOptions<T>): UseVirtualListResult {
  const parentRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);

  const rowVirtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize,
    overscan,
    getItemKey: (index) => {
      const item = items[index];
      if (item === undefined) return index;
      return itemKey(item, index);
    },
  });

  const handleScroll = useCallback(
    (e: UIEvent<HTMLDivElement>) => {
      if (!onLoadMore || !hasMore || isLoading || loadingRef.current) return;

      const el = e.currentTarget;
      const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;

      if (distanceFromBottom < loadMoreThreshold * estimateSize) {
        // Engage a lock so the same near-bottom scroll does not fire
        // onLoadMore repeatedly. The lock is released once `isLoading`
        // flips back to false (see effect below).
        loadingRef.current = true;
        onLoadMore();
      }
    },
    [onLoadMore, hasMore, isLoading, estimateSize, loadMoreThreshold],
  );

  // Release the loading lock whenever a load finishes (isLoading → false).
  useEffect(() => {
    if (!isLoading) {
      loadingRef.current = false;
    }
  }, [isLoading]);

  const scrollToIndex = useCallback(
    (index: number, options?: { align?: 'start' | 'center' | 'end' | 'auto' }) => {
      rowVirtualizer.scrollToIndex(index, {
        align: options?.align ?? 'start',
      });
    },
    [rowVirtualizer],
  );

  return {
    parentRef,
    virtualItems: rowVirtualizer.getVirtualItems(),
    totalSize: rowVirtualizer.getTotalSize(),
    measureElement: rowVirtualizer.measureElement,
    handleScroll,
    scrollToIndex,
  };
}
