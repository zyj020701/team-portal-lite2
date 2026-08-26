'use client';

import { forwardRef, useImperativeHandle, type ReactNode } from 'react';
import { cn } from '@team-portal/utils';
import { useVirtualList } from '../../hooks/use-virtual-list';

/**
 * Props for the VirtualList component.
 * @typeParam T - The type of items in the list.
 */
export interface VirtualListProps<T> {
  /** The data items to render. */
  items: T[];
  /** Returns a unique key for each item (must be a business ID, never an array index). */
  itemKey: (item: T, index: number) => string | number;
  /** Renders a single item. */
  renderItem: (item: T, index: number) => ReactNode;
  /** Called when the user scrolls near the bottom to load more data. */
  onLoadMore?: () => void;
  /** Whether there is more data to load. When false, onLoadMore will not be called. */
  hasMore?: boolean;
  /** Whether data is currently loading (prevents duplicate onLoadMore calls). */
  isLoading?: boolean;
  /** Estimated row height in pixels before measurement. Defaults to 72. */
  estimateSize?: number;
  /** Number of items from the bottom at which to trigger onLoadMore. Defaults to 5. */
  overscan?: number;
  /** Additional CSS class for the scroll container. */
  className?: string;
  /** Content shown when items is empty. */
  emptyPlaceholder?: ReactNode;
  /** Content shown at the bottom while loading more. */
  loadingPlaceholder?: ReactNode;
  /** Content shown when hasMore is false and items exist. */
  endPlaceholder?: ReactNode;
  /** When set, shows an error state instead of the list. */
  error?: Error | null;
  /** Content shown in the error state. */
  errorPlaceholder?: ReactNode;
  /** Called when the user clicks retry in the error state. */
  onRetry?: () => void;
}

/** Imperative handle exposed by VirtualList via ref. */
export interface VirtualListHandle {
  /** Scroll to the item at the given index. */
  scrollToIndex: (index: number, options?: { align?: 'start' | 'center' | 'end' | 'auto' }) => void;
}

const DEFAULT_ESTIMATE = 72;
const DEFAULT_OVERSCAN = 5;

function VirtualListInner<T>(props: VirtualListProps<T>, ref: React.Ref<VirtualListHandle>) {
  const {
    items,
    itemKey,
    renderItem,
    onLoadMore,
    hasMore = false,
    isLoading = false,
    estimateSize = DEFAULT_ESTIMATE,
    overscan = DEFAULT_OVERSCAN,
    className,
    emptyPlaceholder,
    loadingPlaceholder,
    endPlaceholder,
    error = null,
    errorPlaceholder,
    onRetry,
  } = props;

  const { parentRef, virtualItems, totalSize, measureElement, handleScroll, scrollToIndex } =
    useVirtualList({
      items,
      itemKey,
      onLoadMore,
      hasMore,
      isLoading,
      estimateSize,
      overscan,
    });

  useImperativeHandle(
    ref,
    () => ({
      scrollToIndex: (index, options) => scrollToIndex(index, options),
    }),
    [scrollToIndex],
  );

  if (error) {
    return (
      <div
        className={cn(
          'flex h-full w-full flex-1 flex-col items-center justify-center gap-3 overflow-auto text-neutral-500',
          className,
        )}
        role="alert"
      >
        {errorPlaceholder ?? (
          <>
            <span className="text-base">加载失败</span>
            <span className="text-sm text-neutral-500">{error.message}</span>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="mt-1 rounded-medium bg-primary-500 px-4 py-1.5 text-sm text-white hover:bg-primary-600"
              >
                重试
              </button>
            )}
          </>
        )}
      </div>
    );
  }

  const isEmpty = items.length === 0;

  if (isEmpty) {
    return (
      <div
        className={cn(
          'flex h-full w-full flex-1 items-center justify-center overflow-auto text-neutral-500',
          className,
        )}
      >
        {emptyPlaceholder ?? <span>暂无数据</span>}
      </div>
    );
  }

  return (
    <div
      ref={parentRef}
      onScroll={handleScroll}
      className={cn('h-full w-full flex-1 overflow-auto', className)}
      role="list"
      aria-rowcount={items.length}
    >
      <div
        style={{
          height: `${totalSize}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualItems.map((virtualRow) => {
          const item = items[virtualRow.index];
          if (item === undefined) return null;
          return (
            <div
              key={virtualRow.key}
              data-index={virtualRow.index}
              ref={measureElement}
              role="listitem"
              aria-rowindex={virtualRow.index + 1}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              {renderItem(item, virtualRow.index)}
            </div>
          );
        })}
      </div>
      {isLoading && (
        <div className="flex w-full items-center justify-center py-4 text-neutral-500">
          {loadingPlaceholder ?? (
            <span className="inline-flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-300 border-t-primary-500" />
              加载中…
            </span>
          )}
        </div>
      )}
      {!hasMore && !isLoading && items.length > 0 && (
        <div className="py-4 text-center text-sm text-neutral-500">
          {endPlaceholder ?? '已加载全部'}
        </div>
      )}
    </div>
  );
}

/**
 * A generic virtualized list component that only renders visible rows.
 * Supports dynamic row heights via `measureElement`, imperative
 * `scrollToIndex`, and infinite scroll via `onLoadMore`.
 *
 * @typeParam T - The type of items in the list.
 */
export const VirtualList = forwardRef(VirtualListInner) as <T>(
  props: VirtualListProps<T> & { ref?: React.Ref<VirtualListHandle> },
) => ReturnType<typeof VirtualListInner>;
