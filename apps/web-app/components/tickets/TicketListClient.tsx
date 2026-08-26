'use client';

import { useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTicketsInfiniteQuery, flattenPages } from '../../hooks/use-tickets';
import { TicketList } from './TicketList';

export function TicketListClient() {
  const searchParams = useSearchParams();

  const filters = useMemo(
    () => ({
      status: searchParams.get('status')?.split(',') ?? [],
      priority: searchParams.get('priority')?.split(',') ?? [],
      assigneeId: searchParams.get('assigneeId') ?? undefined,
      keyword: searchParams.get('keyword') ?? '',
      date: searchParams.get('date') ?? undefined,
      sortField: searchParams.get('sortField') ?? undefined,
      sortDirection: (searchParams.get('sortDirection') as 'asc' | 'desc' | null) ?? undefined,
    }),
    [searchParams],
  );

  const { data, isLoading } = useTicketsInfiniteQuery(filters);

  const tickets = useMemo(() => flattenPages(data), [data]);

  return <TicketList tickets={tickets} isLoading={isLoading} />;
}
