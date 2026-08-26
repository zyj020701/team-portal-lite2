'use client';
import { cn } from '@team-portal/utils';

export interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({ page, pageSize, total, onPageChange, className }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const canPrev = page > 1;
  const canNext = page < totalPages;

  const pages: number[] = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, start + 4);
  for (let i = start; i <= end; i++) pages.push(i);

  const btnBase =
    'inline-flex h-9 min-w-9 items-center justify-center rounded-medium px-3 text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500';

  return (
    <nav aria-label="分页" className={cn('flex items-center gap-1', className)}>
      <button
        type="button"
        className={cn(
          btnBase,
          'border border-neutral-200',
          !canPrev && 'opacity-50 cursor-not-allowed',
        )}
        onClick={() => canPrev && onPageChange(page - 1)}
        disabled={!canPrev}
        aria-label="上一页"
      >
        ‹
      </button>
      {pages.map((p) => (
        <button
          key={p}
          type="button"
          className={cn(
            btnBase,
            p === page
              ? 'bg-primary-500 text-white'
              : 'border border-neutral-200 hover:bg-neutral-50',
          )}
          onClick={() => onPageChange(p)}
          aria-current={p === page ? 'page' : undefined}
        >
          {p}
        </button>
      ))}
      <button
        type="button"
        className={cn(
          btnBase,
          'border border-neutral-200',
          !canNext && 'opacity-50 cursor-not-allowed',
        )}
        onClick={() => canNext && onPageChange(page + 1)}
        disabled={!canNext}
        aria-label="下一页"
      >
        ›
      </button>
      <span className="ml-2 text-sm text-neutral-500">
        共 {total} 条 / {totalPages} 页
      </span>
    </nav>
  );
}
