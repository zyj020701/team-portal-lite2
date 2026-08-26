'use client';
import { type ReactNode } from 'react';
import { cn } from '@team-portal/utils';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  onNavigate?: (href: string) => void;
  className?: string;
}

export function Breadcrumb({ items, onNavigate, className }: BreadcrumbProps) {
  return (
    <nav aria-label="面包屑导航" className={className}>
      <ol className="flex items-center gap-1 text-sm text-neutral-500">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-1">
              {item.href && !isLast ? (
                <button
                  type="button"
                  className="hover:text-primary-600 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded"
                  onClick={() => onNavigate?.(item.href!)}
                >
                  {item.label}
                </button>
              ) : (
                <span
                  className={cn(isLast && 'text-neutral-900 font-medium')}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {item.label}
                </span>
              )}
              {!isLast && (
                <span className="text-neutral-300" aria-hidden="true">
                  /
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export interface BreadcrumbSkeletonProps {
  className?: string;
}

export function BreadcrumbSkeleton({ className }: BreadcrumbSkeletonProps): ReactNode {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="h-4 w-16 animate-pulse rounded bg-neutral-200" />
      <span className="text-neutral-300">/</span>
      <div className="h-4 w-20 animate-pulse rounded bg-neutral-200" />
    </div>
  );
}
