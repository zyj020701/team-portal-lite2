/**
 * TanStack Query key factories.
 *
 * This module is server-safe (no "use client" directive) so that RSC pages
 * can reference query keys during prefetch without importing client hooks.
 *
 * Naming convention: [实体, 操作, 参数]
 */
export const dashboardKeys = {
  all: ['dashboard'] as const,
  stats: (locale: string) => [...dashboardKeys.all, 'stats', locale] as const,
};

export const ticketKeys = {
  all: ['tickets'] as const,
  lists: () => [...ticketKeys.all, 'list'] as const,
  list: (filters: Readonly<Record<string, unknown>>) => [...ticketKeys.lists(), filters] as const,
  details: () => [...ticketKeys.all, 'detail'] as const,
  detail: (id: string) => [...ticketKeys.details(), id] as const,
};
